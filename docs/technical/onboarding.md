# Technical Onboarding

Use this path to get a contributor from a fresh checkout to the current verification commands without hunting through every workspace. The package scripts and workspace READMEs remain canonical; this page is the routed setup checklist.

## Audience

New contributors, technical reviewers, and maintainers who need the local toolchain, setup path, environment variables, and verification entrypoints in one place.

## Purpose

Summarize the current setup path and point to the canonical workspace files for commands, environment variables, and caveats.

## Implemented Now

| Area | Current state |
|---|---|
| Package manager | Root `package.json` declares `pnpm@9.15.4`. Existing docs use `npx pnpm@9.15.4 ...` for repeatable commands. |
| Workspaces | API, web, and contracts packages each expose `test`, `lint`, `typecheck`, and `format:check` scripts where applicable. |
| API runtime | `apps/api` starts with `node --env-file=.env --import tsx src/main.ts`. |
| Web runtime | `apps/web` starts Vite with `vite --host 0.0.0.0`. |
| SQL smoke | Root scripts support Docker-backed and local SQL Server RLS smoke tests. |
| CI workflow | `.github/workflows/ci.yml` is the canonical CI workflow. It runs tests, typecheck, lint, format check, and the web build on pull requests and selected pushes; SQL Server RLS smoke runs on manual dispatch. |

## Quick Setup Path

1. Install Node.js and use the repository package manager version from `package.json`: `pnpm@9.15.4`.
2. Install dependencies from the repository root.
3. Prepare SQL Server only when you need live database behavior or SQL smoke verification.
4. Configure API environment variables in `apps/api/.env` or the shell that starts the API.
5. Start the API first when exercising web flows that call `/api/*`.
6. Start the web app and use the Vite `/api` proxy for local browser requests.
7. Run the verification commands that match the change being reviewed.

## Required Tools

| Tool | Used for | Source |
|---|---|---|
| Node.js | Workspace scripts and runtime entrypoints. | Root and workspace `package.json` files. |
| pnpm 9.15.4 | Dependency installation and workspace commands. | Root `package.json` `packageManager`. |
| Docker | Optional SQL Server smoke environment and optional SQLCMD client container. | [SQL Server README](../../db/sqlserver/README.md) |
| SQL Server / `sqlcmd` | Local database setup, seeds, and local SQL smoke. | [SQL Server migrations README](../../db/sqlserver/migrations/README.md) |
| PowerShell or shell environment | Secret-safe local environment variable setup. | Workspace READMEs and SQL smoke examples. |

## Environment Variables

| Variable | Required when | Canonical source |
|---|---|---|
| `DATABASE_URL` | Running API code that accesses SQL Server. | [API README](../../apps/api/README.md), `apps/api/src/database/database.service.ts` |
| `AUTH_SESSION_PRIVATE_KEY` | Issuing session tokens from the API. Use PKCS8 text; escaped `\n` sequences are normalized by code. | [API README](../../apps/api/README.md), `apps/api/src/auth/session-token-issuer.service.ts` |
| `AUTH_SESSION_PUBLIC_KEY` | Verifying session tokens in the API. Use SPKI text; escaped `\n` sequences are normalized by code. | [API README](../../apps/api/README.md), `apps/api/src/auth/session-verification-key.service.ts` |
| `SUPER_ADMIN_PASSWORD` | Preparing the local seeded `sa` password hash. Do not commit or print it. | [API README](../../apps/api/README.md), [migrations README](../../db/sqlserver/migrations/README.md) |
| `SQLSERVER_HOST`, `SQLSERVER_PORT`, `SQLSERVER_USER`, `SQLSERVER_PASSWORD`, `SQLSERVER_DATABASE` | Running local SQL smoke against an existing SQL Server instance. | [SQL Server README](../../db/sqlserver/README.md) |
| `SQLCMD_MODE`, `SQLCMD_DOCKER_IMAGE`, `SQLCMD_PATH` | Selecting local or Docker SQLCMD execution for SQL smoke. | [SQL Server README](../../db/sqlserver/README.md) |
| `SQL_SMOKE_DATABASE`, `SQL_SMOKE_KEEP_DATABASE` | Overriding or keeping the disposable SQL smoke database. | [SQL Server README](../../db/sqlserver/README.md) |
| `SQLCMDPASSWORD` | Manual cleanup command for a kept SQL smoke database. Remove it immediately after use. | [SQL Server README](../../db/sqlserver/README.md) |

## Verification Commands

Run commands from the repository root unless noted otherwise.

| Command | Verifies | Source |
|---|---|---|
| `npx pnpm@9.15.4 test` | Root script tests `scripts/*.test.mjs`, then package tests where present. | Root `package.json`, API README, Web README |
| `npx pnpm@9.15.4 lint` | Workspace lint scripts; currently TypeScript `--noEmit` checks in packages. | Root and workspace `package.json` files |
| `npx pnpm@9.15.4 typecheck` | Workspace TypeScript checks. | Root and workspace `package.json` files |
| `npx pnpm@9.15.4 format:check` | Workspace Prettier checks. | Root and workspace `package.json` files |
| `npx pnpm@9.15.4 --filter @oc01/web build` | Web production build. | Web README and `apps/web/package.json` |
| `npx pnpm@9.15.4 smoke:sqlserver` | Docker-backed live SQL Server RLS smoke. | SQL Server README and root `package.json` |
| `npx pnpm@9.15.4 smoke:sqlserver:local` | RLS smoke against an already-running SQL Server instance. | SQL Server README and root `package.json` |

CI uses the same package scripts in `.github/workflows/ci.yml`: `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, and `pnpm --filter @oc01/web build`. The SQL Server RLS smoke job runs only for `workflow_dispatch`.

## Canonical Sources

| Topic | Source |
|---|---|
| Root scripts and package manager version | [Root package.json](../../package.json) |
| API runtime variables and backend verification | [API README](../../apps/api/README.md) and [API package.json](../../apps/api/package.json) |
| Web runtime, proxy, tests, and build | [Web README](../../apps/web/README.md), [Web package.json](../../apps/web/package.json), and `apps/web/vite.config.ts` |
| Contract package commands | [Contracts README](../../packages/contracts/README.md) and [Contracts package.json](../../packages/contracts/package.json) |
| SQL smoke and RLS setup | [SQL Server README](../../db/sqlserver/README.md) and [migrations README](../../db/sqlserver/migrations/README.md) |
| CI verification path | [CI workflow](../../.github/workflows/ci.yml) |

## Related Docs

- [Root documentation hub](../../README.md)
- [Technical architecture](architecture.md)
- [Runtime and operations](runtime-and-operations.md)
- [API README](../../apps/api/README.md)
- [Web README](../../apps/web/README.md)
- [SQL Server README](../../db/sqlserver/README.md)
