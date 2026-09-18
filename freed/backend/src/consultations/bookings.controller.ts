import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { BookingStatus, ConsultationMode } from '@prisma/client';
import { BookingsService } from './bookings.service';

class CreateBookingDto {
  @IsString() seekerId!: string;
  @IsString() serviceId!: string;
  @IsOptional() @IsEnum(ConsultationMode) mode?: ConsultationMode;
  @IsOptional() @IsDateString() scheduledAt?: string;
  @IsOptional() @IsInt() @Min(1) durationMinutes?: number;
}

class StartDto {
  @IsEnum(ConsultationMode) mode!: ConsultationMode;
}

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Post()
  create(@Body() dto: CreateBookingDto) {
    return this.bookings.create({
      ...dto,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
    });
  }

  @Post(':id/start')
  start(@Param('id') id: string, @Body() dto: StartDto) {
    return this.bookings.start(id, dto.mode);
  }

  @Post(':id/end')
  end(@Param('id') id: string) {
    return this.bookings.end(id);
  }

  @Get()
  list(@Query('seekerId') seekerId: string, @Query('status') status?: BookingStatus) {
    return this.bookings.listForSeeker(seekerId, status);
  }
}
