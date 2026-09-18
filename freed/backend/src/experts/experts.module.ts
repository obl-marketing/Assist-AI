import { Module } from '@nestjs/common';
import { ExpertsService } from './experts.service';
import { OnboardingService } from './onboarding.service';
import { ExpertsController } from './experts.controller';

@Module({
  controllers: [ExpertsController],
  providers: [ExpertsService, OnboardingService],
  exports: [ExpertsService],
})
export class ExpertsModule {}
