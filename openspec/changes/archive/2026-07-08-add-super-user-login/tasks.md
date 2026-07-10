# Tasks: Add Super User Login

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 350-520 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 API login contracts/session -> PR 2 web login form/OpenPencil -> PR 3 integration docs/tests |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | API credential login and session issuance | PR 1 | Base = feature/tracker branch; includes API tests. |
| 2 | Angular login form and OpenPencil UI | PR 2 | Base = PR 1 branch; includes web tests/design. |
| 3 | Runtime validation and docs | PR 3 | Base = PR 2 branch; updates docs and final evidence. |

## Phase 1: API Foundation

- [x] 1.1 Add `LoginRequest` and `LoginResponse` to `packages/contracts/src/index.ts`.
- [x] 1.2 Create `apps/api/src/auth/auth-credential.service.ts` to verify active global users and roles.
- [x] 1.3 Create `apps/api/src/auth/session-token-issuer.service.ts` to sign the accepted session claims.
- [x] 1.4 Create `apps/api/src/auth/auth.controller.ts` with `POST /api/auth/login` and hardened cookie issuance.
- [x] 1.5 Register the controller/providers in `apps/api/src/auth/auth.module.ts`.

## Phase 2: Web Login Experience

- [x] 2.1 Replace `apps/web/src/app/auth/login.component.ts` placeholder with username/password form, loading state, and generic error state.
- [x] 2.2 Update `apps/web/src/app/auth/auth.store.ts` to apply login authority and expose authenticated state after API success.
- [x] 2.3 Keep `apps/web/src/app/auth/tenant-admin.guard.ts` routing unauthenticated users to `/login`.
- [x] 2.4 Create/update the OpenPencil login design reference with dark glassmorphism visuals.

## Phase 3: Testing

- [x] 3.1 Add API tests for valid super-user login, invalid login rejection, generic errors, and cookie attributes.
- [x] 3.2 Add web tests for form submission, disabled/loading behavior, error announcement, and successful navigation.
- [x] 3.3 Extend guard/store tests to prove successful login admits the protected shell.

## Phase 4: Verification and Docs

- [x] 4.1 Document local super-user login setup without storing plaintext passwords.
- [x] 4.2 Run `npx pnpm@9.15.4 test`, `typecheck`, and app health/login smoke where credentials are available.
- [x] 4.3 Update SDD verification evidence before archive.
