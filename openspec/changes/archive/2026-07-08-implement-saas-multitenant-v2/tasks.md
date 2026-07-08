# Tasks: Implement SaaS Multitenant V2

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 2500-5000+ |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | Tooling -> DB/RLS -> Backend security -> Frontend/OpenPencil -> Verification |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Workspace and quality tooling | PR 1 | Root pnpm, app folders, test/lint/type scripts |
| 2 | SQL Server tenancy foundation | PR 2 | Companies, users, roles, RLS, seeds, migrations |
| 3 | NestJS security backend | PR 3 | Auth, ALS tenant context, RBAC, audit, token hardening |
| 4 | Angular shell and OpenPencil UI | PR 4 | Dark glass admin shell, guards, interceptors, a11y |
| 5 | Cross-slice verification | PR 5 | Integration/e2e, penetration scenarios, docs |

## Phase 1: Workspace Foundation

- [x] 1.1 Create root `package.json` and `pnpm-workspace.yaml` with scripts for install, test, lint, typecheck, and format.
- [x] 1.2 Create `apps/api`, `apps/web`, `packages/contracts`, and `db/sqlserver` directory skeletons.
- [x] 1.3 Add baseline test tooling commands required by `openspec/config.yaml`.

## Phase 2: SQL Server Tenancy Foundation

- [x] 2.1 Create `db/sqlserver/schema/001_core.sql` with `companies`, `users`, role tables, and `UNIQUEIDENTIFIER` IDs.
- [x] 2.2 Create RLS predicate and `TenantSecurityPolicy` using `SESSION_CONTEXT` for tenant-scoped tables.
- [x] 2.3 Add seed scripts for `super_admin` bootstrap and reference roles.
- [x] 2.4 Add migration runner documentation or script under `db/sqlserver/migrations`.

## Phase 3: NestJS Backend Security

- [x] 3.1 Bootstrap `apps/api` with auth, tenant, companies, users, rbac, and audit modules.
- [x] 3.2 Implement AsyncLocalStorage request context and DB `SESSION_CONTEXT` setup per request/transaction.
- [x] 3.3 Implement hardened token acceptance: compact JWS, RS256 allowlist, reject `alg=none`, reject `zip`, reject `p2c >= 1000`.
- [x] 3.4 Implement `POST /api/admin/companies` atomic provisioning and forced first-use bootstrap rotation metadata.
- [x] 3.5 Implement tenant RBAC checks for `tenant_admin`, `editor`, and `reader`.
- [x] 3.6 Implement audit events and configurable enumeration protective response.

## Phase 4: Angular and OpenPencil UI

- [x] 4.1 Bootstrap `apps/web` as Angular standalone, zoneless, signals-based app.
- [x] 4.2 Materialize and verify `design/saas-admin-shell.op`; keep `design/saas-admin-shell.md` as review fallback until visible in workspace.
- [x] 4.3 Implement dark glass morphism admin shell matching the OpenPencil design contract.
- [x] 4.4 Add auth/tenant interceptors, protected guards, accessible announcements, and focus-contained dialogs.

## Phase 5: Verification

- [x] 5.1 Add backend unit tests for auth hardening, ALS context, RBAC, and audit threshold policy.
- [x] 5.2 Add SQL RLS contract tests and document runtime SQL Server integration gap.
- [x] 5.3 Add API integration tests for provisioning, 403 cross-tenant denial, and audit event creation.
- [x] 5.4 Add frontend tests for route guards, provisioning feedback, and dialog focus containment.
- [x] 5.5 Update `openspec/config.yaml` with final executable test/build commands.
- [x] 5.6 Add verification-hardening tests for RBAC tenant-admin success, cross-tenant audit evidence, frontend error announcement/focus restoration, and signed super-admin token success.
- [x] 5.7 Add second-pass hardening evidence for first-use bootstrap replacement, HTTP 403 cross-tenant denial without leaked metadata, automatic denial audit wiring, protected-response review history, and SQL Server RLS feasibility.
