# Product Overview

OC01 currently documents and implements the first administration slice for a multi-tenant SaaS platform: a global super-admin signs in, reaches the protected provisioning shell, and creates a company with an initial tenant administrator.

## Audience

Product reviewers, QA reviewers, and maintainers who need to understand what the platform does today without reading backend, frontend, or SQL implementation files first.

## Purpose

Explain the current product scope, actors, tenant model, and boundaries in one product-facing document. This page summarizes behavior only; canonical acceptance criteria remain in OpenSpec and implementation details remain in the workspace sources.

## Implemented Now

| Area | Current behavior |
|---|---|
| Platform scope | Global administration entrypoint for company provisioning. |
| Login entry | The web app exposes `/login` for super-user credential submission. |
| Login API | The API exposes `POST /api/auth/login`, validates seeded global administrator credentials, and returns super-admin authority on success. |
| Session authority | Successful login establishes a hardened session cookie and returns authority containing `super_admin`. |
| Protected landing | Authenticated `super_admin` users can enter the protected shell that contains company provisioning. |
| Company provisioning API | The API exposes `POST /api/admin/companies` for authenticated `super_admin` callers. |
| Provisioning result | A successful request creates a company and initial company-scoped `tenant_admin`; the response returns non-secret confirmation metadata. |

## Actors

| Actor | Scope today | Notes |
|---|---|---|
| `super_admin` | Global | Can authenticate through the current login path and provision companies. Tenant-scoped roles alone must not grant global provisioning authority. |
| `tenant_admin` | Company-scoped | Created as the initial administrator during company provisioning. Normal tenant-admin sign-in and tenant administration journeys are not documented as implemented yet. |
| `editor` | Company-scoped | Defined by RBAC specs as a future tenant-scoped role boundary; no product journey is documented as available in this slice. |
| `reader` | Company-scoped | Defined by RBAC specs as a future tenant-scoped role boundary; no product journey is documented as available in this slice. |

## Tenant Model

OC01 separates global administration from company-scoped tenant activity. The current implemented product slice uses global `super_admin` authority to create a company and seed its first company-scoped administrator. Tenant isolation and tenant-scoped RBAC are canonical requirements, but product docs should not imply that complete tenant-user journeys are available until those flows exist in the application.

## Boundaries and Non-Goals

- Do not treat tenant-scoped roles as global provisioning authority.
- Do not expose bootstrap secrets in provisioning confirmation.
- Do not describe tenant-user login, invitation acceptance, billing, audit dashboards, or general tenant administration as implemented product journeys yet.
- Do not duplicate setup commands, environment variables, schema details, or RLS mechanics here; use the canonical technical sources instead.

## Canonical Sources

| Topic | Source |
|---|---|
| Global authentication and company provisioning requirements | [Identity provisioning spec](../../openspec/specs/identity-provisioning/spec.md) |
| Tenant isolation requirements | [Tenant isolation spec](../../openspec/specs/tenant-isolation/spec.md) |
| Tenant role requirements | [Authorization RBAC spec](../../openspec/specs/authorization-rbac/spec.md) |
| Frontend login and protected shell requirements | [Frontend tenant shell spec](../../openspec/specs/frontend-tenant-shell/spec.md) |
| UI intent | [SaaS admin shell design](../../design/saas-admin-shell.md) and [super-user login design](../../design/super-user-login.md) |

## Related Docs

- [Roles and flows](roles-and-flows.md)
- [Root documentation hub](../../README.md)
- [API README](../../apps/api/README.md)
- [Web README](../../apps/web/README.md)
- [Contracts README](../../packages/contracts/README.md)
- [SQL Server README](../../db/sqlserver/README.md)
