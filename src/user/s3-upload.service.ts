import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import {
  createReadStream,
  existsSync,
  mkdir,
  readFileSync,
  unlink,
  writeFile,
} from 'fs';
// import s3 from 's3';
import S3 = require('aws-sdk/clients/s3');
import { Readable } from 'stream';
// do not change this format of importing for S3

@Injectable()
export class S3UploadService {
  s3 = new S3({
    accessKeyId: this.configService.get('S3_ACCESS_KEY'),
    secretAccessKey: this.configService.get('S3_SECRET_KEY'),
  });

  constructor(private configService: ConfigService) {
    // this.client = s3.createClient({
    //   maxAsyncS3: 20, // this is the default
    //   s3RetryCount: 3, // this is the default
    //   s3RetryDelay: 1000, // this is the default
    //   multipartUploadThreshold: 20971520, // this is the default (20 MB)
    //   multipartUploadSize: 15728640, // this is the default (15 MB)
    //   s3Options: {
    //     accessKeyId: this.configService.get('S3_ACCESS_KEY'),
    //     secretAccessKey: this.configService.get('S3_SECRET_KEY'),
    //   },
    // });
  }

  async storeFileLocal(file_name: string, file: any) {
    console.log(file_name);
    const file_path = `./art_files/${file_name}`;
    if (!existsSync('./art_files')) {
      mkdir('./art_files', () => {
        console.log('folder created');
        writeFile(`./art_files/${file_name}`, file, (error) => {
          if (error) {
            throw error;
          }
          console.log('File Saved Successfully.');
        });
      });
    } else {
      writeFile(`./art_files/${file_name}`, file, (error) => {
        if (error) {
          throw error;
        }
        console.log('File Saved Successfully.');
      });
    }
    return file_path;
  }

  async uploadFileToS3(file_name: string, file: any) {
    const local_path = await this.storeFileLocal(file_name, file);

    const file_path = `gallery/art_files/${file_name}`;
    if (this.configService.get('ENV_TYPE') === 'production') {
      // s3 use
      const fileStream = createReadStream(local_path);

      const uploadParams = {
        Bucket: this.configService.get('S3_BUCKET'),
        Body: fileStream,
        Key: file_path,
      };

      const result = await this.s3.upload(uploadParams).promise();
      if (result) {
        unlink(`./art_files/${file_name}`, (error) => {
          if (error) {
            throw error;
          }
          console.log('File Removed From Local Drive Successfully.');
        });
      }
    } else {
      return true;
    }
  }

  async downloadFile(file_name: string) {
    if (this.configService.get('ENV_TYPE') === 'production') {
      const file_path = `gallery/art_files/${file_name}`;

      const downloadParams: S3.Types.GetObjectRequest = {
        Key: file_path,
        Bucket: this.configService.get('S3_BUCKET'),
        ResponseContentEncoding: 'buffer',
      };

      // returns the data in buffer
      const data = await (
        await this.s3.getObject(downloadParams).promise()
      ).Body;
      return data;
    } else {
      const path = `./art_files/${file_name}`;
      if (existsSync(path)) {
        // console.log('In File Fetch');
        // const stream = Readable.from(buffer);
        return readFileSync(path);
      }
    }
  }

  async deleteFile(file_name: string) {
    if (this.configService.get('ENV_TYPE') === 'production') {
      const file_path = `gallery/art_files/${file_name}`;

      const deleteParams: S3.Types.DeleteObjectRequest = {
        Key: file_path,
        Bucket: this.configService.get('S3_BUCKET'),
      };

      // returns the data in buffer
      const data = await this.s3.deleteObject(deleteParams);
      console.log(data);

      return true;
    } else {
      const path = `./art_files/${file_name}`;
      if (existsSync(path)) {
        unlink(`./art_files/${file_name}`, (error) => {
          if (error) {
            throw error;
          }
          console.log('File Removed From Local Drive Successfully.');
        });
      }
    }
  }
}
