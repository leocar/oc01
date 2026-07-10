# Runtime and Operations

OC01's current runtime path depends on a secure session cookie, Vite's local `/api` proxy, SQL Server `SESSION_CONTEXT`, and explicit re-login expectations. This page centralizes those caveats so contributors do not confuse local development behavior with production completeness.

## Audience

Operators, maintainers, and contributors validating local runtime behavior, auth/session behavior, SQL smoke tests, and troubleshooting caveats.

## Purpose

Summarize runtime expectations and operational caveats while linking to the canonical code, workspace READMEs, and SQL assets that own the details.

## Implemented Now

| Area | Current behavior |
|---|---|
| Session cookie | `POST /api/auth/login` sets a `session` cookie with `httpOnly: true`, `secure: true`, `sameSite: "strict"`, and `path: "/"`. |
| Token algorithm | Session tokens are signed and verified as RS256 JWTs with configured private/public keys. |
| Local web proxy | Vite proxies relative `/api` requests from the web dev server to `http://localhost:3000`. |
| SQL tenant context | Runtime SQL access sets `company_id`, `user_role`, and clears request/session context around transactions. |
| RLS smoke | SQL smoke scripts validate tenant reads and cross-tenant block behavior against live SQL Server. |
| Refresh limitation | The web `AuthStore` is in-memory. A browser refresh loses frontend auth state even if the secure cookie still exists, so local users should expect to re-login until session rehydration exists. |

## Secure Cookie Caveats

The API uses a hardened cookie by default:

| Cookie option | Value | Practical effect |
|---|---|---|
| `httpOnly` | `true` | Browser JavaScript cannot read the session cookie. |
| `secure` | `true` | Browsers only send the cookie over secure contexts. Plain `http://localhost` behavior can differ by browser and setup. |
| `sameSite` | `strict` | Cross-site requests should not carry the cookie. Keep local web/API access same-site or intentionally proxy through the web dev server. |
| `path` | `/` | The cookie is available to the application path. |

For canonical behavior, check `apps/api/src/auth/session-cookie.ts` and [API README](../../apps/api/README.md).

## Vite `/api` Proxy Caveats

The web app calls API routes with relative `/api/*` URLs. During local web development, `apps/web/vite.config.ts` proxies `/api` to `http://localhost:3000`.

Operational implications:

- Start the API on `localhost:3000` before exercising login or company provisioning through the web app.
- Keep browser requests on the web dev server origin so the relative `/api` calls hit the Vite proxy.
- If the API runs elsewhere, update local proxy configuration intentionally; do not document a different default until the config changes.

## SQL Smoke and RLS Caveats

RLS behavior is validated through opt-in live SQL Server smoke commands, not through the default TypeScript test suite alone.

| Caveat | Detail |
|---|---|
| Live dependency | `smoke:sqlserver` needs Docker. `smoke:sqlserver:local` needs a running SQL Server and SQLCMD access. |
| Disposable database | The local smoke wrapper creates and drops an isolated smoke database by default. |
| Kept databases | `SQL_SMOKE_KEEP_DATABASE=true` keeps the database for debugging and prints its name; manually clean it up after use. |
| Protected names | System database names are rejected for `SQL_SMOKE_DATABASE`. |
| Session context | Tenant-scoped reads/writes require `SESSION_CONTEXT(N'company_id')` and `SESSION_CONTEXT(N'user_role')`; bootstrap/global access has separate context requirements. |

For canonical details, use [SQL Server README](../../db/sqlserver/README.md), [migrations README](../../db/sqlserver/migrations/README.md), and SQL assets under `db/sqlserver/`.

## Refresh and Re-login Limits

Current frontend auth state is signal-backed and in-memory. Login success stores returned authority in `AuthStore`, but there is no documented session rehydration endpoint or persistent frontend authority store in this slice.

Practical effect:

- A successful login can enter the protected shell during the current app session.
- A browser refresh can reset frontend auth state to unauthenticated.
- Re-login is the expected local workaround until a future session refresh or rehydration flow is implemented and documented.

## Operations Checklist

- [ ] API environment includes `DATABASE_URL`, `AUTH_SESSION_PRIVATE_KEY`, and `AUTH_SESSION_PUBLIC_KEY` before backend auth/database flows are exercised.
- [ ] Local super-admin password handling stays out of source control, docs, shell history, and snapshots.
- [ ] API is reachable on `localhost:3000` when using the default Vite `/api` proxy.
- [ ] SQL smoke commands are run only when Docker or a local SQL Server/SQLCMD path is available.
- [ ] Browser refresh/re-login behavior is treated as a known limitation, not a regression, until session rehydration exists.

## Canonical Sources

| Topic | Source |
|---|---|
| Session cookie options | `apps/api/src/auth/session-cookie.ts` |
| Session token signing and verification keys | `apps/api/src/auth/session-token-issuer.service.ts`, `apps/api/src/auth/session-verification-key.service.ts`, [API README](../../apps/api/README.md) |
| Login route and cookie issuance | `apps/api/src/auth/auth.controller.ts` |
| Frontend auth state and login flow | `apps/web/src/app/auth/auth.store.ts`, `apps/web/src/app/auth/login.component.ts`, [Web README](../../apps/web/README.md) |
| Vite local proxy | `apps/web/vite.config.ts` |
| Database connection and session context | `apps/api/src/database/database.service.ts` |
| RLS smoke and SQL operations | [SQL Server README](../../db/sqlserver/README.md), [migrations README](../../db/sqlserver/migrations/README.md) |

## Related Docs

- [Root documentation hub](../../README.md)
- [Technical architecture](architecture.md)
- [Technical onboarding](onboarding.md)
- [API README](../../apps/api/README.md)
- [Web README](../../apps/web/README.md)
- [SQL Server README](../../db/sqlserver/README.md)
