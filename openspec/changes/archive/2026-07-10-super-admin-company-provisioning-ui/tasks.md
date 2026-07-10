# Tasks: Super Admin Company Provisioning UI

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 350-550 |
| 400-line budget risk | Medium |
| 1000-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR; keep tests with UI/guard changes |
| Delivery strategy | auto-forecast |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium
1000-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Super-admin provisioning UI with unit tests | PR 1 | Base main; includes form states and success/error UX |
| 2 | Guard/runtime verification hardening | PR 1 | Same PR unless diff exceeds forecast |

## Phase 1: Test-First Guardrails

- [x] 1.1 Extend `apps/web/test/admin-shell.component.spec.ts` with failing tests for local validation, pending submit, non-secret success, and accessible failure feedback.
- [x] 1.2 Extend `apps/web/test/tenant-admin.guard.spec.ts` to prove authenticated non-`super_admin` users at `/` are denied through the existing `/login` redirect behavior.
- [x] 1.3 Extend `apps/web/test/app.routes.spec.ts` to verify unauthenticated protected-root navigation still resolves to login.

## Phase 2: Provisioning UI Implementation

- [x] 2.1 Refactor `apps/web/src/app/shell/admin-shell.component.ts` to use explicit provisioning view state, validated company/admin inputs, disabled pending submit, and `/api/admin/companies` POST.
- [x] 2.2 Render non-secret success metadata from `CreateCompanyResponse` in `apps/web/src/app/shell/admin-shell.component.ts`; do not display or invent credentials.
- [x] 2.3 Update `apps/web/src/app/shell/admin-shell.component.css` for field errors, loading state, responsive form layout, and success/error panels.

## Phase 3: Access and Session Boundaries

- [x] 3.1 Keep `apps/web/src/app/auth/tenant-admin.guard.ts` super-admin-only via `AuthStore.canProvisionTenants()` and preserve redirect-to-login for unauthenticated and non-super-admin users.
- [x] 3.2 Add minimal comments/helpers in `apps/web/src/app/auth/auth.store.ts` only if needed to clarify in-session-only auth continuity; do not add persistence or rehydration.

## Phase 4: Verification

- [x] 4.1 Run `npx pnpm@9.15.4 --filter @oc01/web test` and ensure the new RED tests pass after implementation.
- [x] 4.2 Runtime-check browser-facing `POST /api/admin/companies` through the Vite `/api` proxy with a signed-in `super_admin`; confirm pending and success UI.
- [x] 4.3 Runtime-check invalid input, API failure, unauthenticated `/`, and authenticated non-super-admin `/` denial without exposing secrets.
- [x] 4.4 Run `npx pnpm@9.15.4 typecheck` and `npx pnpm@9.15.4 --filter @oc01/web build`.
