# Appeco — Financial Platform for P&L and Smart Cashflow

## Technology Stack (defined before implementation)

Recommended stack for this product profile:

- **Frontend**: React + TypeScript + Vite + Recharts
  - Fast UI iteration and high-quality dashboard UX.
  - Strong typing for financial calculations and DTOs.
- **Backend**: Node.js + Fastify + TypeScript + Zod
  - High-performance API layer with explicit schema validation.
- **Document processing layer**: Dedicated TypeScript service (`apps/processor`)
  - Isolates parsing/classification from transactional API concerns.
  - Ready to evolve into queue-based asynchronous workers.
- **Shared domain package**: `@appecon/shared`
  - Single source of truth for domain types across apps.

## Naming conventions (mandatory)

All naming rules are defined in `docs/naming-conventions.md` and enforced in this codebase.

Key rule: **English-only naming** across tables, fields, variables, folders, APIs, and UI labels.

## Repository Architecture

```text
apps/
  api/         # Fastify API: entries, imports, reports, anti-duplication, AI insights
  web/         # React dashboard: executive metrics, charts, entry management
  processor/   # Document normalization/classification layer
packages/
  shared/      # Shared domain contracts and types
docs/
  naming-conventions.md
```

## Current MVP Features

- Manual ledger entry creation (date, amount, description, category, bank account, type).
- Entry editing and deletion.
- Import endpoint supporting `pdf`, `xlsx`, `ods`, `credit_card`.
- Auto-category suggestion and lightweight learning from user corrections.
- Credit card anti-duplication using:
  - value similarity,
  - date proximity,
  - description text similarity.
- Reports:
  - operating cashflow,
  - cashflow by bank account,
  - executive dashboard metrics.
- AI insights endpoint with:
  - top cost centers,
  - category percentage over expenses,
  - risk detection,
  - actionable opportunities.

## Environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Example values:

```env
HOST=0.0.0.0
PORT=3333
CORS_ORIGIN=http://localhost:5173
VITE_API_URL=http://localhost:3333
```

## Main local scripts

- `npm run dev:api` → start API (`http://localhost:3333`)
- `npm run dev:web` → start frontend (`http://localhost:5173`)
- `npm run build` → build all workspaces
- `npm run typecheck` → run type checks in all workspaces
- `npm run lint` → run lint scripts where available

## Local run (Linux/macOS)

```bash
git clone <REPOSITORY_URL>
cd appecon
cp .env.example .env
npm install
```

Terminal 1:

```bash
npm run dev:api
```

Terminal 2:

```bash
npm run dev:web
```

## Local run on Windows (PowerShell) from `C:\dev`

```powershell
cd C:\dev
git clone <REPOSITORY_URL>
cd .\appecon
Copy-Item .env.example .env
npm install
```

Open two PowerShell terminals in `C:\dev\appecon`.

Terminal 1 (API):

```powershell
npm run dev:api
```

Terminal 2 (Web):

```powershell
npm run dev:web
```

Access:
- Web: `http://localhost:5173`
- API: `http://localhost:3333`
