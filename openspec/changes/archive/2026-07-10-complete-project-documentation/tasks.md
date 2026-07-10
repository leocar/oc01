# Tasks: Complete Project Documentation

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 750-950 docs lines |
| 400-line budget risk | High |
| 1000-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 hub/product -> PR 2 technical/backlinks -> PR 3 verification polish |
| Delivery strategy | auto-forecast |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High
1000-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Create root hub and product docs | PR 1 | `README.md`, `docs/product/*`; verify no overpromise. |
| 2 | Create technical docs and backlinks | PR 2 | `docs/technical/*`, workspace README backlinks; verify commands/env/caveats. |
| 3 | Review and link hardening | PR 3 | Link pass, canonical-source pass, final docs checklist. |

## Phase 1: Documentation Skeleton

- [x] 1.1 Create `README.md` as a short hub with audience routes, source-of-truth links, and no duplicated low-level setup.
- [x] 1.2 Create `docs/product/` and `docs/technical/` directories with the five planned markdown files.
- [x] 1.3 Add shared sections to each narrative doc: Audience, Purpose, Implemented Now, Canonical Sources, Related Docs.

## Phase 2: Product Documentation

- [x] 2.1 Write `docs/product/overview.md` covering current platform scope, actors, tenant model, and boundaries from OpenSpec/design references.
- [x] 2.2 Write `docs/product/roles-and-flows.md` covering login, super-admin provisioning, and explicitly absent/planned flows.
- [x] 2.3 Verify product docs do not claim unimplemented journeys beyond `/login`, `POST /api/auth/login`, and `POST /api/admin/companies`.

## Phase 3: Technical Documentation and Backlinks

- [x] 3.1 Write `docs/technical/architecture.md` with repo map, app/package/SQL boundaries, and canonical ownership table.
- [x] 3.2 Write `docs/technical/onboarding.md` with tools, setup path, env vars, and verification commands sourced from `package.json`, workspace READMEs, and CI.
- [x] 3.3 Write `docs/technical/runtime-and-operations.md` covering secure cookies, Vite `/api` proxy, SQL smoke/RLS caveats, and refresh/re-login limits.
- [x] 3.4 Add hub backlinks to `apps/api/README.md`, `apps/web/README.md`, `packages/contracts/README.md`, `db/sqlserver/README.md`, and `db/sqlserver/migrations/README.md`.

## Phase 4: Verification and Review Readiness

- [x] 4.1 Check all relative links across `README.md`, `docs/**/*.md`, and modified workspace READMEs resolve correctly.
- [x] 4.2 Verify documented commands against `package.json`, `.github/workflows/ci.yml`, and existing README command examples.
- [x] 4.3 Verify env vars and runtime caveats against workspace READMEs/code references; remove unsupported claims.
- [x] 4.4 Run final spec checklist for hub routing, canonical boundaries, product scope, local caveats, and review usability.
