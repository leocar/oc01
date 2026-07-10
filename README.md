# OC01 Documentation Hub

OC01 is a multi-tenant SaaS administration workspace currently focused on global super-admin login and company provisioning. This hub routes readers to the right documentation without duplicating lower-level setup, API, SQL, or design details.

## Audience Routes

| Audience | Start here | Use it for |
|---|---|---|
| Product reviewers | [Product overview](docs/product/overview.md) | Current platform scope, actors, tenant model, and boundaries. |
| Product and QA reviewers | [Roles and flows](docs/product/roles-and-flows.md) | Implemented login and super-admin company provisioning flows. |
| Technical reviewers | [Technical architecture](docs/technical/architecture.md) | Repo map, workspace boundaries, and canonical ownership. |
| New contributors | [Technical onboarding](docs/technical/onboarding.md) | Required tools, setup path, environment variables, and verification commands. |
| Operators and maintainers | [Runtime and operations](docs/technical/runtime-and-operations.md) | Session cookie, Vite proxy, SQL smoke/RLS caveats, and session limitations. |
| API contributors | [API README](apps/api/README.md) | API setup, auth behavior, and backend verification details. |
| Web contributors | [Web README](apps/web/README.md) | Frontend setup, route behavior, and local web workflow. |
| Contract contributors | [Contracts README](packages/contracts/README.md) | Shared DTO and role-code boundaries. |
| Database contributors | [SQL Server README](db/sqlserver/README.md) | Schema, RLS, session context, and SQL smoke-test guidance. |

## Source-of-Truth Links

| Topic | Canonical source |
|---|---|
| Product behavior and acceptance criteria | [OpenSpec specs](openspec/specs/) |
| Documentation change scope | [Project documentation spec](openspec/specs/project-documentation/spec.md) |
| UI intent | [Design references](design/) |
| API implementation details | [API README](apps/api/README.md) and `apps/api/src/` |
| Web implementation details | [Web README](apps/web/README.md) and `apps/web/src/` |
| SQL schema and RLS behavior | [SQL Server README](db/sqlserver/README.md) and [migrations README](db/sqlserver/migrations/README.md) |
| CI verification path | [CI workflow](.github/workflows/ci.yml) |

## Current Documentation Scope

Implemented in this documentation change:

- Root documentation hub.
- Product documentation for platform scope, actors, tenant model, login, and super-admin provisioning.
- Technical documentation for architecture, onboarding, runtime expectations, and operational caveats.
- Backlinks from workspace READMEs to this hub and the technical docs.
- Final link-hardening, command/environment verification, and review checklist coverage.

## Documentation Maintenance Checklist

Use this checklist when product behavior, runtime behavior, commands, or workspace ownership changes:

- [ ] Update the canonical source first: OpenSpec specs, workspace README, SQL docs/assets, design reference, package script, or runtime code.
- [ ] Update the matching narrative doc only when the reader-facing meaning changes.
- [ ] Check relative links from this hub, `docs/**/*.md`, and modified workspace READMEs.
- [ ] Re-verify documented commands and environment variables against `package.json`, workspace READMEs, [the CI workflow](.github/workflows/ci.yml), and runtime code.
- [ ] Keep product docs limited to implemented flows; label future or absent journeys explicitly.
