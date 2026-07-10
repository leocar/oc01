# Apply Progress: Super Admin Company Provisioning UI

## Mode

Standard corrective apply mode. Strict TDD is disabled in `openspec/config.yaml`; tests were extended before implementation where practical.

## Completed Tasks

- [x] 1.1 Extended `apps/web/test/admin-shell.component.spec.ts` for local validation, pending submit, non-secret success, and accessible failure feedback.
- [x] 1.2 Extended `apps/web/test/tenant-admin.guard.spec.ts` for authenticated non-`super_admin` redirect-to-login denial.
- [x] 1.3 Confirmed `apps/web/test/app.routes.spec.ts` covers unauthenticated protected-root navigation resolving to login.
- [x] 2.1 Refactored `apps/web/src/app/shell/admin-shell.component.ts` to explicit provisioning state, validation, disabled pending submit, and relative `/api/admin/companies` POST.
- [x] 2.2 Rendered non-secret `CreateCompanyResponse` metadata without displaying or inventing credentials.
- [x] 2.3 Updated `apps/web/src/app/shell/admin-shell.component.css` for validation errors, disabled/loading state, responsive form layout, and success/error panels.
- [x] 3.1 Preserved `tenantAdminGuard` super-admin-only behavior through `AuthStore.canProvisionTenants()` and redirect-to-login denial.
- [x] 3.2 Preserved in-session-only auth continuity; no persistence or rehydration was added.
- [x] 4.1 Ran `npx pnpm@9.15.4 --filter @oc01/web test` successfully.
- [x] 4.2 Runtime-checked `POST /api/admin/companies` through the Vite `/api` proxy with a signed-in `super_admin` session using existing running API/web processes; combined HTTP proxy success with web unit coverage for pending/success UI.
- [x] 4.3 Runtime/test-checked invalid input, API failure state, unauthenticated denial, and authenticated non-super-admin denial without exposing secrets.
- [x] 4.4 Ran `npx pnpm@9.15.4 typecheck` and `npx pnpm@9.15.4 --filter @oc01/web build` successfully.

## Corrective Rerun Work

- [x] Reconciled OpenSpec and Engram apply-progress divergence by reading both backends and merging the current cumulative state into this file and Engram topic `sdd/super-admin-company-provisioning-ui/apply-progress`.
- [x] Fixed the API RLS contract test to recognize the existing global-principal filter for `dbo.users` and `dbo.user_roles` while preserving tenant-scoped `dbo.fn_tenant_predicate` coverage for tenant tables and block predicates.
- [x] Replaced concrete-looking example secret/password values in `apps/api/.env.example` with safe placeholders without printing `.env` contents.

## Remaining Tasks

None.

## Verification Evidence

| Command / Check | Result |
|---|---|
| Port owner inspection for 3000 and 5173 | Existing listeners found in the prior apply cycle; no broad process kills used. |
| Vite proxy login `POST http://localhost:5173/api/auth/login` | Previously passed: HTTP 200, `super_admin` role present, session cookie received; no secret values printed. |
| Vite proxy provisioning `POST http://localhost:5173/api/admin/companies` with session cookie | Previously passed: HTTP 201, response keys `adminUserId`, `bootstrapAccessMode`, `companyId`, `forceRotateOnFirstUse`, no password/secret/token/credential-like keys, `forceRotateOnFirstUse=true`. |
| Vite proxy unauthenticated provisioning probe | Previously passed: HTTP 401. |
| `npx pnpm@9.15.4 --filter @oc01/api test -- test/sql-rls-contract.spec.ts` | Passed: 1 file, 2 tests. |
| `npx pnpm@9.15.4 --filter @oc01/api test` | Passed: 13 files, 43 tests. |
| `npx pnpm@9.15.4 --filter @oc01/web test` | Passed: 6 files, 20 tests. |
| `npx pnpm@9.15.4 typecheck` | Passed. |
| `npx pnpm@9.15.4 format:check` | Passed. |
| `npx pnpm@9.15.4 --filter @oc01/web build` | Passed. |

## Scope Contamination Note

The current worktree still includes broader pre-existing auth/login/RLS work outside this UI change, including API login/session/RLS files, SQL RLS changes, web login/auth tests, docs, lockfile changes, and archived `add-super-user-login` SDD artifacts. This corrective rerun did not revert those user/project-approved changes. The intended files for the `super-admin-company-provisioning-ui` slice remain the web provisioning shell, guard/auth store behavior, related web tests, contracts only as needed for non-secret response typing, and this change's OpenSpec artifacts. The only corrective edits made in this rerun outside that UI slice were limited to the related RLS contract test and safe `.env.example` placeholders.

## Verification Boundary Classification

This change's credible verification boundary is **not a clean worktree diff against `HEAD`**. It is a UI slice layered on top of the already-applied super-user login/session/RLS baseline. No commit, stash, or revert was performed because isolating the worktree mechanically would require moving or reverting user-approved prerequisite work.

| Class | Files / paths | Boundary role |
|---|---|---|
| A: Required by `super-admin-company-provisioning-ui` | `apps/web/src/app/shell/admin-shell.component.ts`, `apps/web/src/app/shell/admin-shell.component.css`, `apps/web/test/admin-shell.component.spec.ts`, `apps/web/test/tenant-admin.guard.spec.ts`, `apps/web/test/app.routes.spec.ts`, `apps/web/vite.config.ts`, `openspec/changes/super-admin-company-provisioning-ui/**` | Direct implementation, tests, proxy support, and SDD artifacts for the provisioning landing. |
| A: Required with baseline dependency | `apps/web/src/app/auth/auth.store.ts`, `packages/contracts/src/index.ts` | The provisioning guard/tests consume login authority and typed non-secret contract data; these files also contain prerequisite login contract work. |
| B: Prerequisite baseline from prior login/RLS work | `apps/api/src/auth/auth.module.ts`, `apps/api/src/auth/auth.controller.ts`, `apps/api/src/auth/auth-credential.service.ts`, `apps/api/src/auth/session-token-issuer.service.ts`, `apps/api/test/auth-login.http.spec.ts`, `apps/api/package.json`, `apps/api/.env.example`, `apps/web/src/app/auth/login.component.ts`, `apps/web/test/login.component.spec.ts`, `apps/web/test/auth.store.spec.ts`, `apps/web/package.json`, `pnpm-lock.yaml`, `apps/api/README.md`, `apps/web/README.md`, `design/super-user-login.md` | Prior super-user credential login/session baseline needed to reach the protected provisioning shell and runtime API path. Not part of this UI slice's review diff. |
| B: Prerequisite baseline from prior RLS/archive work | `db/sqlserver/schema/002_rls.sql`, `apps/api/test/sql-rls-contract.spec.ts`, `openspec/changes/archive/2026-07-08-add-super-user-login/**`, promoted baseline specs under `openspec/specs/frontend-tenant-shell/spec.md` and `openspec/specs/identity-provisioning/spec.md` | Existing global-principal/RLS and archived login spec baseline; needed for end-to-end runtime correctness but not newly introduced by this UI slice. |
| C: Unrelated/nonessential contamination | None confidently identified as safe to delete or revert. | Every out-of-slice path inspected maps either to the prior approved login/RLS baseline or to SDD archive/spec promotion. |

`sdd-verify` can proceed only if it accepts the Class B files as the prerequisite baseline for this verification run. If verify requires a clean single-change worktree diff, the change remains blocked until the prior login/RLS/archive work is committed, stashed, or otherwise isolated by the maintainer.

## Runtime Limitation

No browser automation tool is available in this executor environment, so runtime UI confirmation remains based on the prior Vite `/api` proxy HTTP checks against running services plus Angular/Vitest component and route tests for pending, success, invalid-input, API-failure, unauthenticated, and non-super-admin UI/guard behavior.

## Notes

- No backend contract changes were needed; `CreateCompanyResponse` already contains non-secret metadata for the success panel.
- `/api/admin/companies` remains a relative URL so browser calls continue through the Vite proxy.
- The RLS test failure was related to the pre-existing global-principal RLS change: `dbo.users` and `dbo.user_roles` need a filter that admits global principals while tenant-scoped isolation and write block predicates remain covered by `dbo.fn_tenant_predicate`.
