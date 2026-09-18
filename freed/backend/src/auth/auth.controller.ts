import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { IsArray, IsEmail, IsOptional, IsString } from 'class-validator';
import { AuthService } from './auth.service';

class RequestOtpDto {
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
}
class VerifyOtpDto {
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsString() code!: string;
}
class CompleteProfileDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() intent?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) languages?: string[];
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('otp/request')
  request(@Body() dto: RequestOtpDto) {
    return this.auth.requestOtp(dto);
  }

  @Post('otp/verify')
  verify(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp({ phone: dto.phone, email: dto.email }, dto.code);
  }

  @Patch('users/:id/profile')
  complete(@Param('id') id: string, @Body() dto: CompleteProfileDto) {
    return this.auth.completeProfile(id, dto);
  }
}
