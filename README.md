# ESK Packaging Storefront

New, independent Next.js frontend for `ESK_API` (the ESK Packaging storefront).

## Prerequisites

- A recent Node.js LTS release.

## Setup

```bash
npm install
cp .env.example .env.local
```

`NEXT_PUBLIC_API_URL` in `.env.example` already points at the real, shared backend —
there is no separate local/mock backend for this project. `NEXT_PUBLIC_CDN_URL` and
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` need real values set for CDN images and Stripe
checkout to work, but the app runs fine without them for basic scaffold/dev purposes.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint the codebase |
| `npm run test` | Unit/component tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) |

Before the first `npm run test:e2e` run, install the Playwright browser binary once
(not installed via `npm install`):

```bash
npx playwright install chromium
```

## Known limitations

This is a **structural scaffold only** — theming and real component/business logic
are deferred to a later planning phase.

In particular, `stores/authStore.js` is never populated with a real user yet: no code
currently calls `GET /api/user/user-details` to bootstrap it. As a result, pages under
`/account` will render blank (they will not redirect to `/login`, nor show content)
until that wiring is added in the next phase. This is a known, intentional gap, not a
bug to chase.
