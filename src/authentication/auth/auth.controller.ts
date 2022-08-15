import { UsersService } from './../../user/users.service';
import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @Post('/login')
  loginUser(@Req() request: Request) {
    return this.usersService.checkLogin(request);
  }

  @Post('/check_signup')
  checkSignUp(@Req() request: Request) {
    return this.usersService.checkUserEmail(request);
  }

  @Post('/check_userid')
  checkUserId(@Req() request: Request) {
    return this.usersService.checkUserIdAvailablity(request);
  }

  @Post('/signup')
  signUpUser(@Req() request: Request) {
    return this.usersService.signUpUser(request);
  }
}
