SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

MERGE dbo.roles AS target
USING (VALUES
    (N'super_admin', N'global', N'Global provisioning authority'),
    (N'tenant_admin', N'tenant', N'Tenant administrator'),
    (N'editor', N'tenant', N'Tenant editor with write access'),
    (N'reader', N'tenant', N'Tenant reader with read-only access')
) AS source (code, scope, description)
ON target.code = source.code
WHEN MATCHED THEN
    UPDATE SET scope = source.scope, description = source.description
WHEN NOT MATCHED THEN
    INSERT (code, scope, description)
    VALUES (source.code, source.scope, source.description);
GO
