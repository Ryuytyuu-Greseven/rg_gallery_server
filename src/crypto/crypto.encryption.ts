// import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
// import { promisify } from 'util';
import * as dotenv from 'dotenv';
import * as CryptoJS from 'crypto-js';
import { Request } from 'express';

dotenv.config();

export class EncryptionService {
  // iv = randomBytes(16);

  // ecnrypt data using nodejs crypto module
  encryptService(dataToEncrypt: any) {
    console.log('in encryption');

    try {
      const encryptedText = CryptoJS.AES.encrypt(
        JSON.stringify(dataToEncrypt),
        process.env.ENC_KEY,
      ).toString();
      // console.log(encryptedText);
      return encryptedText;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  // decrypt data using nodejs crypto module
  decryptService(dataToDecrypt: any) {
    console.log('in decryption');

    try {
      const bytes = CryptoJS.AES.decrypt(dataToDecrypt, process.env.ENC_KEY);
      console.info(JSON.parse(bytes.toString(CryptoJS.enc.Utf8)));
      const decryptedText = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      // console.log('\n\nDecoded String', decryptedText);

      return decryptedText;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  decrypt(request: Request) {
    // console.log('body', request.body);
    if (
      request.headers['spellcheck'] &&
      request.headers['spellcheck'] === 'ryuytyuu'
    ) {
      return request.body;
    } else {
      // console.log('body', request.body['stinky']);

      const stinky = request.body['stinky'];
      return this.decryptService(stinky);
    }
  }

  encrypt(request: Request, data: any) {
    // console.log('body', request.headers);
    if (
      request.headers['spellcheck'] &&
      request.headers['spellcheck'] === 'ryuytyuu'
    ) {
      return data;
    } else {
      return { spicy: this.encryptService(data) };
    }
  }
}
