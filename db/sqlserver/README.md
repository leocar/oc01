# SQL Server Workspace

SQL Server schema, migrations, and seed assets for SaaS multi-tenant v2.

Expected layout:

- `schema/` - base schema and RLS policy SQL.
- `migrations/` - versioned migration files or migration runner assets.
- `seeds/` - `super_admin` bootstrap and reference role seed data.

## Current Assets

- `schema/001_core.sql` - companies, users, roles, role assignments, audit events, IP protection events, and tenant-focused indexes.
- `schema/002_rls.sql` - `fn_tenant_predicate` and `TenantSecurityPolicy` using `SESSION_CONTEXT(N'company_id')`.
- `seeds/001_roles.sql` - reference roles for `super_admin`, `tenant_admin`, `editor`, and `reader`.
- `seeds/002_super_admin.template.sql` - SQLCMD template for bootstrapping the global `sa` identity with an injected password hash.
- `tests/rls-runtime-smoke.sql` - opt-in SQLCMD smoke test for live SQL Server RLS tenant reads and cross-tenant block behavior.
- `../../scripts/run-rls-smoke.mjs` - Docker-backed smoke wrapper with SQL Server wait/retry and container cleanup.

See `migrations/README.md` for execution order and runtime context requirements.

## Runtime Smoke

Run the live SQL Server RLS smoke from the workspace root when Docker is available:

```bash
npx pnpm@9.15.4 smoke:sqlserver
```
