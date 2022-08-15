import { EncryptionService } from './crypto.encryption';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class CryptoModule {}
