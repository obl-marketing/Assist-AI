import {
  CredentialType,
  VerificationMethod,
  VerificationSourceKey,
  VerificationStatus,
} from '@prisma/client';

/**
 * A normalised view of a credential handed to a provider. We never pass the
 * whole Prisma row — only what a source needs to check the claim.
 */
export interface CredentialInput {
  id: string;
  type: CredentialType;
  title: string;
  issuer?: string | null;
  /** roll/registration/certificate number (decrypted just-in-time) */
  identifier?: string | null;
  year?: number | null;
  /** type-specific fields: { subject, category, competition, level, ... } */
  metadata?: Record<string, unknown> | null;
  /** storage keys of uploaded evidence, if any */
  documentKeys?: string[];
}

export interface VerificationOutcome {
  status: VerificationStatus;
  method: VerificationMethod;
  sourceKey: VerificationSourceKey;
  /** structured, source-specific result kept for audit */
  evidence?: Record<string, unknown>;
  /** registrations/certs expire → drives REQUIRES_REVERIFICATION later */
  expiresAt?: Date | null;
  notes?: string;
}

/**
 * The contract every verification source implements. FREED is a *pluggable,
 * source-by-source* engine: each authoritative register (RCI/CRR, INC/NRTS,
 * NTA UGC-NET, institute degree, employer, sports federation) is one provider.
 * The fallback provider does upload + manual review.
 *
 * Key principle encoded here: OCR only EXTRACTS. A provider that relies on a
 * document must still return UNDER_REVIEW (awaiting a source/human check),
 * never VERIFIED on the strength of extraction alone.
 */
export interface VerificationProvider {
  readonly key: VerificationSourceKey;

  /** Can this provider handle the given credential? */
  supports(credential: CredentialInput): boolean;

  /** Attempt verification. Idempotent; may return UNDER_REVIEW to defer. */
  verify(credential: CredentialInput): Promise<VerificationOutcome>;
}
