import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, VerificationMethod, VerificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProviderRegistry } from './provider.registry';
import { CredentialInput } from './providers/provider.interface';
import { assertTransition } from './claim-lifecycle';

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: ProviderRegistry,
  ) {}

  /**
   * Run (or re-run) the appropriate provider for a credential and persist the
   * resulting claim state. Safe to call repeatedly.
   */
  async runForCredential(credentialId: string) {
    const credential = await this.prisma.credential.findUnique({
      where: { id: credentialId },
      include: { documents: true, verification: true },
    });
    if (!credential) throw new NotFoundException('Credential not found');

    const input: CredentialInput = {
      id: credential.id,
      type: credential.type,
      title: credential.title,
      issuer: credential.issuer,
      identifier: credential.identifier,
      year: credential.year,
      metadata: (credential.metadata as Record<string, unknown>) ?? null,
      documentKeys: credential.documents.map((d) => d.storageKey),
    };

    const provider = this.registry.resolve(input);
    const outcome = await provider.verify(input);

    const current = credential.verification?.status ?? VerificationStatus.PENDING;
    assertTransition(current, outcome.status);

    return this.prisma.credentialVerification.upsert({
      where: { credentialId },
      create: {
        credentialId,
        status: outcome.status,
        method: outcome.method,
        sourceKey: outcome.sourceKey,
        evidence: (outcome.evidence as Prisma.InputJsonValue) ?? undefined,
        notes: outcome.notes,
        expiresAt: outcome.expiresAt ?? undefined,
        verifiedAt: outcome.status === VerificationStatus.VERIFIED ? new Date() : undefined,
      },
      update: {
        status: outcome.status,
        method: outcome.method,
        sourceKey: outcome.sourceKey,
        evidence: (outcome.evidence as Prisma.InputJsonValue) ?? undefined,
        notes: outcome.notes,
        expiresAt: outcome.expiresAt ?? undefined,
        verifiedAt: outcome.status === VerificationStatus.VERIFIED ? new Date() : undefined,
      },
    });
  }

  /**
   * Trust-team decision on a claim awaiting manual review. This is the ONLY
   * path that can mark a document-backed claim VERIFIED — never OCR alone.
   */
  async review(
    credentialId: string,
    reviewerId: string,
    decision: 'VERIFIED' | 'REJECTED' | 'PENDING',
    opts: { notes?: string; expiresAt?: Date } = {},
  ) {
    const cv = await this.prisma.credentialVerification.findUnique({ where: { credentialId } });
    if (!cv) throw new NotFoundException('No verification in progress for this credential');
    assertTransition(cv.status, decision as VerificationStatus);

    return this.prisma.credentialVerification.update({
      where: { credentialId },
      data: {
        status: decision as VerificationStatus,
        method: VerificationMethod.MANUAL_REVIEW,
        reviewerId,
        notes: opts.notes ?? cv.notes,
        expiresAt: opts.expiresAt ?? cv.expiresAt,
        verifiedAt: decision === 'VERIFIED' ? new Date() : cv.verifiedAt,
      },
    });
  }

  /** Submit an expert's whole profile for verification (progressive onboarding). */
  async submitExpert(expertId: string, requested: string[]) {
    const expert = await this.prisma.expertProfile.findUnique({ where: { id: expertId } });
    if (!expert) throw new NotFoundException('Expert not found');
    if (requested.length === 0) {
      throw new BadRequestException('Select at least one credential type to verify');
    }

    await this.prisma.expertProfile.update({
      where: { id: expertId },
      data: { submittedForReview: true },
    });

    const request = await this.prisma.verificationRequest.create({
      data: { expertId, requested, status: VerificationStatus.PENDING },
    });

    // Kick off provider runs for every credential the expert has.
    const credentials = await this.prisma.credential.findMany({ where: { expertId } });
    for (const c of credentials) {
      await this.runForCredential(c.id);
    }
    return request;
  }

  /** Nightly job hook: flag verified-but-expired claims for re-verification. */
  async sweepExpired() {
    const now = new Date();
    const stale = await this.prisma.credentialVerification.findMany({
      where: { status: VerificationStatus.VERIFIED, expiresAt: { lt: now } },
      select: { credentialId: true },
    });
    for (const s of stale) {
      await this.prisma.credentialVerification.update({
        where: { credentialId: s.credentialId },
        data: { status: VerificationStatus.REQUIRES_REVERIFICATION },
      });
    }
    return { swept: stale.length };
  }
}
