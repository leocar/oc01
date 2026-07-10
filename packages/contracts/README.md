# Contracts Workspace

Shared DTOs and contract types for API/frontend boundaries.

Back to the [OC01 documentation hub](../../README.md). For ownership boundaries and contributor setup, start with [technical architecture](../../docs/technical/architecture.md) and [technical onboarding](../../docs/technical/onboarding.md).

## Current Contracts

- `TenantRole`, `GlobalRole`, and `RoleCode` role unions.
- `AuthContext` for verified request tenant context.
- `CreateCompanyRequest` and `CreateCompanyResponse` for super-admin tenant provisioning.
- `AuditEventInput` for audit persistence boundaries.

The test command explicitly disables focused tests with `--allowOnly=false` even though this package currently has no test files.
