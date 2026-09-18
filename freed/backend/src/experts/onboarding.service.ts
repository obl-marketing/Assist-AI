import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Progressive, resumable expert onboarding. Nothing here forces the expert to
 * finish in one sitting — each step patches the profile and returns a
 * completion percentage so the app can say "Your profile is 65% complete →
 * Continue where you left off".
 */
export const ONBOARDING_STEPS = [
  'What do you do?',
  'What can you help with?',
  'About you',
  'Experience',
  'Credentials',
  'What should we verify?',
  'How do you want to consult?',
  'Set your prices',
  'Availability',
  'Preview',
  'Submit for verification',
] as const;

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async status(expertId: string) {
    const e = await this.prisma.expertProfile.findUnique({ where: { id: expertId } });
    if (!e) throw new NotFoundException('Expert not found');
    return {
      step: e.onboardingStep,
      total: ONBOARDING_STEPS.length,
      percent: Math.round((e.onboardingStep / ONBOARDING_STEPS.length) * 100),
      currentLabel: ONBOARDING_STEPS[Math.min(e.onboardingStep, ONBOARDING_STEPS.length - 1)],
      submitted: e.submittedForReview,
    };
  }

  /** Save partial progress and advance the furthest-reached step. */
  async saveStep(expertId: string, step: number, patch: Record<string, unknown>) {
    const e = await this.prisma.expertProfile.findUnique({ where: { id: expertId } });
    if (!e) throw new NotFoundException('Expert not found');

    // Only whitelisted profile fields can be patched here.
    const allowed: Record<string, unknown> = {};
    for (const k of ['headline', 'bio', 'yearsExperience', 'professionalClass'] as const) {
      if (k in patch) allowed[k] = patch[k];
    }

    await this.prisma.expertProfile.update({
      where: { id: expertId },
      data: {
        ...allowed,
        onboardingStep: Math.max(e.onboardingStep, step),
        onboardingTotal: ONBOARDING_STEPS.length,
      },
    });
    return this.status(expertId);
  }
}
