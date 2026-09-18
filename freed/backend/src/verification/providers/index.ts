import {
  CredentialType,
  VerificationMethod,
  VerificationSourceKey,
  VerificationStatus,
} from '@prisma/client';
import { CredentialInput, VerificationOutcome, VerificationProvider } from './provider.interface';

/**
 * NOTE ON THE STUBS BELOW
 * -----------------------
 * These providers encode the *shape* and *routing* of each verification path.
 * The real integrations (querying the CRR e-portal, INC's NRTS, NTA's UGC-NET
 * certificate check, institute registrars, employer/BGV vendors, federation
 * records) are added behind these same interfaces after data-access and legal
 * review. Until then a source-backed provider returns UNDER_REVIEW so a human
 * on the trust team confirms — we never mark VERIFIED on OCR alone.
 */

abstract class BaseProvider implements VerificationProvider {
  abstract readonly key: VerificationSourceKey;
  abstract supports(credential: CredentialInput): boolean;
  abstract verify(credential: CredentialInput): Promise<VerificationOutcome>;

  protected deferToReview(notes: string): VerificationOutcome {
    return {
      status: VerificationStatus.UNDER_REVIEW,
      method: VerificationMethod.MANUAL_REVIEW,
      sourceKey: this.key,
      notes,
    };
  }
}

/** RCI — Central Rehabilitation Register (clinical/rehab psychologists, etc.). */
export class RciCrrProvider extends BaseProvider {
  readonly key = VerificationSourceKey.RCI_CRR;
  supports(c: CredentialInput): boolean {
    return (
      c.type === CredentialType.PROFESSIONAL_REGISTRATION &&
      /rci|rehab|clinical psycholog/i.test(`${c.issuer ?? ''} ${c.title}`)
    );
  }
  async verify(c: CredentialInput): Promise<VerificationOutcome> {
    if (!c.identifier) {
      return {
        status: VerificationStatus.REJECTED,
        method: VerificationMethod.AUTOMATED_SOURCE,
        sourceKey: this.key,
        notes: 'A CRR registration number is required for this claim.',
      };
    }
    // TODO integrate: look up registration no. on the Central Rehabilitation
    // Register; confirm holder, category and validity window.
    return this.deferToReview('Awaiting CRR register confirmation.');
  }
}

/** Indian Nursing Council — NRTS live register of nurses. */
export class IncNrtsProvider extends BaseProvider {
  readonly key = VerificationSourceKey.INC_NRTS;
  supports(c: CredentialInput): boolean {
    return (
      c.type === CredentialType.PROFESSIONAL_REGISTRATION &&
      /nurs|inc|nrts|nuid|state nursing council/i.test(`${c.issuer ?? ''} ${c.title}`)
    );
  }
  async verify(): Promise<VerificationOutcome> {
    // TODO integrate: NRTS / State Nursing Council registration lookup.
    return this.deferToReview('Awaiting Nursing Council register confirmation.');
  }
}

/** NTA — UGC-NET / JRF certificate (Assistant Professor & JRF eligibility). */
export class UgcNetProvider extends BaseProvider {
  readonly key = VerificationSourceKey.NTA_UGC_NET;
  supports(c: CredentialInput): boolean {
    return (
      c.type === CredentialType.EXAM_QUALIFICATION &&
      /ugc[- ]?net|jrf|csir[- ]?net/i.test(`${c.issuer ?? ''} ${c.title}`)
    );
  }
  async verify(c: CredentialInput): Promise<VerificationOutcome> {
    // TODO integrate: validate certificate no. + subject + year against NTA.
    return this.deferToReview(
      `Awaiting NTA certificate confirmation (subject: ${String(c.metadata?.subject ?? 'n/a')}).`,
    );
  }
}

/** University / institute degree verification (IIT/IIM/NIT/…). */
export class InstituteDegreeProvider extends BaseProvider {
  readonly key = VerificationSourceKey.INSTITUTE_DEGREE;
  supports(c: CredentialInput): boolean {
    return c.type === CredentialType.EDUCATION;
  }
  async verify(): Promise<VerificationOutcome> {
    // TODO integrate: registrar / National Academic Depository check.
    return this.deferToReview('Awaiting institute/registrar confirmation.');
  }
}

/** Employment verification (in-house or BGV vendor). */
export class EmployerProvider extends BaseProvider {
  readonly key = VerificationSourceKey.EMPLOYER;
  supports(c: CredentialInput): boolean {
    return c.type === CredentialType.EMPLOYMENT;
  }
  async verify(): Promise<VerificationOutcome> {
    return this.deferToReview('Awaiting employment verification.');
  }
}

/** Sports federation / official achievement record. */
export class SportsFederationProvider extends BaseProvider {
  readonly key = VerificationSourceKey.SPORTS_FEDERATION;
  supports(c: CredentialInput): boolean {
    return c.type === CredentialType.ACHIEVEMENT;
  }
  async verify(c: CredentialInput): Promise<VerificationOutcome> {
    return this.deferToReview(
      `Awaiting federation confirmation (level: ${String(c.metadata?.level ?? 'n/a')}).`,
    );
  }
}

/**
 * Fallback: identity, certifications and anything without a dedicated source.
 * Upload + manual review. Extraction (OCR) may pre-fill fields but never
 * decides the outcome.
 */
export class GenericDocumentProvider extends BaseProvider {
  readonly key = VerificationSourceKey.GENERIC_DOCUMENT;
  supports(): boolean {
    return true; // last in the registry — always matches
  }
  async verify(c: CredentialInput): Promise<VerificationOutcome> {
    if (!c.documentKeys || c.documentKeys.length === 0) {
      return {
        status: VerificationStatus.PENDING,
        method: VerificationMethod.DOCUMENT_OCR,
        sourceKey: this.key,
        notes: 'Awaiting a supporting document upload.',
      };
    }
    return this.deferToReview('Document received — awaiting trust-team review.');
  }
}

/** Ordered list; specific providers first, generic fallback last. */
export const ALL_PROVIDERS: VerificationProvider[] = [
  new RciCrrProvider(),
  new IncNrtsProvider(),
  new UgcNetProvider(),
  new InstituteDegreeProvider(),
  new EmployerProvider(),
  new SportsFederationProvider(),
  new GenericDocumentProvider(),
];
