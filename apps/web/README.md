# Web Workspace

Angular standalone frontend workspace for SaaS multi-tenant v2.

## Current Scope

- Zoneless Angular application shell.
- Signal-backed auth state that defaults to unauthenticated.
- Tenant admin route guard that redirects unauthorized users to `/login`.
- Tenant HTTP interceptor that adds `X-Company-ID` only when a company context exists.
- Admin shell for tenant provisioning, audit signals, accessible announcements, and security dialog focus handling.

## Verification

Run web tests and production build through the workspace root:

```bash
npx pnpm@9.15.4 test
npx pnpm@9.15.4 --filter @oc01/web build
```
