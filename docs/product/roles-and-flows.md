# Roles and Flows

OC01 currently supports a narrow product path: a seeded global super-admin signs in and provisions a company with an initial tenant administrator. Other tenant journeys are intentionally documented as absent or planned until implementation catches up.

## Audience

Product reviewers, QA reviewers, and maintainers validating role behavior, login scope, and provisioning claims.

## Purpose

Make the implemented and absent flows explicit so documentation does not overpromise available user journeys.

## Implemented Now

| Flow | Entry point | Current result |
|---|---|---|
| Super-admin login | `/login` | User submits username and password credentials through the web login form. |
| Credential authentication | `POST /api/auth/login` | Valid seeded global administrator credentials return `super_admin` authority and establish the session cookie. |
| Protected provisioning shell | Protected root route after login | Authenticated `super_admin` users can reach the provisioning experience. |
| Company provisioning | `POST /api/admin/companies` | Authenticated `super_admin` creates a company and an initial company-scoped `tenant_admin`; confirmation omits secrets. |

## Role Boundaries

| Role | Implemented claim this doc can make | Claims this doc must not make yet |
|---|---|---|
| `super_admin` | Can authenticate through the current login path and call company provisioning. | Complete cross-tenant management, billing, audit review, or tenant lifecycle journeys. |
| `tenant_admin` | Can be created as the first administrator for a newly provisioned company. | Tenant-admin login, tenant settings, user management, or invitation acceptance flows. |
| `editor` | Exists as a tenant role in RBAC contracts/specs. | Any implemented editor product journey. |
| `reader` | Exists as a tenant role in RBAC contracts/specs. | Any implemented reader product journey. |

## Flow Details

### Super-admin login

1. The unauthenticated user opens `/login`.
2. The form submits credentials to `POST /api/auth/login`.
3. The API validates a seeded global administrator credential record.
4. On success, the response returns authority containing `super_admin` and sets the session cookie.
5. The frontend stores the authority and routes the user into the protected shell.

### Company provisioning

1. An authenticated `super_admin` submits company name and initial administrator email.
2. The frontend sends the request to `POST /api/admin/companies`.
3. The API rejects callers without `super_admin` authority.
4. On success, the API creates the company, creates the company-scoped initial `tenant_admin`, records the provisioning audit event, and returns non-secret metadata.

## Explicitly Absent or Planned

These items are not documented as available behavior in this slice:

- Tenant-admin credential login or first-use bootstrap completion.
- Invite-link or temporary-password acceptance UX.
- Tenant settings, member management, editor workflows, or reader workflows.
- Billing, subscription, or plan-management journeys.
- Full audit dashboard behavior beyond the provisioning audit event produced by the API.
- General cross-tenant administration screens outside the current provisioning shell.

## Canonical Sources

| Topic | Source |
|---|---|
| Super-admin authentication and provisioning acceptance criteria | [Identity provisioning spec](../../openspec/specs/identity-provisioning/spec.md) |
| Frontend login and provisioning shell acceptance criteria | [Frontend tenant shell spec](../../openspec/specs/frontend-tenant-shell/spec.md) |
| Tenant role definitions | [Authorization RBAC spec](../../openspec/specs/authorization-rbac/spec.md) |
| Shared role and response contracts | [Contracts README](../../packages/contracts/README.md) and `packages/contracts/src/index.ts` |
| UI intent for login and shell | [Super-user login design](../../design/super-user-login.md) and [SaaS admin shell design](../../design/saas-admin-shell.md) |

## Related Docs

- [Product overview](overview.md)
- [Root documentation hub](../../README.md)
- [API README](../../apps/api/README.md)
- [Web README](../../apps/web/README.md)
