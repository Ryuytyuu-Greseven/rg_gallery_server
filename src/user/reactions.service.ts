import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Request } from 'express';
import { EncryptionService } from 'src/crypto/crypto.encryption';
import { ArtPosts } from 'src/schemas/ArtPosts.schema';
import { UsersLogin } from 'src/schemas/UserLogins.schema';
import { Users } from 'src/schemas/Users.schema';
import { ArtVotes } from 'src/schemas/ArtVotes.schema';
import mongoose, { Model } from 'mongoose';

export class ReactionsService {
  ERROR_MESSAGES = {
    internal_error: `Please Try Again.`,
    upvote_success: `Upvoted.`,
    downvote_success: `Downvoted.`,
  };

  constructor(
    private cryptService: EncryptionService,
    @InjectConnection() private readonly connection: mongoose.Connection,
    @InjectModel('Users') private readonly UsersModel: Model<Users>,
    @InjectModel('UsersLogin')
    private readonly usersLoginModel: Model<UsersLogin>,
    @InjectModel('ArtPosts') private readonly artPostsModel: Model<ArtPosts>,
    @InjectModel('ArtVotes') private readonly artVotesMOdel: Model<ArtVotes>,
  ) {}

  async upVote(request: Request) {
    const result = { data: {}, success: true, message: '' };
    // const trx = await this.connection.startSession();
    // trx.startTransaction();
    // const options = { session: trx, new: true };

    try {
      const decodedBody = await this.cryptService.decrypt(request);
      // console.log(decodedBody);

      const user_details: any = request.user;
      // const post = new this.artPostsModel();
      const [post_details]: any = await this.findPOst({ id: decodedBody.id });
      console.log('Actual Post Data --', post_details);

      let current_upvotes = post_details.upvotes;
      let current_downvotes = post_details.downvotes;
      if (decodedBody.upvote === 1 && !decodedBody.vote_id) {
        console.log('in one');

        const updateVote = new this.artVotesMOdel(
          {
            post_id: decodedBody.id,
            type: 1,
            user_id: user_details.user_id,
          },
          {},
          // options,
        );
        current_upvotes = current_upvotes + 1;
        await updateVote.save();
      } else if (decodedBody.downvote === 1 && !decodedBody.vote_id) {
        console.log('in two');

        const updateVote = new this.artVotesMOdel(
          {
            post_id: decodedBody.id,
            type: 2,
            user_id: user_details.user_id,
          },
          {},
          // options,
        );
        current_downvotes = current_downvotes + 1;
        await updateVote.save();
      } else if (decodedBody.upvote === 0) {
        console.log('in three');
        // const updateVote = new this.artVotesMOdel();
        await this.artVotesMOdel.deleteOne(
          { _id: decodedBody.vote_id },
          // options,
        );
        current_upvotes = current_upvotes - 1;
      } else if (decodedBody.downvote === 0) {
        console.log('in four');
        // const updateVote = new this.artVotesMOdel();
        await this.artVotesMOdel.deleteOne(
          { _id: decodedBody.vote_id },
          // options,
        );
        current_downvotes = current_downvotes - 1;
      } else if (decodedBody.upvote === 1 && decodedBody.vote_id) {
        console.log('in five');
        // const updateVote = new this.artVotesMOdel();
        await this.artVotesMOdel.updateOne(
          { _id: decodedBody.vote_id },
          { type: 1 },
          // options,
        );
        current_downvotes = current_downvotes - 1;
        current_upvotes = current_upvotes + 1;
      } else if (decodedBody.downvote === 1 && decodedBody.vote_id) {
        console.log('in six');
        // const updateVote = new this.artVotesMOdel();
        await this.artVotesMOdel.updateOne(
          { _id: decodedBody.vote_id },
          { type: 2 },
          // options,
        );
        current_downvotes = current_downvotes + 1;
        current_upvotes = current_upvotes - 1;
      }

      const updated_data = await this.artPostsModel.updateOne(
        { _id: decodedBody.id },
        { upvotes: current_upvotes, downvotes: current_downvotes },
        // options,
      );
      // await trx.commitTransaction();
      console.log('\n\n Updated Data --', updated_data);
      result.data = await this.findPOst({ id: decodedBody.id });
      result.message = this.ERROR_MESSAGES.upvote_success;
    } catch (error) {
      // await trx.abortTransaction();
      console.log('abort transaction', error);
      result.success = false;
      result.message = this.ERROR_MESSAGES.internal_error;
    }
    // trx.endSession();
    const output = await this.cryptService.encrypt(request, result);
    return output;
  }

  async findPOst(search: { id: string }) {
    return this.artPostsModel
      .aggregate([
        {
          $addFields: { id: { $toString: '$_id' } },
        },
        { $match: { id: search.id } },
      ])
      .lookup({
        from: 'art_votes',
        localField: 'id',
        foreignField: 'post_id',
        as: 'user_liked_details',
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

  // async update(request: Request) {
  //   const decodedBody = await this.cryptService.decrypt(request);

  //   const data = await this.artVotesMOdel.updateOne(
  //     { _id: decodedBody.id },
  //     { user_id: decodedBody.user_id, test: decodedBody.value },
  //   );
  //   console.log(data);
  //   const output = await this.cryptService.encrypt(request, { data });
  //   return output;
  // }
}
