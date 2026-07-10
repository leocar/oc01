SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

CREATE FUNCTION dbo.fn_tenant_predicate (@CompanyId UNIQUEIDENTIFIER)
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN
    SELECT 1 AS result
    WHERE @CompanyId = TRY_CAST(SESSION_CONTEXT(N'company_id') AS UNIQUEIDENTIFIER)
       OR CAST(SESSION_CONTEXT(N'user_role') AS NVARCHAR(64)) = N'super_admin';
GO

CREATE FUNCTION dbo.fn_tenant_or_global_principal_filter (@CompanyId UNIQUEIDENTIFIER)
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN
    SELECT 1 AS result
    WHERE (@CompanyId IS NULL AND TRY_CAST(SESSION_CONTEXT(N'global_principal_login') AS bit) = 1)
       OR @CompanyId = TRY_CAST(SESSION_CONTEXT(N'company_id') AS UNIQUEIDENTIFIER)
       OR CAST(SESSION_CONTEXT(N'user_role') AS NVARCHAR(64)) = N'super_admin';
GO

CREATE SECURITY POLICY dbo.TenantSecurityPolicy
ADD FILTER PREDICATE dbo.fn_tenant_predicate(id) ON dbo.companies,
ADD FILTER PREDICATE dbo.fn_tenant_or_global_principal_filter(company_id) ON dbo.users,
ADD FILTER PREDICATE dbo.fn_tenant_or_global_principal_filter(company_id) ON dbo.user_roles,
ADD FILTER PREDICATE dbo.fn_tenant_predicate(company_id) ON dbo.audit_events,
ADD BLOCK PREDICATE dbo.fn_tenant_predicate(id) ON dbo.companies AFTER INSERT,
ADD BLOCK PREDICATE dbo.fn_tenant_predicate(id) ON dbo.companies AFTER UPDATE,
ADD BLOCK PREDICATE dbo.fn_tenant_predicate(company_id) ON dbo.users AFTER INSERT,
ADD BLOCK PREDICATE dbo.fn_tenant_predicate(company_id) ON dbo.users AFTER UPDATE,
ADD BLOCK PREDICATE dbo.fn_tenant_predicate(company_id) ON dbo.user_roles AFTER INSERT,
ADD BLOCK PREDICATE dbo.fn_tenant_predicate(company_id) ON dbo.user_roles AFTER UPDATE,
ADD BLOCK PREDICATE dbo.fn_tenant_predicate(company_id) ON dbo.audit_events AFTER INSERT,
ADD BLOCK PREDICATE dbo.fn_tenant_predicate(company_id) ON dbo.audit_events AFTER UPDATE
WITH (STATE = ON);
GO

-- Runtime connections must set these values before tenant-scoped reads/writes:
-- EXEC sys.sp_set_session_context @key = N'company_id', @value = @CompanyId;
-- EXEC sys.sp_set_session_context @key = N'user_role', @value = @RoleCode;
-- Login credential lookup is the only unauthenticated path allowed to read global principals:
-- EXEC sys.sp_set_session_context @key = N'global_principal_login', @value = 1;
-- EXEC sys.sp_set_session_context @key = N'global_principal_login', @value = NULL;
