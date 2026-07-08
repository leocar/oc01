SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

:SETVAR SuperAdminEmail "sa"
:SETVAR SuperAdminPasswordHash "REPLACE_WITH_HASH"

DECLARE @SuperAdminId UNIQUEIDENTIFIER;
DECLARE @SuperAdminRoleId INT;

SELECT @SuperAdminRoleId = id
FROM dbo.roles
WHERE code = N'super_admin';

IF @SuperAdminRoleId IS NULL
BEGIN
    THROW 50001, 'Missing super_admin role seed.', 1;
END;

SELECT @SuperAdminId = id
FROM dbo.users
WHERE email = N'$(SuperAdminEmail)';

IF @SuperAdminId IS NULL
BEGIN
    SET @SuperAdminId = NEWID();

    INSERT INTO dbo.users (id, company_id, email, password_hash, is_global_admin, force_credential_rotation)
    VALUES (@SuperAdminId, NULL, N'$(SuperAdminEmail)', N'$(SuperAdminPasswordHash)', 1, 0);
END
ELSE
BEGIN
    UPDATE dbo.users
    SET password_hash = N'$(SuperAdminPasswordHash)',
        is_global_admin = 1,
        force_credential_rotation = 0
    WHERE id = @SuperAdminId;
END;

IF NOT EXISTS (
    SELECT 1
    FROM dbo.user_roles
    WHERE user_id = @SuperAdminId
      AND role_id = @SuperAdminRoleId
      AND company_id IS NULL
)
BEGIN
    INSERT INTO dbo.user_roles (user_id, role_id, company_id)
    VALUES (@SuperAdminId, @SuperAdminRoleId, NULL);
END;
GO
