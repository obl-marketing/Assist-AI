# FREED — the real app

> *"Talk to someone who knows."*
> A verified-expertise marketplace: describe a problem in plain words, get
> matched with a **verified person who has actually been there**, and talk now
> or book later.

This folder is the production scaffold. It is deliberately **not** "a website
where coaches list themselves" — it is **verified-expertise infrastructure**:
claim-level verification + matching + instant/scheduled consultation + payments.

For the fully-clickable product walkthrough (all 25 screens, look & feel), see
[`../web/freed.html`](../web/freed.html). That prototype is the visual spec;
this scaffold is the codebase it grows into.

```
freed/
├── backend/   NestJS + Prisma (PostgreSQL) — the marketplace + verification spine
└── mobile/    Expo + TypeScript (expo-router, TanStack Query, Zustand)
```

## The five founding verticals

Supply is built vertical by vertical, not "10,000 kinds of coaches":

| Vertical | Emoji | Examples |
|---|---|---|
| Exams & Academics | 🎓 | JEE, NEET, GATE, UPSC, UGC-NET, JRF, PhD, research |
| Career & Professional | 💼 | PM, engineering, data, design, finance, HR, leadership, interviews |
| Sports & Performance | 🏅 | national/international athletes, coaches, S&C, sports psych |
| Teaching & Knowledge | 📚 | professors, researchers, scientists, languages, coding |
| Wellness & Guidance | 🧠 | clinical psychologists (registered) **vs.** coaches — never blurred |

Defined once in [`backend/src/catalog/verticals.ts`](backend/src/catalog/verticals.ts).

## The core idea, in code

**Verification is claim-level, never a single buyable badge.** An expert is a
bundle of individually verifiable credentials, each with its own lifecycle:

```
PENDING → UNDER_REVIEW → VERIFIED → EXPIRED → REQUIRES_REVERIFICATION
   └────────→ REJECTED ←──────────┘
```

- The engine is **pluggable, source-by-source**. Each authority
  (RCI/CRR, INC/NRTS, NTA UGC-NET, institute degree, employer, sports
  federation) is one `VerificationProvider`; a fallback does upload + manual
  review. See [`backend/src/verification/`](backend/src/verification/).
- **OCR only extracts — it never verifies.** A document-backed claim can only
  reach `VERIFIED` through an authoritative source or a human on the trust team.
- The UI renders a **Trust Profile** (claim by claim + track record), not an
  arbitrary score. See [`backend/src/experts/trust-profile.ts`](backend/src/experts/trust-profile.ts).
- **Licensed professional ≠ coach.** `ProfessionalClass` keeps them distinct
  everywhere, with stricter handling for regulated (mental-health) fields.

**Pricing is three models** (`PER_MINUTE`, `FIXED_SESSION`, `PRODUCT`) with a
transparent fee split and non-binding guidance band — the expert always sets
their own price. See [`backend/src/consultations/pricing.service.ts`](backend/src/consultations/pricing.service.ts).

**Availability is a first-class state** (`OFFLINE / AVAILABLE / BUSY /
IN_SESSION / AWAY`) that renders as "Available now" / "Available in 12 min" /
"Next at 4:30 PM". See [`backend/src/matching/availability.ts`](backend/src/matching/availability.ts).

**"Why this person?"** — the matcher returns concrete reasons, not just stars.
See [`backend/src/matching/matching.service.ts`](backend/src/matching/matching.service.ts).

## Run it

```bash
# 1) Backend
cd backend
cp .env.example .env            # set DATABASE_URL to a local Postgres
npm install
npm run prisma:generate
npm run prisma:migrate          # creates the schema
npm run db:seed                 # 5 verticals + starter experts w/ verified claims
npm run start:dev               # http://localhost:4000/api

# 2) Mobile (in another terminal)
cd ../mobile
npm install
EXPO_PUBLIC_API_URL=http://localhost:4000/api npm start
```

Try `POST /api/match` with `{ "text": "I want to prepare for GATE" }` to see the
AI-front-door flow return relevant people with reasons.

## Status

- **Backend** — schema validated, full project **type-checks clean** (`npm run typecheck`).
  Verification engine, matching, pricing, catalog, experts/Trust Profile,
  progressive onboarding and bookings are implemented; provider integrations
  and payment/video vendors are stubbed behind interfaces pending
  commercial/legal review.
- **Mobile** — idiomatic Expo Router scaffold with the home, AI-match and
  expert-profile screens wired to the API; remaining tabs stubbed. Authored
  here but not built in CI yet (needs the Expo toolchain).

See [`backend/README.md`](backend/README.md) and [`mobile/README.md`](mobile/README.md).
