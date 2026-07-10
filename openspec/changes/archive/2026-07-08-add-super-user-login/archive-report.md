# Archive Report: Add Super User Login

## Summary

- **Change**: `add-super-user-login`
- **Mode**: `hybrid`
- **Archived at**: `openspec/changes/archive/2026-07-08-add-super-user-login/`
- **Archive status**: `intentional-with-warnings`
- **Verification verdict**: `PASS WITH WARNINGS`
- **Critical issues**: `None`

## Gate Validation

### Task Completion Gate

- `openspec/changes/add-super-user-login/tasks.md` was validated before archive and all 15/15 implementation tasks were checked complete.
- `verify-report.md` reported `4.3` as stale at verification time, but the persisted `tasks.md` was synchronized before archive.
- Hybrid reconciliation note: Engram task artifact `#128` was refreshed during archive because an earlier revision still showed stale unchecked boxes. This exceptional mechanical reconciliation was backed by `sdd/add-super-user-login/apply-progress` observation `#130`, `sdd/add-super-user-login/verify-report` observation `#134`, and the fully checked filesystem `tasks.md`.

### Verification Gate

- `verify-report.md` status: `PASS WITH WARNINGS`
- `CRITICAL` issues: none
- Accepted warnings:
  - No live DB-backed `POST /api/auth/login` smoke in this session because `DATABASE_URL`, `AUTH_SESSION_PRIVATE_KEY`, and `AUTH_SESSION_PUBLIC_KEY` were unavailable.
  - `/health/live` and `/health/ready` evidence likely came from an already-running process, so health evidence is limited.
  - Automated API/web tests, workspace test/typecheck/lint evidence, and web build evidence passed and were accepted as sufficient for archive with warnings.

## Spec Sync Report

| Domain | Action | Details |
|--------|--------|---------|
| `identity-provisioning` | Updated | 1 added requirement, 1 modified requirement, 0 removed, 0 renamed |
| `frontend-tenant-shell` | Updated | 1 added requirement, 1 modified requirement, 0 removed, 0 renamed |

### Updated Source-of-Truth Specs

- `openspec/specs/identity-provisioning/spec.md`
- `openspec/specs/frontend-tenant-shell/spec.md`

## Engram Traceability

| Artifact | Observation ID | Topic / Title |
|----------|----------------|---------------|
| Proposal | `#125` | `sdd/add-super-user-login/proposal` |
| Spec | `#126` | `sdd/add-super-user-login/spec` |
| Design | `#127` | `sdd/add-super-user-login/design` |
| Tasks | `#128` | `sdd/add-super-user-login/tasks` |
| Apply progress proof | `#130` | `sdd/add-super-user-login/apply-progress` |
| Verify report | `#134` | `sdd/add-super-user-login/verify-report` |

## Archive Verification

- [x] Main specs updated correctly
- [x] Change folder moved to archive
- [x] Archive contains proposal, specs, design, tasks, verify report, and archive report
- [x] Archived `tasks.md` has no unchecked implementation tasks
- [x] Active `openspec/changes/` no longer contains `add-super-user-login`

## Warnings

- Archive is intentional with warnings because live environment smoke evidence is still missing.
- Before release, rerun a true environment-backed login smoke for the seeded `sa` account when the required runtime variables are available.

## Outcome

The delta specs were merged into the main specs, the hybrid audit trail was preserved in both OpenSpec and Engram, and the change is now archived as a completed SDD cycle.
