# Proposal: Super Admin Company Provisioning UI

## Intent
Turn the existing super-admin shell into a first-slice provisioning experience so a signed-in `super_admin` can create a company end-to-end and trigger creation of that company's initial `tenant_admin`.

## Scope

### In Scope
- Productize the post-login super-admin landing screen at `/` around company creation.
- Add clear form validation, submit/pending/error states, and accessible success feedback for company creation.
- Confirm success without exposing secrets: company created, `tenant_admin` created, and bootstrap policy metadata shown.

### Out of Scope
- Dedicated multi-step wizard or separate super-admin console.
- Tenant-admin credential delivery, password reveal, invite email, or first-login reset UX.
- Broader home/routing redesign for non-super-admin personas.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `frontend-tenant-shell`: login landing, protected shell behavior, and accessible provisioning feedback must support the super-admin provisioning first slice.
- `identity-provisioning`: provisioning confirmation behavior must reflect that only `super_admin` can create companies and that the action creates the initial company-scoped `tenant_admin` without returning secrets.

## Approach
Adopt the exploration recommendation: keep the existing root shell and replace placeholder/demo framing with a focused provisioning screen. Reuse `POST /api/admin/companies`; limit contract changes to additional response fields only if the success state cannot be rendered from current metadata.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/web/src/app/shell/admin-shell.component.ts` | Modified | Super-admin landing/provisioning UI |
| `apps/web/src/app/auth/login.component.ts` | Modified | Post-login landing behavior |
| `apps/web/src/app/auth/auth.store.ts` | Modified | Document first-slice session continuity assumptions |
| `apps/web/src/app/app.routes.ts` | Modified | Keep `/` as protected super-admin landing |
| `packages/contracts/src/index.ts` | Modified | Only if success payload needs more non-secret fields |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Refresh loses UI auth state while cookie remains valid | Med | First slice assumes continuity only within the active login session; follow-up can add session rehydration |
| Success UX implies credentials are revealed | Med | Explicitly show bootstrap policy/status only; never render secrets |

## Rollback Plan
Revert the landing-shell and contract changes, restoring the prior shell/form behavior while keeping backend authorization and provisioning transaction logic unchanged.

## Dependencies

- Existing `POST /api/admin/companies` contract and current session-cookie auth flow.

## Success Criteria

- [ ] A signed-in `super_admin` can reach the landing screen, submit company data, and receive a clear success/error outcome.
- [ ] Successful creation confirms company + initial `tenant_admin` creation without exposing bootstrap secrets.
- [ ] Non-`super_admin` users cannot use this flow.

## Assumptions
- Session persistence for this slice is in-session only; page refresh may require re-login.
- After success, the super-admin stays on the landing screen and sees a confirmation summary suitable for creating another company.
- Bootstrap credentials are not shown in UI; only non-secret bootstrap limitations/policy metadata are surfaced.
