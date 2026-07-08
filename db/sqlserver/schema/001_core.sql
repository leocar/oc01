SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

CREATE TABLE dbo.companies (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_companies_id DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    created_at DATETIME2(7) NOT NULL CONSTRAINT DF_companies_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_companies PRIMARY KEY CLUSTERED (id),
    CONSTRAINT UQ_companies_name UNIQUE (name)
);
GO

CREATE TABLE dbo.roles (
    id INT IDENTITY(1,1) NOT NULL,
    code NVARCHAR(64) NOT NULL,
    scope NVARCHAR(32) NOT NULL,
    description NVARCHAR(255) NOT NULL,
    created_at DATETIME2(7) NOT NULL CONSTRAINT DF_roles_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_roles PRIMARY KEY CLUSTERED (id),
    CONSTRAINT UQ_roles_code UNIQUE (code),
    CONSTRAINT CK_roles_scope CHECK (scope IN (N'global', N'tenant')),
    CONSTRAINT CK_roles_code CHECK (code IN (N'super_admin', N'tenant_admin', N'editor', N'reader'))
);
GO

CREATE TABLE dbo.users (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_users_id DEFAULT NEWID(),
    company_id UNIQUEIDENTIFIER NULL,
    email NVARCHAR(320) NOT NULL,
    password_hash NVARCHAR(512) NULL,
    bootstrap_access_token_hash NVARCHAR(512) NULL,
    bootstrap_access_used_at DATETIME2(7) NULL,
    is_global_admin BIT NOT NULL CONSTRAINT DF_users_is_global_admin DEFAULT 0,
    force_credential_rotation BIT NOT NULL CONSTRAINT DF_users_force_rotation DEFAULT 0,
    created_at DATETIME2(7) NOT NULL CONSTRAINT DF_users_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_users PRIMARY KEY CLUSTERED (id),
    CONSTRAINT UQ_users_email UNIQUE (email),
    CONSTRAINT FK_users_companies FOREIGN KEY (company_id) REFERENCES dbo.companies(id) ON DELETE CASCADE,
    CONSTRAINT CK_users_company_scope CHECK (company_id IS NOT NULL OR is_global_admin = 1)
);
GO

CREATE TABLE dbo.user_roles (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_user_roles_id DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL,
    role_id INT NOT NULL,
    company_id UNIQUEIDENTIFIER NULL,
    assigned_at DATETIME2(7) NOT NULL CONSTRAINT DF_user_roles_assigned_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_user_roles PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_user_roles_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
    CONSTRAINT FK_user_roles_roles FOREIGN KEY (role_id) REFERENCES dbo.roles(id),
    CONSTRAINT FK_user_roles_companies FOREIGN KEY (company_id) REFERENCES dbo.companies(id)
);
GO

CREATE TABLE dbo.audit_events (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_audit_events_id DEFAULT NEWID(),
    company_id UNIQUEIDENTIFIER NULL,
    actor_user_id UNIQUEIDENTIFIER NULL,
    source_ip NVARCHAR(45) NULL,
    event_type NVARCHAR(80) NOT NULL,
    target_type NVARCHAR(80) NULL,
    target_id UNIQUEIDENTIFIER NULL,
    reason NVARCHAR(255) NOT NULL,
    metadata_json NVARCHAR(MAX) NULL,
    created_at DATETIME2(7) NOT NULL CONSTRAINT DF_audit_events_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_audit_events PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_audit_events_companies FOREIGN KEY (company_id) REFERENCES dbo.companies(id),
    CONSTRAINT FK_audit_events_actor FOREIGN KEY (actor_user_id) REFERENCES dbo.users(id)
);
GO

CREATE TABLE dbo.ip_protection_events (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_ip_protection_events_id DEFAULT NEWID(),
    source_ip NVARCHAR(45) NOT NULL,
    reason NVARCHAR(255) NOT NULL,
    denied_attempt_count INT NOT NULL,
    window_seconds INT NOT NULL,
    blocked_until DATETIME2(7) NOT NULL,
    created_at DATETIME2(7) NOT NULL CONSTRAINT DF_ip_protection_events_created_at DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_ip_protection_events PRIMARY KEY CLUSTERED (id),
    CONSTRAINT CK_ip_protection_events_counts CHECK (denied_attempt_count > 0 AND window_seconds > 0)
);
GO

CREATE INDEX IX_users_company_id ON dbo.users(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IX_users_bootstrap_access_token_hash ON dbo.users(bootstrap_access_token_hash) WHERE bootstrap_access_token_hash IS NOT NULL;
CREATE INDEX IX_user_roles_company_id ON dbo.user_roles(company_id) WHERE company_id IS NOT NULL;
CREATE UNIQUE INDEX UX_user_roles_tenant_role ON dbo.user_roles(user_id, role_id, company_id) WHERE company_id IS NOT NULL;
CREATE UNIQUE INDEX UX_user_roles_global_role ON dbo.user_roles(user_id, role_id) WHERE company_id IS NULL;
CREATE INDEX IX_audit_events_company_id_created_at ON dbo.audit_events(company_id, created_at) WHERE company_id IS NOT NULL;
CREATE INDEX IX_audit_events_source_ip_created_at ON dbo.audit_events(source_ip, created_at) WHERE source_ip IS NOT NULL;
CREATE INDEX IX_ip_protection_events_source_ip_blocked_until ON dbo.ip_protection_events(source_ip, blocked_until);
GO
