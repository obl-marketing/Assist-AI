# FREED mobile

Expo + TypeScript, mobile-first. Built with expo-router, TanStack Query
(server state) and Zustand (light client state).

```
app/
├── _layout.tsx            Root: providers + stack
├── (tabs)/                Bottom nav: Home · Explore · Bookings · Messages · Profile
│   ├── index.tsx          Home — "What can we help you with?" + Available now
│   └── explore.tsx        The five verticals
├── match.tsx              AI front door / "Talk now" results (with "why this person")
└── expert/[id].tsx        Expert profile + Trust Profile + ways to consult
src/
├── theme.ts               Brand tokens (Unbounded + Inter, pink/green/cream)
├── types.ts               API types mirroring the backend contracts
├── lib/api.ts             Typed API client (EXPO_PUBLIC_API_URL)
├── lib/query.ts           TanStack Query client
├── store/session.ts       Zustand auth/session
└── components/            Avatar, ClassBadge, AvailabilityPill, ExpertCard, …
```

## Run

```bash
npm install
EXPO_PUBLIC_API_URL=http://localhost:4000/api npm start
# press i / a for iOS / Android, or scan the QR with Expo Go
```

Point `EXPO_PUBLIC_API_URL` at the backend (default `http://localhost:4000/api`).

## Status

Home, AI-match and expert-profile screens are wired to the API and render the
Trust Profile, availability states and "why this person" reasons. Bookings /
Messages / Profile are stubs to fill in next — the fully-designed reference for
every screen is [`../web/freed.html`](../web/freed.html).

Fonts: add `@expo-google-fonts/unbounded` and `@expo-google-fonts/inter` and
load them in `_layout.tsx` to match the prototype's typography.
