# Proposal: Add Super User Login

## Intent

Replace the placeholder login page with a complete super-user sign-in flow so the seeded global administrator can enter the tenant command workspace through the application UI.

## Scope

### In Scope
- Add credential-based login for the global `super_admin` user.
- Issue the existing hardened session cookie after successful authentication.
- Build an accessible OpenPencil-informed login form for username and password.
- Persist frontend auth state enough for guarded navigation after login.

### Out of Scope
- Password reset, MFA, invitation flows, or tenant-admin bootstrap replacement.
- User management screens beyond the existing tenant provisioning shell.
- Storing plaintext passwords in source, specs, docs, or tests.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `identity-provisioning`: add credential login behavior for the seeded global administrator.
- `frontend-tenant-shell`: replace placeholder login guidance with a complete accessible login form.

## Approach

Add a focused auth controller/service endpoint for `POST /api/auth/login`, validate credentials against `dbo.users.password_hash`, issue a signed `RS256` session cookie using the existing token validation contract, and update the Angular login component/store to submit credentials, show validation states, and route authorized users into the protected shell.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/api/src/auth` | Modified | Login endpoint, credential verification, session issuance. |
| `packages/contracts/src/index.ts` | Modified | Login request/response contracts. |
| `apps/web/src/app/auth` | Modified | Login form, auth store, route guard state. |
| `design/` or OpenPencil canvas | New | Login form design reference. |
| `apps/*/test` | Modified | API and web coverage for success, failure, and guard behavior. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Leaking password handling details | Medium | Never commit plaintext password; use env-driven local setup and hashed database value. |
| Weak session issuance | Medium | Reuse signed `RS256` session contract and hardened cookie settings. |
| Login UI claims behavior API lacks | Low | Specs and tests must cover full API + UI path before archive. |

## Rollback Plan

Revert the change commit(s), restore the placeholder login component, and remove the login endpoint while keeping existing token validation and route guards intact.

## Dependencies

- Seeded `super_admin` user with a valid password hash in SQL Server.
- Runtime signing key configuration for issuing the same session shape the API already accepts.

## Success Criteria

- [ ] Super-user credentials authenticate and route to the command shell.
- [ ] Invalid credentials fail without authenticating or exposing account details.
- [ ] Session cookie uses `HttpOnly`, `Secure`, and `SameSite=Strict`.
- [ ] Login form is accessible, responsive, and represented in OpenPencil.
