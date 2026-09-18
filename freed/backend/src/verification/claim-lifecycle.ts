import { VerificationStatus } from '@prisma/client';

/**
 * The verification claim state machine. Kept pure (no DB) so it is trivially
 * testable and is the single authority on which transitions are legal.
 *
 *   PENDING ──▶ UNDER_REVIEW ──▶ VERIFIED ──▶ EXPIRED ──▶ REQUIRES_REVERIFICATION
 *      │             │              │                              │
 *      └──▶ REJECTED ◀┘             └──────────────────────────────┘
 *                                   (re-review can re-verify)
 */
const TRANSITIONS: Record<VerificationStatus, VerificationStatus[]> = {
  [VerificationStatus.PENDING]: [
    VerificationStatus.UNDER_REVIEW,
    VerificationStatus.VERIFIED,
    VerificationStatus.REJECTED,
  ],
  [VerificationStatus.UNDER_REVIEW]: [
    VerificationStatus.VERIFIED,
    VerificationStatus.REJECTED,
    VerificationStatus.PENDING, // sent back for more info
  ],
  [VerificationStatus.VERIFIED]: [
    VerificationStatus.EXPIRED,
    VerificationStatus.REQUIRES_REVERIFICATION,
  ],
  [VerificationStatus.REJECTED]: [VerificationStatus.PENDING],
  [VerificationStatus.EXPIRED]: [VerificationStatus.REQUIRES_REVERIFICATION],
  [VerificationStatus.REQUIRES_REVERIFICATION]: [
    VerificationStatus.UNDER_REVIEW,
    VerificationStatus.VERIFIED,
    VerificationStatus.REJECTED,
  ],
};

export function canTransition(from: VerificationStatus, to: VerificationStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: VerificationStatus, to: VerificationStatus): void {
  if (from === to) return;
  if (!canTransition(from, to)) {
    throw new Error(`Illegal verification transition: ${from} → ${to}`);
  }
}

/** A verified claim whose expiry has passed needs re-verification. */
export function isStale(status: VerificationStatus, expiresAt?: Date | null): boolean {
  return (
    status === VerificationStatus.VERIFIED &&
    !!expiresAt &&
    expiresAt.getTime() < Date.now()
  );
}
