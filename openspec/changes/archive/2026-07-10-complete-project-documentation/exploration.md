## Exploration: complete-project-documentation

### Current State
OC01 already has strong source material, but it is fragmented by audience and location. Product behavior is defined mostly in OpenSpec (`openspec/specs/*`), UI intent is split across design references (`design/super-user-login.md`, `design/saas-admin-shell.md`, `design/openpencil/forms/*.op`), and technical setup/runtime notes live in workspace READMEs (`apps/api/README.md`, `apps/web/README.md`, `db/sqlserver/README.md`, `packages/contracts/README.md`). The running system today is a pnpm monorepo with an Angular standalone web app, a NestJS API, shared contracts, and SQL Server schema/RLS assets. Login uses `POST /api/auth/login`, the API issues an RS256 session cookie (`HttpOnly`, `Secure`, `SameSite=Strict`), `TenantContextMiddleware` restores request auth context from cookie/bearer tokens into `AsyncLocalStorage`, and company provisioning is a `super_admin`-only flow at `POST /api/admin/companies`. SQL Server tenant isolation is enforced both in backend RBAC and RLS via `SESSION_CONTEXT`. There is no root README, no consolidated onboarding path, no single product overview, and no documentation map for operators, developers, or reviewers.

### Affected Areas
- `package.json` — workspace commands that should anchor setup, test, typecheck, format, and smoke-check docs.
- `.github/workflows/ci.yml` — current CI contract for tests, typecheck, lint, format, build, and optional SQL smoke.
- `openspec/config.yaml` — current SDD/OpenSpec rules and verification commands.
- `openspec/specs/identity-provisioning/spec.md` — source of truth for login, super-admin, company creation, bootstrap policy, and hardened sessions.
- `openspec/specs/frontend-tenant-shell/spec.md` — source of truth for login UX, protected routes, provisioning UX, and accessibility behavior.
- `openspec/specs/tenant-isolation/spec.md` — source of truth for backend + persistence defense-in-depth tenant isolation.
- `openspec/specs/authorization-rbac/spec.md` — source of truth for role semantics.
- `openspec/specs/audit-monitoring/spec.md` — source of truth for denial auditing and enumeration protection.
- `apps/api/README.md` — existing backend scope, env vars, and local super-user setup notes to preserve rather than duplicate.
- `apps/web/README.md` — existing frontend scope and login behavior notes to preserve rather than duplicate.
- `db/sqlserver/README.md` and `db/sqlserver/migrations/README.md` — existing schema/RLS/smoke/migration guidance to preserve rather than duplicate.
- `packages/contracts/README.md` — existing shared-contract boundary notes.
- `apps/api/src/auth/auth.controller.ts` — login endpoint behavior that product and technical docs must describe accurately.
- `apps/api/src/auth/auth-credential.service.ts` — global principal login behavior and `global_principal_login` session-context exception.
- `apps/api/src/auth/session-token-issuer.service.ts` / `apps/api/src/auth/token-validator.service.ts` / `apps/api/src/auth/session-cookie.ts` — session signing, verification, and cookie-hardening details.
- `apps/api/src/tenant/tenant-context.middleware.ts` / `apps/api/src/tenant/tenant-context.service.ts` — request auth/tenant restoration model.
- `apps/api/src/companies/companies.service.ts` — authoritative company + initial tenant-admin provisioning flow.
- `apps/api/src/database/database.service.ts` — transaction and SQL Server `SESSION_CONTEXT` lifecycle.
- `apps/api/src/rbac/rbac.service.ts` / `apps/api/src/tenant-access/tenant-access.service.ts` — role enforcement, cross-tenant denial, and protective-response behavior.
- `db/sqlserver/schema/001_core.sql` / `db/sqlserver/schema/002_rls.sql` — actual schema entities and RLS predicates that technical docs must explain.
- `apps/web/src/app/auth/login.component.ts` / `auth.store.ts` / `tenant-admin.guard.ts` / `app.routes.ts` — real frontend login/protected-shell behavior and current session rehydration limitation.
- `apps/web/src/app/shell/admin-shell.component.ts` — real product flow for company provisioning and accessible feedback.
- `design/super-user-login.md`, `design/saas-admin-shell.md`, `design/openpencil/forms/*.op` — product-facing design references that should be linked from docs, not rewritten as separate truth sources.

### Approaches
1. **Single mega-README** — Put product overview, setup, architecture, auth, tenancy, SDD, and troubleshooting into one top-level document.
   - Pros: Fastest to discover; minimal navigation overhead; easy first draft.
   - Cons: High cognitive load; mixes audiences; hard to review and keep current; duplicates existing workspace READMEs quickly.
   - Effort: Low/Medium

2. **Layered docs hub with audience split** — Create a short root entrypoint plus linked product and technical doc sets, while treating OpenSpec and workspace READMEs as source-linked references.
   - Pros: Best fit for current repo shape; reduces duplication; supports onboarding and product understanding separately; aligns with cognitive-doc-design patterns.
   - Cons: Requires clearer doc ownership and cross-link discipline; more initial IA decisions.
   - Effort: Medium

### Recommendation
Recommend **Layered docs hub with audience split**. The proposal should define a concise root documentation entrypoint that answers “what is OC01?” first, then branches into: (1) product/user understanding, (2) technical/onboarding understanding, and (3) canonical references. Product docs should explain actors, login, super-admin powers, company creation, tenants, roles, isolation, and expected flows in narrative form. Technical docs should explain repo layout, Angular/NestJS boundaries, auth/session/cookie flow, SQL Server schema/RLS, OpenPencil artifacts, SDD/OpenSpec workflow, setup/env/test/CI, and known limitations. Existing workspace READMEs, OpenSpec specs, and design references should be retained as canonical low-level references and linked instead of being re-authored wholesale.

### Risks
- Documentation drift between narrative docs and canonical sources (`openspec/specs/*`, workspace READMEs, SQL schema) if ownership is unclear.
- The current frontend session model is memory-only; docs must call out refresh/re-login behavior or they will mislead readers.
- Local dev expectations around `Secure` cookies and the Vite `/api` proxy are easy to misunderstand if setup docs are vague.
- Product docs can accidentally overpromise tenant-admin journeys that are not yet implemented beyond provisioning/bootstrap boundaries.
- OpenPencil `.op` assets are valuable references but not self-explanatory; docs must link them with context instead of assuming readers can infer intent.

### Ready for Proposal
Yes — the orchestrator should tell the user the repo already contains enough product, design, spec, runtime, and test evidence to draft a complete documentation plan. The next phase should propose the documentation information architecture, canonical source boundaries, and a no-duplication writing plan before any docs are authored.
