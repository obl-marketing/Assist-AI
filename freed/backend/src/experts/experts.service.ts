import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildTrustProfile, TrustProfile } from './trust-profile';

@Injectable()
export class ExpertsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(id: string) {
    const expert = await this.prisma.expertProfile.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, avatarColor: true, languages: true } },
        categories: { include: { category: true } },
        credentials: { include: { verification: true } },
        registrations: true,
        achievements: true,
        employment: true,
        services: { where: { active: true } },
        availability: true,
      },
    });
    if (!expert) throw new NotFoundException('Expert not found');
    return { ...expert, trustProfile: this.trustProfileFor(expert) };
  }

  /** Just the Trust Profile — cheap payload for cards. */
  async trustProfile(id: string): Promise<TrustProfile> {
    const expert = await this.prisma.expertProfile.findUnique({
      where: { id },
      include: { credentials: { include: { verification: true } } },
    });
    if (!expert) throw new NotFoundException('Expert not found');
    return this.trustProfileFor(expert);
  }

  private trustProfileFor(expert: {
    professionalClass: any;
    foundingExpert: boolean;
    consultCount: number;
    ratingAvg: number;
    ratingCount: number;
    credentials: Array<{ type: any; title: string; verification: { status: any } | null }>;
  }): TrustProfile {
    return buildTrustProfile({
      professionalClass: expert.professionalClass,
      foundingExpert: expert.foundingExpert,
      consultCount: expert.consultCount,
      ratingAvg: expert.ratingAvg,
      ratingCount: expert.ratingCount,
      credentials: expert.credentials.map((c) => ({
        type: c.type,
        title: c.title,
        status: c.verification?.status ?? null,
      })),
    });
  }
}
