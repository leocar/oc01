# Apply Progress: Complete Project Documentation

## Workload / PR Boundary

- Mode: stacked PR slice
- Chain strategy: stacked-to-main
- Current work unit: Work Unit 3 / PR 3 — final review, link hardening, and checklist
- Boundary: preserve Work Units 1 and 2, perform final documentation verification, harden maintenance guidance, mark the final checklist task complete, and do not modify runtime code.
- Estimated review budget impact: within the user-provided 1000-line budget for this docs slice.

## Mode

Standard mode. Strict TDD is disabled in `openspec/config.yaml`; this slice is documentation-only.

## Completed Tasks

- [x] 1.1 Create `README.md` as a short hub with audience routes, source-of-truth links, and no duplicated low-level setup.
- [x] 1.3 Add shared sections to each narrative doc: Audience, Purpose, Implemented Now, Canonical Sources, Related Docs.
- [x] 2.1 Write `docs/product/overview.md` covering current platform scope, actors, tenant model, and boundaries from OpenSpec/design references.
- [x] 2.2 Write `docs/product/roles-and-flows.md` covering login, super-admin provisioning, and explicitly absent/planned flows.
- [x] 2.3 Verify product docs do not claim unimplemented journeys beyond `/login`, `POST /api/auth/login`, and `POST /api/admin/companies`.
- [x] 1.2 Create `docs/product/` and `docs/technical/` directories with the five planned markdown files.
- [x] 3.1 Write `docs/technical/architecture.md` with repo map, app/package/SQL boundaries, and canonical ownership table.
- [x] 3.2 Write `docs/technical/onboarding.md` with tools, setup path, env vars, and verification commands sourced from `package.json`, workspace READMEs, and CI.
- [x] 3.3 Write `docs/technical/runtime-and-operations.md` covering secure cookies, Vite `/api` proxy, SQL smoke/RLS caveats, and refresh/re-login limits.
- [x] 3.4 Add hub backlinks to `apps/api/README.md`, `apps/web/README.md`, `packages/contracts/README.md`, `db/sqlserver/README.md`, and `db/sqlserver/migrations/README.md`.
- [x] 4.1 Check all relative links across `README.md`, `docs/**/*.md`, and modified workspace READMEs resolve correctly.
- [x] 4.2 Verify documented commands against `package.json`, `.github/workflows/ci.yml`, and existing README command examples.
- [x] 4.3 Verify env vars and runtime caveats against workspace READMEs/code references; remove unsupported claims.
- [x] 4.4 Run final spec checklist for hub routing, canonical boundaries, product scope, local caveats, and review usability.

## Verification Performed

- Checked relative links in `README.md`, `docs/product/overview.md`, and `docs/product/roles-and-flows.md`.
- Verified product claims against OpenSpec specs and current route/controller sources for `/login`, `POST /api/auth/login`, and `POST /api/admin/companies`.
- Confirmed Work Unit 1 did not modify runtime code and intentionally deferred `docs/technical/*` to Work Unit 2.
- Created technical docs with required Audience, Purpose, Implemented Now, Canonical Sources, and Related Docs sections.
- Checked relative links across `README.md`, `docs/**/*.md`, and modified workspace READMEs.
- Verified documented commands against root/workspace `package.json` files. A later corrective verify pass found this evidence was incomplete because `.github/workflows/ci.yml` exists and is the CI canonical source.
- Verified environment variables and caveats against workspace READMEs and code references for session cookie options, Vite `/api` proxy, SQL smoke/RLS behavior, and in-memory refresh/re-login limitations.
- Confirmed Work Unit 2 is documentation-only and did not modify runtime code.
- Re-ran the final relative-link pass across `README.md`, `docs/**/*.md`, and modified workspace READMEs; 11 markdown files were checked and all relative links resolved.
- Re-verified documented commands against root/API/web/contracts `package.json` scripts and confirmed the docs still align with current local verification entrypoints.
- Re-verified environment variables and runtime caveats against current code references: `DATABASE_URL`, `AUTH_SESSION_PRIVATE_KEY`, `AUTH_SESSION_PUBLIC_KEY`, secure session-cookie options, Vite `/api` proxy, SQL session context, and in-memory `AuthStore` refresh behavior.
- Added a lightweight documentation maintenance checklist to the root hub so maintainers know to update canonical sources first, then narrative docs, and to re-check links, commands, env vars, and product-scope claims.
- Ran the final spec checklist for hub routing, canonical boundaries, product scope, local caveats, and review usability.
- Confirmed Work Unit 3 is documentation-only and did not modify runtime code.
- Corrective rerun: verified `.github/workflows/ci.yml` exists and documents CI triggers/jobs for tests, typecheck, lint, format check, web build, and manual SQL Server RLS smoke.
- Corrective rerun: updated onboarding, architecture, and root maintenance guidance to use `.github/workflows/ci.yml` as the CI canonical source instead of claiming CI is absent.
- Corrective rerun: re-scanned markdown claims for stale CI-absence wording and found no remaining incorrect CI-absence claims outside the prior verify report that records the original failure.

## Remaining Tasks

None.

## Deviations

None. Work Unit 3 completed the final review and checklist pass without changing the design approach.

## Files Changed in Work Unit 2

| File | Action | What Was Done |
|---|---|---|
| `README.md` | Modified | Added technical audience routes and updated current documentation scope. |
| `docs/technical/architecture.md` | Created | Added repo map, architecture boundaries, and canonical ownership table. |
| `docs/technical/onboarding.md` | Created | Added tools, setup path, environment variables, verification commands, and CI workflow guidance. |
| `docs/technical/runtime-and-operations.md` | Created | Added secure cookie, Vite proxy, SQL smoke/RLS, and refresh/re-login caveats. |
| `apps/api/README.md` | Modified | Added hub and technical-doc backlinks. |
| `apps/web/README.md` | Modified | Added hub and technical-doc backlinks. |
| `packages/contracts/README.md` | Modified | Added hub and technical-doc backlinks. |
| `db/sqlserver/README.md` | Modified | Added hub and technical-doc backlinks. |
| `db/sqlserver/migrations/README.md` | Modified | Added hub and technical-doc backlinks. |

## Files Changed in Work Unit 3

| File | Action | What Was Done |
|---|---|---|
| `README.md` | Modified | Replaced the stale future-slice note with completed scope and added a lightweight documentation maintenance checklist. |
| `openspec/changes/complete-project-documentation/tasks.md` | Modified | Marked final checklist task 4.4 complete after verification. |
| `openspec/changes/complete-project-documentation/apply-progress.md` | Modified | Merged Work Unit 3 evidence with prior apply progress. |

## Files Changed in Corrective Rerun

| File | Action | What Was Done |
|---|---|---|
| `README.md` | Modified | Added `.github/workflows/ci.yml` as the CI source-of-truth link and maintenance-checklist target. |
| `docs/technical/architecture.md` | Modified | Corrected the CI canonical-source row to point at `.github/workflows/ci.yml`. |
| `docs/technical/onboarding.md` | Modified | Replaced the CI-absence claim with the actual workflow triggers, local script mapping, and canonical workflow link. |
| `openspec/changes/complete-project-documentation/apply-progress.md` | Modified | Added corrective evidence and removed stale CI-absence wording from current progress notes. |

## Issues Found

- Corrected verify failure: `.github/workflows/ci.yml` exists and is now documented as the CI canonical source.
