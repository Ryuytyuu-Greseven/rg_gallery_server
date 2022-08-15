import { JwtStrategy } from './jwt.strategy';
import { UserModule } from './../user/user.module';
import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';

@Module({
  imports: [UserModule],
  providers: [JwtStrategy],
  controllers: [AuthController],
})
export class AuthenticationModule {}
