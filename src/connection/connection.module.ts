import { connectionProviders } from './connection.providers';
import { Module } from '@nestjs/common';

@Module({
  providers: [...connectionProviders],
  exports: [...connectionProviders],
})
export class ConnectionModule {}
