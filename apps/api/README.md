# API Workspace

NestJS backend workspace for SaaS multi-tenant v2.

## Current Scope

- Signed RS256 session validation and hardened session cookie handling.
- AsyncLocalStorage tenant context populated from verified session claims.
- SQL Server access through `DatabaseService`, including transaction handling and session context setup/cleanup.
- Tenant-aware company provisioning with one-time-token bootstrap access.
- Fixed RBAC roles: `super_admin`, `tenant_admin`, `editor`, and `reader`.
- Cross-tenant denial auditing and source-IP enumeration protection.
- Health endpoints: `GET /health/live` and `GET /health/ready`.

## Verification

Run API tests through the workspace root:

```bash
npx pnpm@9.15.4 test
```
