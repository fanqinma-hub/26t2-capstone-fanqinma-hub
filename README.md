# FunWattle Size Words - Team ALMOND

FunWattle is Team ALMOND's COMP9900 application for the Size Words learning unit, Big, Small and Everything in Between.

This repository establishes the Sprint 2 platform, routing, environment, Docker, CI, and integration baseline.

Canonical requirements and contracts:

- `docs/sprint2-role-workplan.md`
- `docs/sprint2-shared-contracts.md`

## Technical baseline

- Expo SDK 54 and React Native 0.81.5
- TypeScript 5.9 with strict checking
- Expo Router with typed routes
- Node.js 20.19.4
- Project-local Expo CLI
- Docker on `http://localhost:8081`
- Explicit `mock` or `azure` runtime configuration
- Automated quality and repository security checks
- Dependabot and repository security policy

## Prerequisites

Use Node.js 20.19.x, npm, Docker Desktop, and Chrome.

Do not install or use a global Expo CLI.

## Environment setup

Create the ignored local environment file with:

`Copy-Item .env.example .env.local`

The committed template uses mock mode and blank credentials:

- `EXPO_PUBLIC_SPEECH_MODE=mock`
- `EXPO_PUBLIC_AZURE_SPEECH_KEY` must remain blank in the committed template
- `EXPO_PUBLIC_AZURE_SPEECH_REGION` must remain blank in the committed template

Azure credentials must exist only in `.env.local`. Never commit them or place them in issues, PRs, logs, screenshots, or Docker build arguments.

## Install and validate

Run:

1. `npm ci`
2. `npm run check`
3. `npm audit --audit-level=high`

`npm run check` validates Expo dependencies, TypeScript, ESLint, and Jest tests.

Do not run `npm audit fix --force` without reviewing Expo SDK compatibility.

## Run locally

Run `npx expo start --web --port 8081`, then open `http://localhost:8081`.

## Run with Docker

1. Run `docker compose up --build`.
2. Open `http://localhost:8081`.
3. Check status with `docker compose ps`.
4. Stop with `docker compose down`.

No personal LAN IP is required.

## Route contract

Canonical routes are exported by `src/config/app-config.ts`.

| Surface | Route |
| --- | --- |
| Home | `/` |
| Generic activity | `/activity/1` through `/activity/5` |
| Report | `/report` |

Pages must consume `appRoutes` instead of duplicating route strings.

## Runtime configuration

- Mock mode works without Azure credentials.
- Azure mode requires both a local key and region.
- Missing or invalid configuration returns a configuration error.
- Azure mode must never silently fall back to mock mode.

## Security

The repository must not track private environment files, credentials, personal LAN IP addresses, dependency directories, or generated output.

See `SECURITY.md` for the reporting policy.

## Pull requests

Before requesting review, run:

1. `npm ci`
2. `npm run check`
3. `npm audit --audit-level=high`
4. `git diff --check`

The GitHub Actions Quality Gate must pass before merge.

## Team

Team ALMOND  
COMP9900, UNSW, 26T2