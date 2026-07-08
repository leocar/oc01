# Design: Implement SaaS Multitenant V2

## Technical Approach

Bootstrap a new runtime because `oc01` currently has only OpenSpec artifacts, OpenCode config, and an empty `design/login.op` asset. Deliver `apps/api` (NestJS), `apps/web` (Angular 20/21 standalone), and `db/sqlserver` (SQL Server schema, RLS, seed, migrations). Tenant isolation is enforced at two boundaries: SQL Server RLS with `SESSION_CONTEXT` and NestJS tenant context. Specs drive provisioning, RBAC, audit/abuse handling, and an OpenPencil-owned Angular tenant shell.

## Architecture Decisions

### Decision: Bootstrap as pnpm workspaces with explicit app/db directories
**Choice**: Root `package.json` + `pnpm-workspace.yaml`, with `apps/api`, `apps/web`, `db/sqlserver`, `packages/contracts`.
**Alternatives considered**: Single mixed app, Nx-first setup.
**Rationale**: Clear boundaries matter more than orchestration features; separate workspaces keep bootstrap reviewable.

### Decision: SQL Server RLS is the persistence boundary
**Choice**: Every company-scoped table carries `company_id UNIQUEIDENTIFIER`; SQL policies use `SESSION_CONTEXT(N'company_id')` via `fn_tenant_predicate` and `TenantSecurityPolicy`.
**Alternatives considered**: App-only filtering, schema-per-tenant.
**Rationale**: RLS gives defense in depth. `super_admin` cross-tenant work stays on explicit admin/provisioning endpoints and auditable DB paths.

### Decision: Use AsyncLocalStorage for request tenant context
**Choice**: Nest middleware/guard resolves actor + tenant, stores them in `AsyncLocalStorage`, and DB access sets `SESSION_CONTEXT` from that store per request/transaction.
**Alternatives considered**: Request-scoped providers.
**Rationale**: ALS avoids request-scoped DI churn and centralizes tenant/app boundary checks.

### Decision: Harden tokens and cookies conservatively
**Choice**: Signed compact JWS only, allowlist `RS256`, reject `alg=none`, reject any `zip`, reject tokens with `p2c >= 1000` when present, and issue cookies as `HttpOnly; Secure; SameSite=Strict`.
**Alternatives considered**: HS256, localStorage bearer tokens, permissive JOSE parsing.
**Rationale**: This matches the spec and reduces algorithm confusion and client-side token theft.

### Decision: Provision company + tenant admin atomically with one-time token bootstrap
**Choice**: `POST /api/admin/companies` creates company, tenant admin, role bindings, one-time-token bootstrap state, and forced first-use rotation metadata in one transaction.
**Alternatives considered**: Multi-step provisioning.
**Rationale**: Atomic provisioning prevents half-created tenants. One-time tokens avoid storing or returning reusable temporary passwords.

### Decision: RBAC baseline is fixed to tenant_admin/editor/reader
**Choice**: Persist role membership per tenant and enforce policy in Nest guards plus tenant-aware service checks.
**Alternatives considered**: Free-form permissions first.
**Rationale**: The spec demands a minimal policy surface before finer permissions exist.

### Decision: Angular shell + OpenPencil glassmorphism are first-class deliverables
**Choice**: Angular standalone + zoneless + signals frontend with guards/interceptors, accessible toast/dialog patterns, and a new `design/saas-admin-shell.op` dark glass morphism asset; `design/login.op` is not reused because it is currently empty.
**Alternatives considered**: NgModule-first app, code-first UI without design asset.
**Rationale**: The user explicitly required OpenPencil-owned interface design and dark glass morphism.

## Data Flow

`Web login/provisioning UI` → `Angular interceptor` → `Nest auth/tenant guard` → `ALS tenant context` → `SQL connection sets SESSION_CONTEXT` → `RLS-protected tables` → `audit log`

Provisioning: `super_admin login` → `POST /api/admin/companies` → transaction creates `companies`, `users`, `user_roles` → returns bootstrap access metadata → first tenant-admin sign-in forces credential rotation.

Enumeration protection: denied lookups aggregate by source fingerprint (default 5 attempts / 10 minutes) → temporary protective response for 15 minutes + audit event.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Create | Root workspace scripts |
| `pnpm-workspace.yaml` | Create | Workspace registration |
| `apps/api/` | Create | NestJS API for auth, provisioning, tenant context, audit |
| `apps/web/` | Create | Angular shell with guards/interceptors/signals |
| `packages/contracts/` | Create | Shared DTOs/types for auth, provisioning, RBAC |
| `db/sqlserver/schema/` | Create | Base tables, RLS predicate, security policy |
| `db/sqlserver/migrations/` | Create | Versioned SQL Server migrations |
| `db/sqlserver/seeds/` | Create | Super-admin bootstrap and reference roles |
| `design/saas-admin-shell.op` | Create | Dark glass morphism UI source in OpenPencil |
| `design/saas-admin-shell.md` | Create | Reviewable UI contract while the OpenPencil file is materialized |
| `design/login.op` | Retain | Existing empty asset kept unless later repurposed |

## Interfaces / Contracts

```ts
type TenantRole = 'tenant_admin' | 'editor' | 'reader';
interface AuthContext { userId: string; tenantId?: string; roles: TenantRole[]; isSuperAdmin: boolean; }
interface CreateCompanyRequest { companyName: string; adminEmail: string; }
type BootstrapAccessMode = 'temporary_password' | 'invite_link' | 'one_time_token'; // final choice remains open
interface CreateCompanyResponse { companyId: string; adminUserId: string; bootstrapAccessMode: BootstrapAccessMode; forceRotateOnFirstUse: true; }
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Guards, token validator, role policy, Angular guards/signals | Planned commands: `pnpm --filter api test`, `pnpm --filter web test` |
| Integration | Provisioning transaction, `SESSION_CONTEXT` + RLS, audit thresholds | `pnpm --filter api test:integration` against SQL Server test DB/container |
| E2E | Login, company provisioning, tenant denial, focus containment | `pnpm --filter web e2e` + API-backed flows |

## Migration / Rollout

No runtime migration exists yet. Apply should bootstrap tooling first, then create SQL schema/RLS migrations before enabling tenant writes. Initial rollout should gate protective-response thresholds and super-admin provisioning behind environment configuration.

## Open Questions

- [x] Exact bootstrap credential format resolved as `one_time_token` for initial tenant-admin bootstrap.
