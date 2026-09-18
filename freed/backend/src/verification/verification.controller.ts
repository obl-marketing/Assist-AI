import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsIn, IsOptional, IsString, IsArray } from 'class-validator';
import { ProviderRegistry } from './provider.registry';
import { VerificationService } from './verification.service';

class ReviewDto {
  @IsString() reviewerId!: string;
  @IsIn(['VERIFIED', 'REJECTED', 'PENDING']) decision!: 'VERIFIED' | 'REJECTED' | 'PENDING';
  @IsOptional() @IsString() notes?: string;
}

class SubmitDto {
  @IsArray() @IsString({ each: true }) requested!: string[];
}

@Controller('verification')
export class VerificationController {
  constructor(
    private readonly service: VerificationService,
    private readonly registry: ProviderRegistry,
  ) {}

  /** The authoritative sources the engine can currently route to. */
  @Get('sources')
  sources() {
    return { sources: this.registry.list() };
  }

  @Post('credentials/:id/run')
  run(@Param('id') id: string) {
    return this.service.runForCredential(id);
  }

  @Post('credentials/:id/review')
  review(@Param('id') id: string, @Body() dto: ReviewDto) {
    return this.service.review(id, dto.reviewerId, dto.decision, { notes: dto.notes });
  }

  @Post('experts/:id/submit')
  submit(@Param('id') id: string, @Body() dto: SubmitDto) {
    return this.service.submitExpert(id, dto.requested);
  }
}
