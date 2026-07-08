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
- `../../scripts/run-local-rls-smoke.mjs` - local smoke wrapper for an already-running SQL Server instance.

See `migrations/README.md` for execution order and runtime context requirements.

## Runtime Smoke

Run the live SQL Server RLS smoke from the workspace root when Docker is available:

```bash
npx pnpm@9.15.4 smoke:sqlserver
```

Run the same smoke against an already-running local SQL Server instance with SQLCMD credentials from environment variables. The local wrapper creates an isolated disposable smoke database by default and drops it after the run.

```powershell
$env:SQLSERVER_HOST = "localhost"
$env:SQLSERVER_PORT = "1433"
$credential = Get-Credential -UserName "sa"
$env:SQLSERVER_USER = $credential.UserName
$env:SQLSERVER_PASSWORD = $credential.GetNetworkCredential().Password
$env:SQLSERVER_DATABASE = "master"
npx pnpm@9.15.4 smoke:sqlserver:local
Remove-Item Env:\SQLSERVER_PASSWORD
```

`SQLSERVER_DATABASE` is only used for admin create/drop commands. Set `SQL_SMOKE_DATABASE` to override the generated disposable database name, or `SQL_SMOKE_KEEP_DATABASE=true` to keep it for debugging. When a database is kept, the script prints its name.

Manual cleanup for a kept smoke database:

```powershell
$cleanupCredential = Get-Credential -UserName "sa"
$env:SQLCMDPASSWORD = $cleanupCredential.GetNetworkCredential().Password
sqlcmd -C -S localhost -U $cleanupCredential.UserName -d master -Q "ALTER DATABASE [oc01_rls_smoke_<timestamp>] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [oc01_rls_smoke_<timestamp>];"
Remove-Item Env:\SQLCMDPASSWORD
```

System database names (`master`, `model`, `msdb`, `tempdb`) are rejected for `SQL_SMOKE_DATABASE`. `SQLCMD_PATH` can be set when `sqlcmd` is not on `PATH`. Do not store SQL Server passwords in source control or shell history.
