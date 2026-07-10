# SQL Server Migration Order

Back to the [OC01 documentation hub](../../../README.md). For SQL ownership and runtime caveats, see [technical architecture](../../../docs/technical/architecture.md) and [runtime and operations](../../../docs/technical/runtime-and-operations.md).

Run the SQL Server assets in this order for a clean environment:

1. `schema/001_core.sql`
2. `seeds/001_roles.sql`
3. `seeds/002_super_admin.template.sql` with SQLCMD variables
4. `schema/002_rls.sql`

RLS is applied last so bootstrap seed operations can create the global `super_admin` identity before tenant policies are enabled.

## Super Admin Seed

Do not store the clear-text `sa` password in source control. Generate a backend-compatible password hash and pass it through SQLCMD variables:

```powershell
sqlcmd -S localhost -d oc01 -i db/sqlserver/seeds/002_super_admin.template.sql `
  -v SuperAdminEmail="sa" SuperAdminPasswordHash="<hash>"
```

## Tenant Session Context

Runtime database connections must set tenant context before tenant-scoped reads or writes:

```sql
EXEC sys.sp_set_session_context @key = N'company_id', @value = @CompanyId;
EXEC sys.sp_set_session_context @key = N'user_role', @value = @RoleCode;
```

The backend work unit is responsible for setting this context per request or transaction from the AsyncLocalStorage tenant context.
