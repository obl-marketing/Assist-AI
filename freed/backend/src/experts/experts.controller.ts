import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { IsInt, IsObject, Min } from 'class-validator';
import { ExpertsService } from './experts.service';
import { OnboardingService } from './onboarding.service';

class SaveStepDto {
  @IsInt() @Min(0) step!: number;
  @IsObject() patch!: Record<string, unknown>;
}

@Controller('experts')
export class ExpertsController {
  constructor(
    private readonly experts: ExpertsService,
    private readonly onboarding: OnboardingService,
  ) {}

  @Get(':id')
  get(@Param('id') id: string) {
    return this.experts.get(id);
  }

  @Get(':id/trust-profile')
  trustProfile(@Param('id') id: string) {
    return this.experts.trustProfile(id);
  }

  @Get(':id/onboarding')
  onboardingStatus(@Param('id') id: string) {
    return this.onboarding.status(id);
  }

  @Patch(':id/onboarding')
  saveStep(@Param('id') id: string, @Body() dto: SaveStepDto) {
    return this.onboarding.saveStep(id, dto.step, dto.patch);
  }
}
