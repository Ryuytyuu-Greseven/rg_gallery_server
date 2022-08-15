import { ReactionsService } from './reactions.service';
import { TokenGuard } from './../authentication/token.guard';
import { UsersService } from './users.service';
import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { readFileSync, existsSync } from 'fs';
import { S3UploadService } from './s3-upload.service';

@Controller('artist')
export class UserController {
  constructor(
    private readonly usersService: UsersService,
    private reactionsService: ReactionsService,
    private s3FilesService: S3UploadService,
  ) {}

  @UseGuards(TokenGuard)
  @Post('/fetch_artist_details')
  fetchArtistDetails(@Req() request: Request) {
    return this.usersService.fetchProfileDetails(request);
  }

  @UseGuards(TokenGuard)
  @Post('/post_art')
  @UseInterceptors(FileInterceptor('art_file'))
  postArt(@UploadedFile() file: Express.Multer.File, @Req() request: Request) {
    // console.log('file', file, '\n\n', body);
    request.body = { stinky: request.body.body };
    return this.usersService.publishArt(request, file);
  }

  @Post('/get_arts')
  @UseGuards(TokenGuard)
  fetchArtPosts(@Req() request: Request) {
    return this.usersService.fetchPosts(request);
  }

  @Post('/art_vote')
  @UseGuards(TokenGuard)
  upvoteArt(@Req() request: Request) {
    return this.reactionsService.upVote(request);
  }

  // @Post('/check')
  // update(@Req() request: Request) {
  //   return this.reactionsService.update(request);
  // }

  @Get('/fetch_art/:id')
  @UseGuards(TokenGuard)
  async fetchArts(@Req() request: Request, @Param('id') id: string) {
    const result: any = { success: true, data: false };
    result.data = await this.s3FilesService.downloadFile(id);
    console.log(result.data);

    return result;
  }
}
