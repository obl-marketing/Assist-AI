import { Body, Controller, Post } from '@nestjs/common';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { MatchingService } from './matching.service';

class MatchDto {
  @IsOptional() @IsString() text?: string;
  @IsOptional() @IsString() categoryKey?: string;
  @IsOptional() @IsString() language?: string;
  @IsOptional() @IsBoolean() liveOnly?: boolean;
  @IsOptional() @IsInt() @Min(1) @Max(20) limit?: number;
}

@Controller('match')
export class MatchingController {
  constructor(private readonly matching: MatchingService) {}

  /**
   * The AI front door. "I don't know who I need" — describe the problem, get
   * relevant people (with reasons), not keyword hits.
   */
  @Post()
  match(@Body() dto: MatchDto) {
    return this.matching.match(dto);
  }
}
