import { Module } from '@nestjs/common';
import { ProviderRegistry } from './provider.registry';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';

@Module({
  controllers: [VerificationController],
  providers: [ProviderRegistry, VerificationService],
  exports: [VerificationService, ProviderRegistry],
})
export class VerificationModule {}
