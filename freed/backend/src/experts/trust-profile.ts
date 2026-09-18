import {
  CredentialType,
  ProfessionalClass,
  VerificationStatus,
} from '@prisma/client';

/**
 * FREED's Trust Profile — deliberately NOT a single score or a buyable badge.
 * It reports factual, claim-by-claim verification so the UI can render:
 *
 *   ✓ Identity            Verified
 *   ✓ Education           Verified
 *   ✓ GATE qualification  Verified
 *   ✓ Employment          Verified
 *   1,250 completed consultations · 4.9 from 480 people
 */

const CLAIM_LABELS: Record<CredentialType, string> = {
  IDENTITY: 'Identity',
  EDUCATION: 'Education',
  PROFESSIONAL_QUALIFICATION: 'Professional qualification',
  EMPLOYMENT: 'Employment',
  CERTIFICATION: 'Certification',
  ACHIEVEMENT: 'Achievement',
  PROFESSIONAL_REGISTRATION: 'Professional registration',
  EXAM_QUALIFICATION: 'Exam qualification',
};

export interface ClaimView {
  type: CredentialType;
  label: string;
  title: string;
  status: VerificationStatus;
  verified: boolean;
}

export interface TrustProfileInput {
  professionalClass: ProfessionalClass;
  foundingExpert: boolean;
  consultCount: number;
  ratingAvg: number;
  ratingCount: number;
  credentials: Array<{
    type: CredentialType;
    title: string;
    status: VerificationStatus | null;
  }>;
}

export interface TrustProfile {
  professionalClass: ProfessionalClass;
  /** Human-facing label for the class, e.g. "Licensed Professional". */
  classLabel: string;
  foundingExpert: boolean;
  claims: ClaimView[];
  verifiedCount: number;
  totalClaims: number;
  consultCount: number;
  ratingAvg: number;
  ratingCount: number;
}

const CLASS_LABELS: Record<ProfessionalClass, string> = {
  LICENSED_PROFESSIONAL: 'Licensed Professional',
  CERTIFIED_PROFESSIONAL: 'Certified Professional',
  VERIFIED_EXPERT: 'Verified Expert',
  COACH: 'Coach',
  MENTOR: 'Mentor',
  TEACHER: 'Teacher',
  ADVISOR: 'Advisor',
};

export function buildTrustProfile(input: TrustProfileInput): TrustProfile {
  const claims: ClaimView[] = input.credentials.map((c) => {
    const status = c.status ?? VerificationStatus.PENDING;
    return {
      type: c.type,
      label: CLAIM_LABELS[c.type],
      title: c.title,
      status,
      verified: status === VerificationStatus.VERIFIED,
    };
  });

  return {
    professionalClass: input.professionalClass,
    classLabel: CLASS_LABELS[input.professionalClass],
    foundingExpert: input.foundingExpert,
    claims,
    verifiedCount: claims.filter((c) => c.verified).length,
    totalClaims: claims.length,
    consultCount: input.consultCount,
    ratingAvg: input.ratingAvg,
    ratingCount: input.ratingCount,
  };
}
