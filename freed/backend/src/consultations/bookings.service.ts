import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, ConsultationMode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from './pricing.service';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
  ) {}

  /** Create a booking for an instant or scheduled service. */
  async create(input: {
    seekerId: string;
    serviceId: string;
    mode?: ConsultationMode;
    scheduledAt?: Date;
    durationMinutes?: number;
  }) {
    const service = await this.prisma.expertService.findUnique({
      where: { id: input.serviceId },
    });
    if (!service) throw new NotFoundException('Service not found');

    const minutes = input.durationMinutes ?? service.durationMinutes ?? 0;
    const base = this.pricing.baseFor(service, minutes);
    const money = this.pricing.breakdown(base);

    const booking = await this.prisma.booking.create({
      data: {
        seekerId: input.seekerId,
        expertId: service.expertId,
        serviceId: service.id,
        mode: input.mode ?? service.modes[0] ?? null,
        scheduledAt: input.scheduledAt,
        durationMinutes: minutes || null,
        amount: money.total,
        status: input.scheduledAt ? BookingStatus.CONFIRMED : BookingStatus.PENDING,
      },
    });
    return { booking, money };
  }

  /** Start a live consultation (instant). Records metered usage on stop. */
  async start(bookingId: string, mode: ConsultationMode) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.IN_PROGRESS },
    });
    return this.prisma.consultation.upsert({
      where: { bookingId },
      create: { bookingId, mode, startedAt: new Date() },
      update: { startedAt: new Date(), endedAt: null, seconds: 0, costMinor: 0 },
    });
  }

  /** End a consultation; compute final metered cost for PER_MINUTE services. */
  async end(bookingId: string) {
    const consult = await this.prisma.consultation.findUnique({
      where: { bookingId },
      include: { booking: { include: { service: true } } },
    });
    if (!consult || !consult.startedAt) throw new BadRequestException('Consultation not started');

    const seconds = Math.round((Date.now() - consult.startedAt.getTime()) / 1000);
    const minutes = seconds / 60;
    const service = consult.booking.service;
    const base = service ? this.pricing.baseFor(service, minutes) : consult.booking.amount;
    const money = this.pricing.breakdown(base);

    await this.prisma.consultation.update({
      where: { bookingId },
      data: { endedAt: new Date(), seconds, costMinor: money.total },
    });
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.COMPLETED, amount: money.total },
    });
    // bump the expert's consult count
    await this.prisma.expertProfile.update({
      where: { id: consult.booking.expertId },
      data: { consultCount: { increment: 1 } },
    });
    return { seconds, money };
  }

  listForSeeker(seekerId: string, status?: BookingStatus) {
    return this.prisma.booking.findMany({
      where: { seekerId, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
      include: { expert: { include: { user: { select: { name: true } } } }, service: true },
    });
  }
}
