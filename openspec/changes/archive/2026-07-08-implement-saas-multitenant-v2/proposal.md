# Proposal: Implement SaaS Multitenant V2

## Intent

Define a SaaS multitenant baseline for oc01: SQL Server 2025 tenancy with defense-in-depth isolation, super-admin provisioning, tenant RBAC, auditability, and Angular UX.

## Scope

### In Scope
- SQL Server tenancy model using `UNIQUEIDENTIFIER`, `SESSION_CONTEXT`, `fn_tenant_predicate`, and `TenantSecurityPolicy`.
- NestJS auth/provisioning/RBAC contract for `super_admin`, tenant admin, editor, and reader.
- Cross-tenant denial, audit logging, and IP throttling/blocking for enumeration behavior.
- Angular standalone shell for auth, tenant-aware routing, interceptors/guards, and accessibility hooks.

### Out of Scope
- Billing, subscriptions, and tenant self-service onboarding.
- Physical database-per-tenant, multi-region hosting, or infra automation.
- Final stack bootstrapping details beyond what apply/verify must choose.

## Capabilities

### New Capabilities
- `tenant-isolation`: SQL + backend enforcement of tenant boundaries.
- `identity-provisioning`: `super_admin` auth and `POST /companies` provisioning flow.
- `authorization-rbac`: tenant roles and company-scoped permissions.
- `audit-monitoring`: unauthorized-access auditing and IP response.
- `frontend-tenant-shell`: Angular auth shell, guards, interceptors, and a11y feedback.

### Modified Capabilities
- None.

## Approach

Specify phased delivery: DB foundation, NestJS tenant-context infrastructure, JWT/cookie hardening, audit controls, Angular tenant shell, then integration once a runtime stack exists.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `openspec/changes/implement-saas-multitenant-v2/` | New | Change artifact set |
| `openspec/specs/tenant-isolation/` | New | Isolation rules |
| `openspec/specs/identity-provisioning/` | New | Provisioning/auth rules |
| `openspec/specs/authorization-rbac/` | New | RBAC rules |
| `openspec/specs/audit-monitoring/` | New | Audit/abuse rules |
| `openspec/specs/frontend-tenant-shell/` | New | Tenant UX rules |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| No runtime stack exists yet | High | Treat this as contract-first; apply/verify must first create or choose executable NestJS/Angular/SQL tooling |
| Tenant leakage via incomplete enforcement | High | Require DB RLS and backend context checks together |
| Security controls over-block valid users | Med | Define thresholds, audit trail, and rollback switches in design/specs |

## Rollback Plan

Revert unreleased bootstrap changes, disable new security policies and blocking rules behind flags, and preserve migration notes before tenant-bound writes.

## Dependencies

- Selection/bootstrap of NestJS, Angular 20/21, SQL Server migration/runtime tooling, and test/quality commands.

## Success Criteria

- [ ] Specs clearly define isolation, provisioning, RBAC, audit, and frontend shell behavior.
- [ ] Apply/verify can bootstrap an executable stack without contradicting this proposal.
- [ ] Cross-tenant denial, audit, and abuse-response requirements are unambiguous.

## Proposal question round

- Should temporary credentials be password-only, invite link, or forced-reset token on first login?
- What threshold/window should trigger ID-enumeration IP blocking?
- Must `super_admin` bypass tenant RLS, or only use explicit admin endpoints?
- Are company-scoped resources limited to Users first, or should v2 already cover additional domain entities?
