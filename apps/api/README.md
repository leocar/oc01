# API Workspace

NestJS backend workspace for SaaS multi-tenant v2.

Back to the [OC01 documentation hub](../../README.md). For cross-workspace architecture, setup, and runtime caveats, start with [technical architecture](../../docs/technical/architecture.md), [technical onboarding](../../docs/technical/onboarding.md), and [runtime and operations](../../docs/technical/runtime-and-operations.md).

## Current Scope

- Signed RS256 session validation and hardened session cookie handling.
- Super-user credential login through `POST /api/auth/login`.
- AsyncLocalStorage tenant context populated from verified session claims.
- SQL Server access through `DatabaseService`, including transaction handling and session context setup/cleanup.
- Tenant-aware company provisioning with one-time-token bootstrap access.
- Fixed RBAC roles: `super_admin`, `tenant_admin`, `editor`, and `reader`.
- Cross-tenant denial auditing and source-IP enumeration protection.
- Health endpoints: `GET /health/live` and `GET /health/ready`.

## Local Super-User Login Setup

The app-level super user is the seeded global administrator (`sa`). Do not store
the plaintext password in source control, docs, shell history, or test snapshots.

Required runtime environment:

- `DATABASE_URL` - SQL Server connection string for the `oc01` database.
- `AUTH_SESSION_PRIVATE_KEY` - PKCS8 private key used to sign session tokens.
- `AUTH_SESSION_PUBLIC_KEY` - SPKI public key used to verify session tokens.
- `SUPER_ADMIN_PASSWORD` - local-only password value used when preparing the
  database hash.

The current development credential verifier accepts hashes stored as
`sha256:<hex>`. This is suitable only for the current local SDD slice; production
credential rollout should replace it with a password KDF such as Argon2id or
bcrypt.

Generate the local database hash from the environment value without printing the
password:

```powershell
$password = [Environment]::GetEnvironmentVariable("SUPER_ADMIN_PASSWORD", "User")
$bytes = [System.Text.Encoding]::UTF8.GetBytes($password)
$sha = [System.Security.Cryptography.SHA256]::Create()
$hash = "sha256:" + (($sha.ComputeHash($bytes) | ForEach-Object ToString x2) -join "")
```

Apply that hash to the seeded `sa` app user using your SQL Server admin session.
Keep the SQL credential out of files and command history.

## Verification

Run API tests through the workspace root:

```bash
npx pnpm@9.15.4 test
```
