# Design: Complete Project Documentation

## Technical Approach

Create a short root `README.md` that answers what OC01 is, who each doc path is for, and where canonical detail lives. Add five focused narrative docs under `docs/product/` and `docs/technical/`. Keep implementation truth in existing OpenSpec specs, workspace READMEs, SQL docs, design references, and CI config; the new docs summarize current behavior and link outward instead of duplicating low-level detail.

## Architecture Decisions

| Decision | Options | Choice | Rationale |
|---|---|---|---|
| Root entrypoint | Mega README / short hub | Short hub | Matches the spec requirement for fast routing and lower review load. |
| Doc split | Mixed audience docs / audience branches | `product` + `technical` branches | OC01 already has distinct reader needs: reviewers/product vs contributors/operators. |
| Canonical truth | Copy details into new docs / link to existing sources | Link-first narrative docs | Prevents drift from `openspec/specs/*`, workspace READMEs, SQL docs, and design refs. |
| Product scope | Future-state narrative / implemented-only narrative | Implemented-only narrative | Avoids overpromising flows not present beyond login and super-admin provisioning. |
| Runtime caveats | Hide in workspace docs / expose centrally | Expose in `docs/technical/runtime-and-operations.md` with links back to canonical files | Secure cookies, Vite proxy, and refresh/re-login limits are cross-cutting and easy to miss. |

## Data Flow

Reader flow:

`README.md` → choose audience path → focused narrative doc → canonical source

Canonical path:

`docs/product/*` → `openspec/specs/*`, `design/*.md`
`docs/technical/*` → workspace `README.md` files, `db/sqlserver/*.md`, `.github/workflows/ci.yml`, `package.json`

Update flow:

Behavior/code change → update canonical source first → update linked narrative doc summary if reader-facing meaning changed.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `README.md` | Create | Root hub: purpose, audiences, quick routes, canonical-reference section. |
| `docs/product/overview.md` | Create | Product summary for implemented platform scope, actors, tenant model, and boundaries. |
| `docs/product/roles-and-flows.md` | Create | Implemented roles, login path, provisioning flow, and explicit non-implemented/out-of-scope notes. |
| `docs/technical/architecture.md` | Create | Repo map, Angular/NestJS/contracts/SQL boundaries, and source-of-truth map. |
| `docs/technical/onboarding.md` | Create | Local setup path, required tools, env variables, and verification entrypoints. |
| `docs/technical/runtime-and-operations.md` | Create | Session cookie, Vite `/api` proxy, SQL smoke, RLS/runtime caveats, and known refresh limitation. |
| `apps/api/README.md` | Modify | Add backlink to hub; keep API setup/auth details canonical. |
| `apps/web/README.md` | Modify | Add backlink to hub; keep frontend login/proxy behavior canonical. |
| `packages/contracts/README.md` | Modify | Add backlink; remain canonical for shared DTO boundaries. |
| `db/sqlserver/README.md` | Modify | Add backlink; remain canonical for schema/RLS/smoke details. |
| `db/sqlserver/migrations/README.md` | Modify | Add backlink; remain canonical for migration order and session-context requirements. |

## Interfaces / Contracts

```text
Narrative docs MUST contain:
- Audience
- Purpose
- What is implemented now
- Canonical sources
- Related docs

Canonical ownership:
- Product behavior -> openspec/specs/*.md
- UI intent -> design/*.md and .op assets
- Workspace setup/commands -> workspace README.md files and package.json scripts
- Schema/RLS/runtime SQL -> db/sqlserver/*.md and SQL assets
- CI verification path -> .github/workflows/ci.yml
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Structure | Hub and five leaf docs exist with stable links | Review file set and relative links during docs PR review. |
| Completeness | Product, technical, canonical-boundary, and caveat coverage | Use a checklist against the spec requirements before merge. |
| Drift | Commands, env vars, routes, and limitations still match code/specs | Verify every command against `package.json`/CI, every env var against code/README, and every documented flow against OpenSpec plus implemented routes like `/login`, `POST /api/auth/login`, and `POST /api/admin/companies`. |

## Migration / Rollout

No migration required. Roll out in one docs-only PR. Root hub lands first in the same PR so new leaf docs are never orphaned.

## Open Questions

- [ ] None.
