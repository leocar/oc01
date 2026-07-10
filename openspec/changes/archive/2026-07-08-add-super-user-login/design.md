# Design: Add Super User Login

## Technical Approach

Implement the missing credential-login slice without replacing the existing session-token model. The API will add `POST /api/auth/login`, verify the seeded `super_admin` database user, issue a signed `RS256` compact JWS in the existing hardened cookie shape, and return safe authority metadata. The Angular login screen will become a real reactive form and update `AuthStore` before routing to the protected shell.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|----------|--------|-------------------------|-----------|
| Session model | Reuse signed JWS + hardened cookie | Server-side session table | Matches existing `TokenValidatorService` and avoids a wider persistence change. |
| Login endpoint | Add `AuthController` in `apps/api/src/auth` | Put login under tenant access | Login is identity behavior, not tenant provisioning. |
| Password source | Compare against stored `dbo.users.password_hash` | Read plaintext env password at runtime | Keeps credentials out of process contracts; local setup can seed/update the hash separately. |
| UI design | OpenPencil dark glassmorphism login card | Generic Angular form | Preserves the project UI direction and gives implementation a concrete visual target. |

## Data Flow

    LoginComponent
      -> POST /api/auth/login
      -> AuthController
      -> AuthCredentialService
      -> DatabaseService(dbo.users + roles)
      -> SessionTokenIssuer
      -> Set-Cookie: session=<RS256 JWS>
      -> AuthStore.setState(authority)
      -> Router.navigateByUrl("/")

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `packages/contracts/src/index.ts` | Modify | Add login request/response types. |
| `apps/api/src/auth/auth.controller.ts` | Create | Expose `POST /api/auth/login`. |
| `apps/api/src/auth/auth-credential.service.ts` | Create | Verify username/password against database. |
| `apps/api/src/auth/session-token-issuer.service.ts` | Create | Sign accepted authority into compact JWS. |
| `apps/api/src/auth/auth.module.ts` | Modify | Register controller and new providers. |
| `apps/web/src/app/auth/login.component.ts` | Modify | Replace placeholder with real responsive form. |
| `apps/web/src/app/auth/auth.store.ts` | Modify | Store authenticated authority after login. |
| `apps/web/test/*` and `apps/api/test/*` | Modify/Create | Cover login success/failure, cookie attributes, UI states, and guard routing. |
| `design/super-user-login.md` | Create | Versioned OpenPencil design reference for the login experience. |

## Interfaces / Contracts

```ts
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  roles: RoleCode[];
  isSuperAdmin: boolean;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|--------------|----------|
| API unit | Credential success/failure and generic rejection | Vitest with injected database driver. |
| API HTTP | Cookie attributes and response authority | Nest HTTP test for `POST /api/auth/login`. |
| Web unit | Form validation, loading, error, store update | Angular/Vitest component tests. |
| Web routing | Guard admits post-login state | Existing guard tests extended. |

## Migration / Rollout

No schema migration required. A valid `super_admin` password hash must exist before login can succeed. Existing token-protected API behavior remains compatible.

## Open Questions

- [ ] Choose the password hash algorithm already expected by the seed/update process before implementation.
