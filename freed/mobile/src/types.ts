/** Shared API types — mirror the backend contracts (freed/backend). */

export type Vertical =
  | 'EXAMS_ACADEMICS'
  | 'CAREER_PROFESSIONAL'
  | 'SPORTS_PERFORMANCE'
  | 'TEACHING_KNOWLEDGE'
  | 'WELLNESS_GUIDANCE';

export type ProfessionalClass =
  | 'LICENSED_PROFESSIONAL'
  | 'CERTIFIED_PROFESSIONAL'
  | 'VERIFIED_EXPERT'
  | 'COACH'
  | 'MENTOR'
  | 'TEACHER'
  | 'ADVISOR';

export type AvailabilityState = 'OFFLINE' | 'AVAILABLE' | 'BUSY' | 'IN_SESSION' | 'AWAY';
export type ConsultationMode = 'CHAT' | 'AUDIO' | 'VIDEO';
export type PricingModel = 'PER_MINUTE' | 'FIXED_SESSION' | 'PRODUCT';

export interface AvailabilityView {
  state: AvailabilityState;
  label: string;
  liveNow: boolean;
}

export interface ExpertService {
  id: string;
  title: string;
  pricingModel: PricingModel;
  modes: ConsultationMode[];
  ratePerMinute?: number | null;
  sessionPrice?: number | null;
  durationMinutes?: number | null;
  productPrice?: number | null;
}

export interface MatchExpert {
  id: string;
  name: string | null;
  headline: string | null;
  professionalClass: ProfessionalClass;
  foundingExpert: boolean;
  yearsExperience: number;
  ratingAvg: number;
  ratingCount: number;
  consultCount: number;
  verifiedCount: number;
  availability: AvailabilityView;
  services: ExpertService[];
  whyThisPerson: string[];
}

export interface MatchResult {
  categoryKey?: string;
  count: number;
  experts: MatchExpert[];
}

export interface ClaimView {
  type: string;
  label: string;
  title: string;
  status: string;
  verified: boolean;
}

export interface TrustProfile {
  professionalClass: ProfessionalClass;
  classLabel: string;
  foundingExpert: boolean;
  claims: ClaimView[];
  verifiedCount: number;
  totalClaims: number;
  consultCount: number;
  ratingAvg: number;
  ratingCount: number;
}

export interface VerticalSummary {
  key: Vertical;
  name: string;
  emoji: string;
  tagline: string;
  categoryCount: number;
}
