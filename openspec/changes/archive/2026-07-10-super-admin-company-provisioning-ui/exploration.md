## Exploration: super-admin-company-provisioning-ui

### Current State
The current flow already contains the core path, but it is still MVP-grade. Angular routes unauthenticated users from `/` to `/login`, and successful login stores authority only in the in-memory `AuthStore` before navigating back to `/`. The protected root route renders `AdminShellComponent`, which already exposes a company provisioning form and posts `companyName` plus `adminEmail` to `POST /api/admin/companies`. On the API side, `AuthController` issues a hardened RS256 session cookie, `TenantContextMiddleware` rebuilds request context from the cookie or bearer token, and `CompaniesService` enforces `super_admin`, sets SQL Server `SESSION_CONTEXT`, creates the company, creates the initial company-scoped user, assigns `tenant_admin`, and audits the action inside one transaction. RLS allows `super_admin` access globally and tenant-scoped access through `company_id` session context.

### Affected Areas
- `apps/web/src/app/auth/login.component.ts` — current login UX and post-login navigation always target `/`.
- `apps/web/src/app/auth/auth.store.ts` — auth state is in memory only; no session rehydration exists.
- `apps/web/src/app/auth/tenant-admin.guard.ts` — root access is currently gated only by `canProvisionTenants()`.
- `apps/web/src/app/app.routes.ts` — the current initial/home screen is the protected root shell.
- `apps/web/src/app/shell/admin-shell.component.ts` — existing provisioning UI is hard-coded and needs productization or reshaping.
- `packages/contracts/src/index.ts` — create-company request/response contracts are already defined and may need extension only if UX needs more return data.
- `apps/api/src/companies/companies.controller.ts` — exposes `POST /api/admin/companies`.
- `apps/api/src/companies/companies.service.ts` — enforces `super_admin` and provisions company + tenant admin atomically.
- `apps/api/src/tenant/tenant-context.middleware.ts` — restores auth context from session cookie/bearer token for protected requests.
- `db/sqlserver/schema/002_rls.sql` — RLS behavior depends on `SESSION_CONTEXT(company_id, user_role)` and already permits `super_admin`.

### Approaches
1. **Productize the existing root shell** — Keep `/` as the super-admin landing screen and evolve the current `AdminShellComponent` into the first supported company-creation experience.
   - Pros: Lowest churn; endpoint and Angular wiring already exist; fastest path to an end-to-end vertical slice; keeps review size controlled.
   - Cons: Current shell mixes demo/security-dashboard content with real provisioning; may need refactor to avoid shipping placeholder metrics and labels.
   - Effort: Medium

2. **Add a dedicated provisioning route/flow after login** — Keep login as-is, but route super-admin users to a focused company-creation page or wizard separate from the current shell.
   - Pros: Cleaner UX separation; easier to scale later into a broader super-admin console; avoids coupling provisioning to current shell visuals.
   - Cons: More routing/state work now; higher chance of duplicated shell logic; slower first slice with no backend benefit.
   - Effort: Medium/High

### Recommendation
Recommend **Productize the existing root shell** for the first slice. The important architectural work is already present end-to-end: login, session issuance, request context restoration, authorization, transactionality, and RLS-safe provisioning. The proposal should focus on replacing the placeholder/admin-demo presentation with a clear super-admin landing experience, stronger form validation and submission states, success/error handling, and explicit UX for what happens after company creation. A follow-up slice can extract a dedicated super-admin console if the product surface grows.

### Risks
- **Session persistence gap**: The frontend auth state is memory-only, so a refresh can lose UI authority even when the secure cookie still exists; proposal must decide whether to add a session-bootstrap endpoint now or accept login-only continuity for the first slice.
- **Bootstrap UX gap**: The backend returns `bootstrapAccessMode` and `forceRotateOnFirstUse`, but does not return a plaintext bootstrap credential; product must decide what confirmation the super-admin sees after creation.
- **Validation gap**: The current UI has no explicit field-level validation for company name/email beyond basic signal usage, so failed provisioning may collapse into generic errors.
- **Authorization/landing assumptions**: Current root route is effectively super-admin-only. If tenant admins need a different home soon, routing should be designed now to avoid another navigation rewrite.
- **Open product questions**: Should company creation remain available immediately after login every time, or only when no company is selected? Should the super-admin stay on the same screen after success, create multiple companies in sequence, or be redirected to a detail/summary state?

### Ready for Proposal
Yes — with explicit assumptions. The orchestrator should tell the user that the backend contract already supports secure provisioning, the web already has a rough provisioning shell, and the proposal should now define the first-slice UX, session-restoration scope, and post-create success behavior without exposing any bootstrap secret.
