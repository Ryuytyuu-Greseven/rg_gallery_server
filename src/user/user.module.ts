import { AppService } from './../app.service';
import { ReactionsService } from './reactions.service';
import { artVotesSchema } from '../schemas/ArtVotes.schema';
import { CryptoModule } from './../crypto/crypto.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { usersLoginSchema } from './../schemas/UserLogins.schema';
import { usersSchema } from './../schemas/Users.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UsersService } from './users.service';
import * as dotenv from 'dotenv';
import { S3UploadService } from './s3-upload.service';
import { artPostsScherma } from 'src/schemas/ArtPosts.schema';

dotenv.config();

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Users', schema: usersSchema, collection: 'users' },
      {
        name: 'UsersLogin',
        schema: usersLoginSchema,
        collection: 'user_logins',
      },
      {
        name: 'ArtPosts',
        schema: artPostsScherma,
        collection: 'art_posts',
      },
      {
        name: 'ArtVotes',
        schema: artVotesSchema,
        collection: 'art_votes',
      },
    ]),
    JwtModule.register({
      secret: process.env.SECRET_KEY,
      signOptions: { expiresIn: '600m' },
    }),
    ConfigModule,
    CryptoModule,
  ],
  controllers: [UserController],
  providers: [UsersService, S3UploadService, ReactionsService, AppService],
  exports: [MongooseModule, UsersService, ReactionsService],
})
export class UserModule {}
