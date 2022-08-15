import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users } from './schemas/Users.schema';
import * as nodemailer from 'nodemailer';

// const nodemailer = require('nodemailer');

export class AppService {
  constructor(
    @InjectModel('Users') private readonly userModel: Model<Users>,
    private configService: ConfigService,
  ) {}

  // async..await is not allowed in global scope, must use a wrapper
  async sendMailToUser(user_email: string, otp: string) {
    try {
      console.log(user_email, otp);
      let transporter: any = {};
      try {
        // create reusable transporter object using the default SMTP transport
        transporter = nodemailer.createTransport({
          host: 'smpt.gmail.com',
          port: 465,
          secure: true, // true for 465, false for other ports
          service: 'gmail',
          auth: {
            user: this.configService.get('EMAIL'), // generated ethereal user
            pass: this.configService.get('EMAIL_KEY'), // generated ethereal password
          },
        });
        console.log('Its Done');
      } catch (error) {
        console.log('\n Deals', error);
      }

      try {
        // send mail with defined transport object
        const info = await transporter.sendMail({
          from: `"Ryuytyuu Greseven 🐿️" <${this.configService.get('EMAIL')}>`, // sender address
          to: `${user_email}`, // "bar@example.com, baz@example.com" list of receivers
          subject: 'OTP Verification from RG Studio', // Subject line
          text: `OTP Verification from RG Studio`, // plain text body
          html: `<h2><b>R G STUDIO</b></h2>
          <br>I got to know your trying to signup/login into R G Studio.\nIf not please ignore this mail.
          <br>Here you go with OTP : <i>${otp}</i>`, // html body
        });
        console.log('Message sent: %s', info.messageId);
      } catch (error) {
        console.log('in inner error', error);
      }
    } catch (error) {
      console.log(error);
    }
  }
}
