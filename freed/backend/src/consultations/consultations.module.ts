import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';

@Module({
  controllers: [BookingsController],
  providers: [PricingService, BookingsService],
  exports: [PricingService, BookingsService],
})
export class ConsultationsModule {}
