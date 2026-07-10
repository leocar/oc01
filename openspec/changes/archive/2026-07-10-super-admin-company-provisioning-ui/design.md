# Design: Super Admin Company Provisioning UI

## Technical Approach

Productize the existing protected root shell instead of adding a new route. The Angular web app will keep `/` guarded, refactor `AdminShellComponent` into a real provisioning screen, and reuse `POST /api/admin/companies` as-is unless implementation proves the current non-secret metadata is insufficient. This follows the proposal and both delta specs while preserving the existing backend authorization, transaction, audit, and RLS boundaries.

## Architecture Decisions

### Decision: Keep the existing root-shell flow

| Option | Tradeoff | Decision |
|---|---|---|
| New super-admin route/wizard | Cleaner separation, more churn | No |
| Productize current `/` shell | Lowest risk, matches current guard/routing | Yes |

Rationale: `app.routes.ts`, `tenantAdminGuard`, and `login.component.ts` already route authenticated `super_admin` users to `/`.

### Decision: No secret-returning contract change

| Option | Tradeoff | Decision |
|---|---|---|
| Extend response with secrets/bootstrap credential | Better operator convenience, violates spec/security | No |
| Reuse current response and form input for confirmation | Less backend churn, non-secret only | Yes |

Rationale: `CreateCompanyResponse` already returns `companyId`, `adminUserId`, `bootstrapAccessMode`, and `forceRotateOnFirstUse`, which is enough for accessible success copy.

### Decision: Keep session continuity in-session only for this slice

| Option | Tradeoff | Decision |
|---|---|---|
| Add session-bootstrap/rehydration endpoint now | Better refresh UX, wider contract/backend scope | No |
| Keep memory-only `AuthStore` and document refresh behavior | Known limitation, smallest safe slice | Yes |

Rationale: current guard depends on in-memory `AuthStore`; adding rehydration would expand scope beyond the proposal.

## Data Flow

`LoginComponent` → `AuthStore.applyLoginAuthority()` → route `/` → `tenantAdminGuard` → `AdminShellComponent` form → `POST /api/admin/companies` → `TenantContextMiddleware` restores session → `CompaniesService.createCompany()` sets `SESSION_CONTEXT`, creates company + tenant admin + role + audit → response metadata → success/error announcement.

Pitfalls to preserve:
- Keep relative `/api/...` calls through `apps/web/vite.config.ts` proxy; do not switch to direct cross-origin API URLs.
- Do not weaken `Secure` / `SameSite=Strict` cookie settings for local dev.
- Do not rely on `AuthStore` after refresh; this slice still requires re-login.
- Do not send `X-Company-ID` for super-admin provisioning; backend authority comes from the verified session and server-side tenant context.

## File Changes

| File | Action | Description |
|---|---|---|
| `apps/web/src/app/shell/admin-shell.component.ts` | Modify | Replace demo-oriented copy/behavior with validated provisioning UI, pending state, structured success/error summary, and accessible announcements. |
| `apps/web/src/app/shell/admin-shell.component.css` | Modify | Support field errors, disabled/loading states, responsive form layout, and success/error panels. |
| `apps/web/src/app/auth/auth.store.ts` | Modify | Add explicit session-continuity comments/helpers only if needed; no persistence/rehydration in this slice. |
| `apps/web/src/app/auth/tenant-admin.guard.ts` | Modify | Keep super-admin-only access explicit; preserve redirect behavior for unauthenticated and non-super-admin users. |
| `apps/web/test/admin-shell.component.spec.ts` | Modify | Cover validation, pending state, non-secret success summary, and failure accessibility. |
| `apps/web/test/tenant-admin.guard.spec.ts` | Modify | Cover non-super-admin denial separately from unauthenticated redirect if flow diverges. |
| `apps/web/test/app.routes.spec.ts` | Modify | Verify protected root still resolves to login when no in-memory session exists. |

## Interfaces / Contracts

```ts
type ProvisioningViewState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; companyId: string; adminUserId: string; bootstrapAccessMode: string; forceRotateOnFirstUse: true }
  | { kind: "error"; message: string };
```

No backend API change is planned. If UI review later proves IDs alone are insufficient, only additive non-secret fields may be considered.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | Form validation, disabled submit, success/error state transitions | Extend `apps/web/test/admin-shell.component.spec.ts` with HttpClient stubs and announcement assertions. |
| Unit | Guard behavior | Extend `tenant-admin.guard.spec.ts` for unauthenticated vs authenticated non-super-admin outcomes. |
| Integration | Provisioning API authorization and non-secret response | Keep `apps/api/test/companies.service.spec.ts` and existing HTTP path coverage unchanged unless contract changes. |
| E2E | Not in current stack | Defer; no E2E harness exists in `openspec/config.yaml`. |

## Migration / Rollout

No migration required. Rollout is a frontend-first refinement over the existing provisioning endpoint.

## Open Questions

- [ ] Should non-super-admin users hitting `/` be redirected to `/login` or shown a distinct unauthorized state?
- [ ] Is local HTTPS dev already available, or must the team document that secure cookies may not persist in plain-HTTP browser sessions?
