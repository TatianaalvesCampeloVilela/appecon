# Naming Conventions

These conventions are mandatory across the repository.

## 1) Language
- Use **English only** for:
  - folder names;
  - file names;
  - database schema names;
  - API routes;
  - variables, functions, classes, interfaces, and enums;
  - user-facing labels and messages.
- Do not mix languages in the same artifact.

## 2) Database Conventions
- Table names: `snake_case`, plural nouns.
  - Example: `ledger_entries`, `bank_accounts`, `cost_centers`.
- Column names: `snake_case`.
  - Example: `bank_account_id`, `created_at`, `updated_at`.
- Primary keys: `id` (UUID).
- Foreign keys: `<referenced_table_singular>_id`.
  - Example: `bank_account_id`.
- Timestamps:
  - `created_at`, `updated_at`, optional `deleted_at` for soft delete.
- Enum-like fields should use stable lowercase values.
  - Example: `entry_type` values `revenue`, `expense`, `transfer`, `tax`, `fee`, `royalty`.

## 3) TypeScript/JavaScript Conventions
- Folders/files: `kebab-case`.
- Variables/functions: `camelCase`.
- Interfaces/types/classes/components: `PascalCase`.
- Constants: `UPPER_SNAKE_CASE` for immutable globals only.
- Booleans: prefix with `is`, `has`, `can`, `should`.
- Event handlers: prefix with `on` (e.g., `onSubmit`).

## 4) API Conventions
- Routes: lowercase with hyphens if needed.
  - Example: `/reports/cashflow-operational`.
- JSON fields: `camelCase`.
- Validation schemas mirror payload field names exactly.
- Error messages are English and actionable.

## 5) Frontend Conventions
- Component files: `PascalCase.tsx`.
- Shared service modules: `kebab-case.ts`.
- State names are domain-specific and explicit.
  - Example: `executiveMetrics`, `expensesByCategory`, `profitTrend`.

## 6) Financial Domain Conventions
- Canonical entry type enum:
  - `revenue`, `expense`, `transfer`, `tax`, `fee`, `royalty`.
- Canonical main entity name:
  - `LedgerEntry` in code, `ledger_entries` in database.
- Canonical KPI names:
  - `revenue`, `totalExpenses`, `taxes`, `contributionMargin`, `netProfit`.
