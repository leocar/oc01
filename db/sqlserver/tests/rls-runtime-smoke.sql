:ON ERROR EXIT
SET NOCOUNT ON;
GO

:r ../schema/001_core.sql
:r ../seeds/001_roles.sql
:r ../schema/002_rls.sql

DECLARE @TenantA UNIQUEIDENTIFIER = '11111111-1111-1111-1111-111111111111';
DECLARE @TenantB UNIQUEIDENTIFIER = '22222222-2222-2222-2222-222222222222';
DECLARE @TenantAUser UNIQUEIDENTIFIER = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
DECLARE @TenantBUser UNIQUEIDENTIFIER = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

EXEC sys.sp_set_session_context @key = N'user_role', @value = N'super_admin';
EXEC sys.sp_set_session_context @key = N'company_id', @value = NULL;

INSERT INTO dbo.companies (id, name)
VALUES (@TenantA, N'Tenant A'), (@TenantB, N'Tenant B');

INSERT INTO dbo.users (id, company_id, email, force_credential_rotation)
VALUES
  (@TenantAUser, @TenantA, N'admin-a@example.test', 0),
  (@TenantBUser, @TenantB, N'admin-b@example.test', 0);

EXEC sys.sp_set_session_context @key = N'user_role', @value = N'tenant_admin';
EXEC sys.sp_set_session_context @key = N'company_id', @value = @TenantA;

IF (SELECT COUNT(1) FROM dbo.companies WHERE id = @TenantA) <> 1
  THROW 51000, 'Tenant A session cannot read its own company.', 1;

IF (SELECT COUNT(1) FROM dbo.companies WHERE id = @TenantB) <> 0
  THROW 51001, 'Tenant A session can read Tenant B company metadata.', 1;

IF (SELECT COUNT(1) FROM dbo.users WHERE id = @TenantBUser) <> 0
  THROW 51002, 'Tenant A session can read Tenant B user metadata.', 1;

BEGIN TRY
  INSERT INTO dbo.users (company_id, email, force_credential_rotation)
  VALUES (@TenantB, N'illegal-cross-tenant@example.test', 0);
  THROW 51003, 'Tenant A session inserted a Tenant B user.', 1;
END TRY
BEGIN CATCH
  IF ERROR_NUMBER() = 51003
    THROW;
END CATCH;

PRINT 'SQL Server RLS runtime smoke passed.';
GO
