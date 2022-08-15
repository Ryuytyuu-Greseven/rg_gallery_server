import { ConfigService } from '@nestjs/config';
import { AppService } from './../app.service';
import { S3UploadService } from './s3-upload.service';
import { EncryptionService } from './../crypto/crypto.encryption';
import { UsersLogin } from 'src/schemas/UserLogins.schema';
import { Users } from './../schemas/Users.schema';

import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, startSession } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { ArtPosts } from 'src/schemas/ArtPosts.schema';
import { Request } from 'express';

@Injectable()
export class UsersService {
  salt = 13.7;

  ERROR_MESSAGES = {
    no_user: `No User Found With Given Credentials.`,
    account_exists: 'Account Already Exists.',
    internal_error: `Please Try Again.`,
    login_success: `Login Successfully.`,
    publish_success: `Art Published Successfully.`,
    fetch_success: `Fetched Successfully.`,
    user_id_available: `Requested User ID Available.`,
    user_id_not_available: `Requested User ID Not Available.Get Other One.`,
  };

  constructor(
    private jwtService: JwtService,
    private cryptService: EncryptionService,
    private s3UploadService: S3UploadService,
    private appService: AppService,
    private configService: ConfigService,
    @InjectConnection() private readonly connection: mongoose.Connection,
    @InjectModel('Users') private readonly usersModel: Model<Users>,
    @InjectModel('UsersLogin')
    private readonly usersLoginModel: Model<UsersLogin>,
    @InjectModel('ArtPosts') private readonly artPostsModel: Model<ArtPosts>,
  ) {}

  // checks and logins in user
  async checkLogin(request: any) {
    const result = { data: {}, success: true, message: '' };
    try {
      const decodedBody: any = await this.cryptService.decrypt(request);
      console.log(decodedBody);

      const userDetails: any = await this.fetchDetails(decodedBody.brave_id);

      if (userDetails.email) {
        if (await bcrypt.compare(decodedBody.password, userDetails.password)) {
          result.success = true;
          //   result.data = userDetails;
          result.data = await this.jwtLogin({
            email: userDetails.email,
            user_id: userDetails.user_id,
          });
          result.message = this.ERROR_MESSAGES.login_success;
        } else {
          result.success = false;
          result.message = this.ERROR_MESSAGES.no_user;
        }
      } else {
        result.success = false;
        result.message = this.ERROR_MESSAGES.no_user;
      }
    } catch (error) {
      console.log(error);
      result.success = false;
      result.message = this.ERROR_MESSAGES.internal_error;
    }
    const output = await this.cryptService.encrypt(request, result);
    return output;
  }

  async signUpUser(request: any) {
    const result = { data: {}, success: true, message: '' };
    try {
      const decodedBody: any = await this.cryptService.decrypt(request);
      console.log(decodedBody);

      const userDetails: any = await this.fetchDetails(decodedBody.brave_id);
      if (!userDetails.email) {
        console.log('check', decodedBody);

        const enc_password = await this.encPass(decodedBody.password);
        const login = new this.usersLoginModel({
          email: decodedBody.brave_id,
          password: enc_password,
          user_id: decodedBody.user_id,
        });
        const response = await login.save();
        console.log(response);

        const profile = new this.usersModel({
          user_id: decodedBody.user_id,
          email_id: decodedBody.brave_id,
          artist_name: decodedBody.profile_name,
        });
        const profile_data = await profile.save();
        console.log('profile data', profile_data);

        result.data = await this.jwtLogin({
          email: decodedBody.brave_id,
          user_id: decodedBody.user_id,
          profile_name: decodedBody.profile_name,
        });
        result.message = this.ERROR_MESSAGES.login_success;
      } else {
        result.success = false;
        result.message = this.ERROR_MESSAGES.account_exists;
      }
    } catch (error) {
      console.log(error);
      result.success = false;
      result.message = this.ERROR_MESSAGES.internal_error;
    }
    const output = await this.cryptService.encrypt(request, result);
    return output;
  }

  // send OTP to user and verify it
  async checkUserEmail(request: any) {
    const result = { success: true, message: '', otp: '' };
    try {
      const decodedBody: any = await this.cryptService.decrypt(request);
      console.log(decodedBody);

      const userDetails: any = await this.fetchDetails(decodedBody.brave_id);
      if (!userDetails.email) {
        const otp = this.randomStringGenerator(4);
        if (this.configService.get('NODE_ENV') === 'production') {
          await this.appService.sendMailToUser(decodedBody.brave_id, otp);
        }
        result.otp = otp;
      } else {
        result.success = false;
        result.message = this.ERROR_MESSAGES.account_exists;
      }
    } catch (error) {
      console.log(error);
      result.success = false;
      result.message = this.ERROR_MESSAGES.internal_error;
    }
    const output = await this.cryptService.encrypt(request, result);
    return output;
  }

  async publishArt(request: Request, file: any) {
    const result = { data: {}, success: true, message: '' };
    const trx = await this.connection.startSession();
    trx.startTransaction();
    const options = { session: trx, new: true };
    try {
      const user_details: any = request.user;
      // console.log(request.user, user_details);
      const decodedBody = await this.cryptService.decrypt(request);
      console.log(decodedBody);
      const file_type = file.originalname.split('.').pop();

      const file_name =
        'file_' + this.randomStringGenerator(15) + `.${file_type}`;
      const post = new this.artPostsModel(
        {
          description: decodedBody.description,
          user_id: user_details.user_id,
          file_name: file_name,
          upvotes: 0,
          downvotes: 0,
        },
        {},
        options,
      );
      const posted_data = await post.save();
      console.log(posted_data);

      await this.s3UploadService.uploadFileToS3(file_name, file.buffer);
      await trx.commitTransaction();

      result.data = [posted_data];
      // result.data = await this.getPost({
      //   post_id: posted_data._id.toHexString(),
      // });
      console.log('\n\n\n\n\n\n\\n\n\n\n', result.data);

      result.message = this.ERROR_MESSAGES.publish_success;
    } catch (error) {
      console.log(error);
      result.success = false;
      result.message = this.ERROR_MESSAGES.internal_error;
      await trx.abortTransaction();
    }
    trx.endSession();
    const output = await this.cryptService.encrypt(request, result);
    return output;
  }

  async fetchPosts(request: Request) {
    const result = { data: {}, success: true, message: '' };
    try {
      const user_details: any = request.user;
      console.log(user_details);

      const decodedBody = await this.cryptService.decrypt(request);
      console.log(decodedBody);
      const data = await this.artPostsModel
        .aggregate([{ $addFields: { id: { $toString: '$_id' } } }])
        .lookup({
          from: 'art_votes',
          localField: 'id',
          foreignField: 'post_id',
          as: 'user_liked_details',
          // pipeline: [{ $match: { user_id: user_details.user_id } }],
        })
        .lookup({
          from: 'users',
          localField: 'user_id',
          foreignField: 'user_id',
          as: 'profile_details',
        })
        .limit(10)
        .skip((decodedBody.pageNo - 1) * 10)
        .exec();

      // .find({})
      // .skip((decodedBody.page - 1) * 10)
      // .limit(10)
      // .exec();
      console.log(data);

      result.data = data;
      result.message = this.ERROR_MESSAGES.fetch_success;
    } catch (error) {
      console.log(error);
      result.success = false;
      result.message = this.ERROR_MESSAGES.internal_error;
    }
    const output = await this.cryptService.encrypt(request, result);
    return output;
  }

  async getPost(body: any) {
    console.log(body);

    return this.artPostsModel
      .aggregate([
        {
          $addFields: { id: { $toString: '$_id' } },
        },
        { $match: { id: body.post_id } },
      ])
      .lookup({
        from: 'art_votes',
        localField: 'id',
        foreignField: 'post_id',
        as: 'user_liked_details',
        // pipeline: [{ $match: { user_id: user_details.user_id } }],
      })
      .lookup({
        from: 'users',
        localField: 'user_id',
        foreignField: 'user_id',
        as: 'profile_details',
      })
      .limit(1)
      .exec();
  }

  async fetchProfileDetails(request: Request) {
    console.log('Fetching Profile Details', request.user);

    const result = { details: {}, success: true, message: '' };
    try {
      const user_details: any = request.user;
      // console.log(user_details);

      const data = await this.usersModel
        .findOne({ user_id: user_details.user_id })
        .exec();
      console.log('User Profile Details', data);
      result.details = data;
      result.message = this.ERROR_MESSAGES.fetch_success;
    } catch (error) {
      console.log(error);
      result.success = false;
      result.message = this.ERROR_MESSAGES.internal_error;
    }
    const output = await this.cryptService.encrypt(request, result);
    return output;
  }

  async fetchDetails(email: string) {
    let result: any = {};
    try {
      const userDetails = await this.usersLoginModel.find({ email }).exec();
      console.log(userDetails);

      if (userDetails.length) {
        result = userDetails[0];
      } else {
        result = {};
      }
    } catch (error) {
      console.log(error);
    }
    return result;
  }

  async checkUserIdAvailablity(request: Request) {
    const result = { success: true, user_id: '', message: '' };
    const decodedBody = await this.cryptService.decrypt(request);
    console.log(decodedBody);
    result.user_id = decodedBody.user_id;
    try {
      const userIdsCount = await this.usersLoginModel.countDocuments({
        user_id: decodedBody.user_id,
      });
      console.log('user ids count', userIdsCount);

      if (userIdsCount) {
        result.success = false;
        result.message = this.ERROR_MESSAGES.user_id_not_available;
      } else {
        result.message = this.ERROR_MESSAGES.user_id_available;
      }
    } catch (error) {
      result.success = false;
      result.message = this.ERROR_MESSAGES.internal_error;
      console.log(error);
    }
    const output = await this.cryptService.encrypt(request, result);
    return output;
  }

  async jwtLogin(payload: any) {
    console.log('in jwt', payload);
    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '600m' }),
    };
  }

  async encPass(password: string) {
    return await bcrypt.hash(password, this.salt);
  }

  randomStringGenerator(count: number) {
    return randomBytes(count).toString('hex');
  }
}
