/**
 * FREED seed — the five founding verticals + a starter supply of experts with
 * CLAIM-LEVEL verification, so matching, Trust Profiles and availability all
 * return real data. Run with: npm run db:seed
 */
import {
  AvailabilityState,
  ConsultationMode,
  CredentialType,
  PrismaClient,
  PricingModel,
  ProfessionalClass,
  ServiceKind,
  VerificationMethod,
  VerificationSourceKey,
  VerificationStatus,
} from '@prisma/client';
import { VERTICALS } from '../src/catalog/verticals';

const prisma = new PrismaClient();

const AVATAR = ['#FF9FB0,#FFC48A', '#8FD6A6,#6FB8D6', '#B9A6F0,#F0A6C8', '#7BC96F,#B0E1A2'];

type CredSeed = {
  type: CredentialType;
  title: string;
  issuer?: string;
  status: VerificationStatus;
  sourceKey?: VerificationSourceKey;
  registration?: boolean;
};

interface ExpertSeed {
  name: string;
  categoryKey: string;
  headline: string;
  bio: string;
  professionalClass: ProfessionalClass;
  years: number;
  founding?: boolean;
  rating: number;
  ratingCount: number;
  consults: number;
  availability: AvailabilityState;
  nextInMin?: number;
  languages: string[];
  creds: CredSeed[];
  services: Array<{
    kind: ServiceKind;
    title: string;
    pricingModel: PricingModel;
    modes?: ConsultationMode[];
    ratePerMinute?: number;
    sessionPrice?: number;
    durationMinutes?: number;
    productPrice?: number;
  }>;
}

const EXPERTS: ExpertSeed[] = [
  {
    name: 'Rahul Verma',
    categoryKey: 'gate-cse',
    headline: 'GATE CSE Mentor | IIT Bombay',
    bio: 'Cleared GATE CSE (AIR 42) and mentors working professionals cracking GATE alongside a job. Practical plans, not theory.',
    professionalClass: ProfessionalClass.VERIFIED_EXPERT,
    years: 7,
    founding: true,
    rating: 4.9,
    ratingCount: 480,
    consults: 1250,
    availability: AvailabilityState.AVAILABLE,
    languages: ['English', 'Hindi'],
    creds: [
      { type: CredentialType.IDENTITY, title: 'Government ID', status: VerificationStatus.VERIFIED },
      { type: CredentialType.EDUCATION, title: 'B.Tech CSE, IIT Bombay', issuer: 'IIT Bombay', status: VerificationStatus.VERIFIED, sourceKey: VerificationSourceKey.INSTITUTE_DEGREE },
      { type: CredentialType.EXAM_QUALIFICATION, title: 'GATE CSE — AIR 42', issuer: 'IIT/GATE', status: VerificationStatus.VERIFIED },
      { type: CredentialType.EMPLOYMENT, title: 'Senior Engineer, Fintech', status: VerificationStatus.VERIFIED, sourceKey: VerificationSourceKey.EMPLOYER },
    ],
    services: [
      { kind: ServiceKind.INSTANT, title: 'Ask a GATE Mentor', pricingModel: PricingModel.PER_MINUTE, modes: [ConsultationMode.CHAT, ConsultationMode.AUDIO], ratePerMinute: 15 },
      { kind: ServiceKind.SCHEDULED, title: 'GATE Strategy Session', pricingModel: PricingModel.FIXED_SESSION, modes: [ConsultationMode.VIDEO], sessionPrice: 499, durationMinutes: 30 },
      { kind: ServiceKind.PRODUCT, title: 'Study Plan Review', pricingModel: PricingModel.PRODUCT, productPrice: 399 },
    ],
  },
  {
    name: 'Ananya Sharma',
    categoryKey: 'clinical-psychology',
    headline: 'Clinical Psychologist',
    bio: 'Registered clinical psychologist. Supports anxiety, stress and low mood. Professional psychological care — distinct from coaching.',
    professionalClass: ProfessionalClass.LICENSED_PROFESSIONAL,
    years: 10,
    rating: 4.9,
    ratingCount: 320,
    consults: 2450,
    availability: AvailabilityState.IN_SESSION,
    nextInMin: 25,
    languages: ['English', 'Hindi'],
    creds: [
      { type: CredentialType.IDENTITY, title: 'Government ID', status: VerificationStatus.VERIFIED },
      { type: CredentialType.EDUCATION, title: 'M.Phil Clinical Psychology', status: VerificationStatus.VERIFIED, sourceKey: VerificationSourceKey.INSTITUTE_DEGREE },
      { type: CredentialType.PROFESSIONAL_REGISTRATION, title: 'RCI — Central Rehabilitation Register', issuer: 'RCI', status: VerificationStatus.VERIFIED, sourceKey: VerificationSourceKey.RCI_CRR, registration: true },
    ],
    services: [
      { kind: ServiceKind.SCHEDULED, title: '45-min Consultation', pricingModel: PricingModel.FIXED_SESSION, modes: [ConsultationMode.VIDEO, ConsultationMode.AUDIO], sessionPrice: 1199, durationMinutes: 45 },
    ],
  },
  {
    name: 'Aarav Mehta',
    categoryKey: 'product-management',
    headline: 'Product Manager | Ex-Google',
    bio: 'Helps engineers and analysts break into Product. APM hiring, portfolios and the switch itself.',
    professionalClass: ProfessionalClass.VERIFIED_EXPERT,
    years: 8,
    founding: true,
    rating: 4.8,
    ratingCount: 610,
    consults: 1240,
    availability: AvailabilityState.AVAILABLE,
    languages: ['English'],
    creds: [
      { type: CredentialType.IDENTITY, title: 'Government ID', status: VerificationStatus.VERIFIED },
      { type: CredentialType.EMPLOYMENT, title: 'Product Manager, Google (past)', status: VerificationStatus.VERIFIED, sourceKey: VerificationSourceKey.EMPLOYER },
      { type: CredentialType.EDUCATION, title: 'MBA, IIM Ahmedabad', status: VerificationStatus.UNDER_REVIEW, sourceKey: VerificationSourceKey.INSTITUTE_DEGREE },
    ],
    services: [
      { kind: ServiceKind.INSTANT, title: 'Talk now', pricingModel: PricingModel.PER_MINUTE, modes: [ConsultationMode.AUDIO, ConsultationMode.VIDEO], ratePerMinute: 25 },
      { kind: ServiceKind.PRODUCT, title: 'Mock PM Interview', pricingModel: PricingModel.PRODUCT, productPrice: 999 },
      { kind: ServiceKind.PRODUCT, title: 'Resume Review', pricingModel: PricingModel.PRODUCT, productPrice: 599 },
    ],
  },
  {
    name: 'Priya Singh',
    categoryKey: 'badminton',
    headline: 'National-level Badminton · Performance Coach',
    bio: 'Represented India at the 2018 Asian Games. Coaches technique, match strategy and the mental side of the game.',
    professionalClass: ProfessionalClass.CERTIFIED_PROFESSIONAL,
    years: 9,
    rating: 4.9,
    ratingCount: 140,
    consults: 320,
    availability: AvailabilityState.OFFLINE,
    languages: ['English', 'Hindi'],
    creds: [
      { type: CredentialType.IDENTITY, title: 'Government ID', status: VerificationStatus.VERIFIED },
      { type: CredentialType.ACHIEVEMENT, title: 'Represented India — 2018 Asian Games', status: VerificationStatus.VERIFIED, sourceKey: VerificationSourceKey.SPORTS_FEDERATION },
      { type: CredentialType.CERTIFICATION, title: 'Level 2 Coaching Certificate', status: VerificationStatus.VERIFIED },
    ],
    services: [
      { kind: ServiceKind.SCHEDULED, title: '60-min Technique Session', pricingModel: PricingModel.FIXED_SESSION, modes: [ConsultationMode.VIDEO], sessionPrice: 1399, durationMinutes: 60 },
    ],
  },
  {
    name: 'Amit Kumar',
    categoryKey: 'phd-mentors',
    headline: 'Professor | Research Mentor',
    bio: 'Guides PhD applications, research careers and UGC-NET strategy. UGC-NET + JRF qualified.',
    professionalClass: ProfessionalClass.TEACHER,
    years: 15,
    rating: 4.8,
    ratingCount: 210,
    consults: 900,
    availability: AvailabilityState.AVAILABLE,
    languages: ['English', 'Hindi'],
    creds: [
      { type: CredentialType.IDENTITY, title: 'Government ID', status: VerificationStatus.VERIFIED },
      { type: CredentialType.EDUCATION, title: 'PhD, Physics', status: VerificationStatus.VERIFIED, sourceKey: VerificationSourceKey.INSTITUTE_DEGREE },
      { type: CredentialType.EXAM_QUALIFICATION, title: 'UGC-NET + JRF (Physics)', issuer: 'NTA', status: VerificationStatus.VERIFIED, sourceKey: VerificationSourceKey.NTA_UGC_NET },
      { type: CredentialType.EMPLOYMENT, title: 'Associate Professor', status: VerificationStatus.VERIFIED, sourceKey: VerificationSourceKey.EMPLOYER },
    ],
    services: [
      { kind: ServiceKind.SCHEDULED, title: 'Research / PhD Guidance', pricingModel: PricingModel.FIXED_SESSION, modes: [ConsultationMode.VIDEO], sessionPrice: 1499, durationMinutes: 45 },
      { kind: ServiceKind.PRODUCT, title: 'PhD Application Review', pricingModel: PricingModel.PRODUCT, productPrice: 1499 },
    ],
  },
  {
    name: 'Meera Iyer',
    categoryKey: 'life-coaching',
    headline: 'Life Coach',
    bio: 'Direction, habits and confidence. This is coaching and mentorship — not clinical care.',
    professionalClass: ProfessionalClass.COACH,
    years: 6,
    rating: 4.7,
    ratingCount: 95,
    consults: 260,
    availability: AvailabilityState.AWAY,
    nextInMin: 90,
    languages: ['English'],
    creds: [
      { type: CredentialType.IDENTITY, title: 'Government ID', status: VerificationStatus.VERIFIED },
      { type: CredentialType.CERTIFICATION, title: 'ICF-accredited coaching certificate', status: VerificationStatus.VERIFIED },
    ],
    services: [
      { kind: ServiceKind.INSTANT, title: 'Ask a Coach', pricingModel: PricingModel.PER_MINUTE, modes: [ConsultationMode.CHAT], ratePerMinute: 18 },
      { kind: ServiceKind.SCHEDULED, title: '30-min Session', pricingModel: PricingModel.FIXED_SESSION, modes: [ConsultationMode.VIDEO], sessionPrice: 699, durationMinutes: 30 },
    ],
  },
];

async function main() {
  console.log('Seeding catalog…');
  for (const v of VERTICALS) {
    let order = 0;
    for (const c of v.categories) {
      await prisma.category.upsert({
        where: { key: c.key },
        create: { key: c.key, name: c.name, blurb: c.blurb, vertical: v.key, order: order++ },
        update: { name: c.name, blurb: c.blurb, vertical: v.key, order: order++ },
      });
    }
  }

  console.log('Seeding experts…');
  let i = 0;
  for (const s of EXPERTS) {
    const category = await prisma.category.findUnique({ where: { key: s.categoryKey } });
    if (!category) throw new Error(`Missing category ${s.categoryKey}`);

    const user = await prisma.user.create({
      data: {
        role: 'EXPERT',
        name: s.name,
        email: `${s.name.toLowerCase().replace(/\s+/g, '.')}@freed.example`,
        emailVerified: true,
        avatarColor: AVATAR[i % AVATAR.length],
        languages: s.languages,
      },
    });

    const expert = await prisma.expertProfile.create({
      data: {
        userId: user.id,
        headline: s.headline,
        bio: s.bio,
        professionalClass: s.professionalClass,
        yearsExperience: s.years,
        foundingExpert: !!s.founding,
        approved: true,
        submittedForReview: true,
        onboardingStep: 11,
        ratingAvg: s.rating,
        ratingCount: s.ratingCount,
        consultCount: s.consults,
        categories: { create: { categoryId: category.id, primary: true } },
        availability: {
          create: {
            state: s.availability,
            modes: [ConsultationMode.CHAT, ConsultationMode.AUDIO, ConsultationMode.VIDEO],
            nextAvailableAt: s.nextInMin ? new Date(Date.now() + s.nextInMin * 60000) : null,
          },
        },
      },
    });

    for (const c of s.creds) {
      const credential = await prisma.credential.create({
        data: {
          expertId: expert.id,
          type: c.type,
          title: c.title,
          issuer: c.issuer,
          verification: {
            create: {
              status: c.status,
              method:
                c.status === VerificationStatus.VERIFIED
                  ? c.sourceKey
                    ? VerificationMethod.AUTOMATED_SOURCE
                    : VerificationMethod.MANUAL_REVIEW
                  : VerificationMethod.MANUAL_REVIEW,
              sourceKey: c.sourceKey ?? VerificationSourceKey.GENERIC_DOCUMENT,
              verifiedAt: c.status === VerificationStatus.VERIFIED ? new Date() : null,
            },
          },
        },
      });
      if (c.registration) {
        await prisma.professionalRegistration.create({
          data: {
            expertId: expert.id,
            authority: c.sourceKey ?? VerificationSourceKey.GENERIC_DOCUMENT,
            registerName: c.title,
            registrationNo: `REG-${credential.id.slice(-6).toUpperCase()}`,
            status: c.status,
          },
        });
      }
    }

    for (const svc of s.services) {
      await prisma.expertService.create({
        data: {
          expertId: expert.id,
          kind: svc.kind,
          title: svc.title,
          pricingModel: svc.pricingModel,
          modes: svc.modes ?? [],
          ratePerMinute: svc.ratePerMinute,
          sessionPrice: svc.sessionPrice,
          durationMinutes: svc.durationMinutes,
          productPrice: svc.productPrice,
        },
      });
    }
    i++;
  }

  console.log(`Done. ${EXPERTS.length} experts across ${VERTICALS.length} verticals.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
