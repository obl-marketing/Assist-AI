import { Injectable } from '@nestjs/common';
import { Prisma, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { availabilityView } from './availability';

/**
 * Very small, deterministic keyword → category-key map. In production this is
 * replaced by a real intent/matching model, but the CONTRACT stays: a plain
 * sentence in, relevant *people* out — plus a "why this person" explanation.
 */
const KEYWORD_CATEGORY: Array<[RegExp, string]> = [
  [/gate\s*cse|gate\s*cs/i, 'gate-cse'],
  [/\bgate\b/i, 'gate-cse'],
  [/\bjee\b|iit/i, 'jee-advanced'],
  [/\bneet\b/i, 'neet'],
  [/\bupsc\b|civil services/i, 'upsc'],
  [/\bcat\b|mba/i, 'cat'],
  [/ugc[- ]?net|jrf|research|phd/i, 'phd-mentors'],
  [/product manage|\bpm\b|apm/i, 'product-management'],
  [/resume|\bcv\b/i, 'resume-review'],
  [/interview/i, 'interview-prep'],
  [/salary|negotiat/i, 'salary-negotiation'],
  [/software|developer|coding|engineer/i, 'software-engineering'],
  [/data scien|machine learning|\bml\b|\bai\b/i, 'data-science'],
  [/design|\bux\b|\bui\b/i, 'design'],
  [/badminton/i, 'badminton'],
  [/cricket/i, 'cricket'],
  [/psycholog|mental health|anxiety|stress|therap/i, 'clinical-psychology'],
  [/business|startup|found|entrepreneur/i, 'entrepreneurship'],
  [/study abroad|\bms\b|masters abroad/i, 'study-abroad'],
];

export interface MatchQuery {
  text?: string;
  categoryKey?: string;
  language?: string;
  liveOnly?: boolean;
  limit?: number;
}

@Injectable()
export class MatchingService {
  constructor(private readonly prisma: PrismaService) {}

  inferCategory(text?: string): string | undefined {
    if (!text) return undefined;
    for (const [re, key] of KEYWORD_CATEGORY) if (re.test(text)) return key;
    return undefined;
  }

  async match(q: MatchQuery) {
    const categoryKey = q.categoryKey ?? this.inferCategory(q.text);
    const limit = Math.min(q.limit ?? 5, 20);

    const where: Prisma.ExpertProfileWhereInput = {
      approved: true,
      ...(categoryKey ? { categories: { some: { category: { key: categoryKey } } } } : {}),
      ...(q.language ? { user: { languages: { has: q.language } } } : {}),
      ...(q.liveOnly ? { availability: { state: 'AVAILABLE' } } : {}),
    };

    const experts = await this.prisma.expertProfile.findMany({
      where,
      include: {
        user: { select: { name: true, avatarColor: true, languages: true } },
        availability: true,
        categories: { include: { category: true } },
        credentials: { include: { verification: true } },
        services: { where: { active: true } },
      },
      take: 40,
    });

    const ranked = experts
      .map((e) => {
        const view = availabilityView(
          e.availability?.state ?? 'OFFLINE',
          e.availability?.nextAvailableAt,
        );
        const verifiedCount = e.credentials.filter(
          (c) => c.verification?.status === VerificationStatus.VERIFIED,
        ).length;
        const score =
          (view.liveNow ? 1000 : 0) +
          e.ratingAvg * 100 +
          Math.min(e.consultCount, 2000) / 20 +
          verifiedCount * 25 +
          (e.foundingExpert ? 15 : 0);
        return { e, view, verifiedCount, score, reasons: this.reasons(e, categoryKey, view.liveNow) };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return {
      categoryKey,
      count: ranked.length,
      experts: ranked.map(({ e, view, verifiedCount, reasons }) => ({
        id: e.id,
        name: e.user.name,
        headline: e.headline,
        professionalClass: e.professionalClass,
        foundingExpert: e.foundingExpert,
        yearsExperience: e.yearsExperience,
        ratingAvg: e.ratingAvg,
        ratingCount: e.ratingCount,
        consultCount: e.consultCount,
        verifiedCount,
        availability: view,
        services: e.services,
        whyThisPerson: reasons,
      })),
    };
  }

  /** "Why this person may be a good fit" — concrete, not just a star rating. */
  private reasons(
    e: {
      yearsExperience: number;
      consultCount: number;
      credentials: Array<{ type: any; verification: { status: any } | null }>;
      categories: Array<{ category: { name: string } }>;
    },
    categoryKey: string | undefined,
    liveNow: boolean,
  ): string[] {
    const out: string[] = [];
    const cat = e.categories.find((c) => true)?.category.name;
    const hasVerifiedExam = e.credentials.some(
      (c) => c.type === 'EXAM_QUALIFICATION' && c.verification?.status === 'VERIFIED',
    );
    const hasVerifiedAchievement = e.credentials.some(
      (c) => c.type === 'ACHIEVEMENT' && c.verification?.status === 'VERIFIED',
    );
    if (hasVerifiedExam && cat) out.push(`Has cleared ${cat}`);
    if (hasVerifiedAchievement) out.push('Verified competitive achievement');
    if (e.yearsExperience) out.push(`${e.yearsExperience} years of experience`);
    if (e.consultCount > 50) out.push(`Helped ${e.consultCount.toLocaleString('en-IN')}+ people`);
    if (liveNow) out.push('Available now');
    return out.slice(0, 5);
  }
}
