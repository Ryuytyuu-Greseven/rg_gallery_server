import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as bodyParser from 'body-parser';
import * as express from 'express';

dotenv.config();

async function bootstrap() {
  const applicationRunningPort = process.env.PORT;
  console.log(applicationRunningPort);

  const app = await NestFactory.create(AppModule);
  // app.use(generateConnections);
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(
    bodyParser.urlencoded({
      limit: '50mb',
      extended: true,
      parameterLimit: 50000,
    }),
  );
  app.enableCors({ origin: '*' });
  await app.listen(applicationRunningPort);
}
bootstrap();
