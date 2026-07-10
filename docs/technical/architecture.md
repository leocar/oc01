# Technical Architecture

OC01 is organized as a small pnpm workspace with separate API, web, contract, SQL, design, and OpenSpec ownership boundaries. This page gives contributors the map first, then links to canonical sources for the details that can drift.

## Audience

Technical reviewers, maintainers, and contributors who need to understand repository shape and ownership boundaries before changing implementation or docs.

## Purpose

Explain where each part of the system lives, which layer owns which decisions, and which canonical source to update when behavior changes.

## Implemented Now

| Area | Current boundary |
|---|---|
| API workspace | `apps/api/` contains the NestJS backend, auth/session handling, tenant context, company provisioning, database access, health endpoints, and backend tests. |
| Web workspace | `apps/web/` contains the Angular/Vite frontend, `/login`, auth state, tenant guard/interceptor, admin shell, and web tests/build. |
| Contracts workspace | `packages/contracts/` contains shared role unions and DTO boundaries used by API and web. |
| SQL Server assets | `db/sqlserver/` contains schema, RLS policy SQL, role/super-admin seeds, migration order guidance, and SQL smoke assets. |
| Product and technical docs | `docs/product/` and `docs/technical/` summarize behavior for readers and link back to canonical sources. |
| OpenSpec | `openspec/specs/` stores accepted product and technical requirements; `openspec/changes/` stores active change artifacts. |
| Design references | `design/` stores UI intent and OpenPencil-derived design references. |

## Repo Map

| Path | Owns | Does not own |
|---|---|---|
| `apps/api/` | Backend runtime behavior, API route implementation, auth/session validation, tenant context, SQL access orchestration. | Product scope narratives or SQL schema ownership. |
| `apps/web/` | Frontend runtime behavior, user-facing screens, local Vite development proxy, web tests/build. | API route contracts or database policy rules. |
| `packages/contracts/` | Shared TypeScript contract types crossing API/frontend boundaries. | Runtime validation, database schema, or UI copy. |
| `db/sqlserver/` | Database schema, RLS predicates/policies, seed scripts, SQL smoke-test behavior. | NestJS request handling or frontend flows. |
| `docs/product/` | Implemented product scope summaries and absent/planned flow boundaries. | Setup commands, environment variable lists, or schema mechanics. |
| `docs/technical/` | Architecture, onboarding, runtime, and operations summaries. | Low-level implementation truth already owned by code, SQL assets, package scripts, or workspace READMEs. |
| `openspec/specs/` | Accepted requirements and scenarios. | Implementation details or local setup recipes. |
| `design/` | UI intent and interaction references. | Runtime behavior guarantees. |

## Architecture Boundaries

### API boundary

The API is the backend runtime boundary. It issues and verifies RS256-backed session tokens, sets a hardened `session` cookie, populates tenant context, gates super-admin provisioning, and delegates SQL access through `DatabaseService`.

Canonical details live in [API README](../../apps/api/README.md), `apps/api/src/`, and API tests.

### Web boundary

The web app is the frontend runtime boundary. It provides `/login`, stores returned authority in `AuthStore`, routes authenticated `super_admin` users into the protected shell, calls API routes through relative `/api/*` URLs, and uses Vite's local proxy during development.

Canonical details live in [Web README](../../apps/web/README.md), `apps/web/src/`, `apps/web/vite.config.ts`, and web tests.

### Contracts boundary

Shared contracts define stable TypeScript shapes for roles, auth context, login responses, company provisioning, and audit event inputs. Runtime code imports these types instead of redefining cross-workspace DTOs.

Canonical details live in [Contracts README](../../packages/contracts/README.md) and `packages/contracts/src/index.ts`.

### SQL boundary

SQL assets own persistence structure, RLS predicates/policies, seed order, and smoke-test behavior. Runtime connections must set `SESSION_CONTEXT` before tenant-scoped reads or writes.

Canonical details live in [SQL Server README](../../db/sqlserver/README.md), [migrations README](../../db/sqlserver/migrations/README.md), and `db/sqlserver/schema/`.

## Canonical Sources

| Topic | Canonical source |
|---|---|
| Product behavior and acceptance criteria | [OpenSpec specs](../../openspec/specs/) |
| Documentation change scope | [Project documentation spec](../../openspec/specs/project-documentation/spec.md) |
| API setup, auth behavior, and backend verification | [API README](../../apps/api/README.md) and `apps/api/src/` |
| Web setup, login behavior, local proxy, and frontend verification | [Web README](../../apps/web/README.md), `apps/web/src/`, and `apps/web/vite.config.ts` |
| Shared DTO and role-code boundaries | [Contracts README](../../packages/contracts/README.md) and `packages/contracts/src/index.ts` |
| Schema, RLS, migrations, and SQL smoke behavior | [SQL Server README](../../db/sqlserver/README.md), [migrations README](../../db/sqlserver/migrations/README.md), and SQL assets |
| CI verification path | [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml), which runs tests, typecheck, lint, format check, web build, and manual SQL Server RLS smoke. |
| UI intent | [Design references](../../design/) |

## Related Docs

- [Root documentation hub](../../README.md)
- [Technical onboarding](onboarding.md)
- [Runtime and operations](runtime-and-operations.md)
- [Product overview](../product/overview.md)
- [Roles and flows](../product/roles-and-flows.md)
