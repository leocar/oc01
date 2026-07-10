# Web Workspace

Angular standalone frontend workspace for SaaS multi-tenant v2.

## Current Scope

- Zoneless Angular application shell.
- Signal-backed auth state that defaults to unauthenticated.
- Complete `/login` form for the global super-user sign-in flow.
- Tenant admin route guard that redirects unauthorized users to `/login`.
- Tenant HTTP interceptor that adds `X-Company-ID` only when a company context exists.
- Admin shell for tenant provisioning, audit signals, accessible announcements, and security dialog focus handling.

## Login Experience

The login screen lives at `/login` and follows the OpenPencil reference in
`../../design/super-user-login.md`. It submits username/password credentials to
`POST /api/auth/login`, stores the returned authority in `AuthStore`, and routes
successful `super_admin` sessions into the protected command shell.

The UI must not display, snapshot, or hardcode the real super-user password.

## Verification

Run web tests and production build through the workspace root:

```bash
npx pnpm@9.15.4 test
npx pnpm@9.15.4 --filter @oc01/web build
```
