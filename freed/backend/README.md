# FREED backend

NestJS + Prisma (PostgreSQL). The marketplace + verification spine.

## Modules

| Module | What it owns |
|---|---|
| `auth` | Progressive signup (phone/email → OTP → account); JWT access tokens |
| `catalog` | The five verticals + sub-categories (`verticals.ts`), DB sync |
| `experts` | Expert read model, **Trust Profile**, progressive onboarding |
| `verification` | The pluggable, source-by-source **verification engine** |
| `matching` | AI front door — natural language → relevant people + "why this person"; availability states |
| `consultations` | 3-model **pricing**, bookings, metered live consultations |

## The verification engine

```
Credential ──▶ ProviderRegistry.resolve() ──▶ VerificationProvider.verify()
                                                   │
                                     ┌─────────────┴─────────────┐
                                RCI_CRR  INC_NRTS  NTA_UGC_NET  …  GENERIC_DOCUMENT
                                                   │
                                        CredentialVerification
                                        (PENDING → … → VERIFIED)
```

- `providers/provider.interface.ts` — the contract every source implements.
- `providers/index.ts` — one provider per authority (stubs that encode routing;
  real integrations slot in behind the same interface).
- `provider.registry.ts` — resolves the right provider for a credential.
- `claim-lifecycle.ts` — the pure state machine; the single authority on legal
  transitions.
- `verification.service.ts` — orchestration + persistence + the manual-review
  path (the only way a document-backed claim becomes `VERIFIED`).

**Principle:** OCR extracts, humans/sources verify. `sweepExpired()` flags
verified-but-expired registrations for re-verification.

## Key endpoints

```
POST /api/auth/otp/request            { phone | email }
POST /api/auth/otp/verify             { phone | email, code } → { user, accessToken }

GET  /api/catalog/verticals
GET  /api/catalog/categories?vertical=EXAMS_ACADEMICS

POST /api/match                       { text?, categoryKey?, liveOnly?, limit? }
GET  /api/experts/:id
GET  /api/experts/:id/trust-profile
GET  /api/experts/:id/onboarding
PATCH /api/experts/:id/onboarding     { step, patch }

GET  /api/verification/sources
POST /api/verification/credentials/:id/run
POST /api/verification/credentials/:id/review   { reviewerId, decision, notes? }
POST /api/verification/experts/:id/submit       { requested: CredentialType[] }

POST /api/bookings                    { seekerId, serviceId, mode?, scheduledAt?, durationMinutes? }
POST /api/bookings/:id/start          { mode }
POST /api/bookings/:id/end
GET  /api/bookings?seekerId=…&status=…
```

## Develop

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate      # dev migration
npm run db:seed
npm run start:dev
npm run typecheck           # tsc --noEmit — currently clean
```
