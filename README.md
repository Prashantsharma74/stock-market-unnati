# stock-market-unnati

**Unnati** — demo investment workspace (client + server).

Unnati is a demonstration investment workspace for the Indian market. Phase 1 includes account security, a premium application shell, and a dashboard built from a fixed simulated dataset.

Unnati does not place orders, accept investment money, collect PAN or bank details, or present sample prices as live market data.

## Phase status

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Project setup, design system, authentication, simulated dashboard | In this repository |
| 2 | Mutual fund discovery, SIP calculator, lumpsum calculator, learning articles | Not started |
| 3 | Stock tracking, personal watchlist, portfolio simulation | Not started |
| 4 | Admin tools, analytics, fuller notifications | Shell and account notifications only |
| 5 | Tests, performance work, application Docker images, deployment pipeline | Not started |

Navigation items for later phases open an honest placeholder instead of a dead button.

## Architecture

```
client/   React, TypeScript, Vite, Tailwind, Redux Toolkit, React Router, Recharts
server/   Node.js, Express, TypeScript, MongoDB, Mongoose, JWT, Zod
```

The API is a modular monolith. Auth, users, notifications, and dashboard each have their own routes. Market, KYC, broker, payment, banking, and lending providers are described in `server/src/integrations/providers.ts` and reported as `not_configured` by `GET /api/health`.

Sessions use an HttpOnly access cookie (15 minutes) and an HttpOnly refresh cookie. Refresh tokens are stored hashed, rotated on use, and the whole token family is revoked if a used token is presented again. Passwords are hashed with bcrypt.

Email confirmation and password reset do not call a third-party mailer. In development, messages are stored in MongoDB and shown at `/dev/mailbox`. In production that mailbox route is disabled and, until an email provider is configured, messages are not delivered.

## Requirements

- Node.js 22 or newer
- npm 11

Docker is optional. The default database is an in-memory MongoDB that resets when the API stops. Docker is not required to run Phase 1, and it is not installed on every machine.

## Run locally

From the repository root:

```powershell
npm install
npm install --prefix server
npm install --prefix client
npm run dev
```

The first API start downloads a MongoDB binary for the in-memory database. After that:

- App: http://localhost:5173
- API: http://localhost:5000
- OpenAPI: http://localhost:5000/api/docs

Open the app on `localhost`, not `127.0.0.1`, so the session cookies match `CLIENT_ORIGIN`.

### Seeded development accounts

Created only when `SEED_DEMO_DATA=true` and `NODE_ENV` is not `production`.

| Email | Password | Role |
| --- | --- | --- |
| demo@unnati.app | Demo@12345 | user |
| admin@unnati.app | Admin@12345 | admin |

Both accounts are already email-confirmed. A new registration must confirm the address from the development mailbox before signing in.

### Persistent database

```powershell
docker compose up -d
```

Set `MONGODB_URI=mongodb://127.0.0.1:27017/finora` in `server/.env`.

Copy `server/.env.example` to `server/.env` if you do not already have one. Replace `JWT_ACCESS_SECRET` before any shared deployment. The API refuses to boot in production when that secret still contains `dev-only`, or when the database URI is `memory`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | API and client together |
| `npm run typecheck` | TypeScript for both packages |
| `npm run build` | Compile the API and the client |

## API shape

Successful responses:

```json
{ "success": true, "data": {}, "message": "optional", "meta": {} }
```

Errors:

```json
{ "success": false, "message": "What happened", "code": "ERROR_CODE" }
```

Phase 1 routes live under `/api/auth`, `/api/users`, `/api/notifications`, `/api/dashboard`, and `/api/health`.

## Security notes for this release

- Access and refresh tokens are not stored in `localStorage`.
- Auth routes are rate limited.
- Helmet sets the usual security headers. Content Security Policy is left off so the Swagger UI can load; set a strict policy when the production domain is known.
- The development mailbox must never be exposed in production. The route returns 404 when `NODE_ENV=production`.
- Dashboard numbers are labelled `simulated` in the API and in the interface.

## What is intentionally absent

Live NSE, BSE, or AMFI data, real fund factsheets, order placement, payments, PAN capture, bank mandates, and a production email provider. Do not add credentials for those systems until the contract, the regulatory permission, and the integration are real.
