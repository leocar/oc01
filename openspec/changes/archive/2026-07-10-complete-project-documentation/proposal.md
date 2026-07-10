# Proposal: Complete Project Documentation

## Intent

Create a layered documentation hub that explains OC01 to the right audience without duplicating OpenSpec, workspace READMEs, SQL assets, or design references.

## Scope

### In Scope
- Define root docs entrypoint plus split between product/user docs and technical/onboarding docs.
- Define canonical-source boundaries and link strategy to prevent drift.
- Define the specific docs to create or update, their audience, and their ownership intent.

### Out of Scope
- Writing the full docs content or rewriting all existing READMEs.
- Changing product behavior, APIs, auth, tenancy, CI, or OpenPencil assets.

## Capabilities

### New Capabilities
- `project-documentation`: Documentation IA, audience split, canonical references, and maintenance rules for repo docs.

### Modified Capabilities
- None.

## Approach

Use a short root `README.md` as a hub, not a mega-doc. Add a `docs/` tree with two branches: product (`docs/product/overview.md`, `docs/product/roles-and-flows.md`) and technical (`docs/technical/architecture.md`, `docs/technical/onboarding.md`, `docs/technical/runtime-and-operations.md`). Keep canonical truth in OpenSpec (`openspec/specs/*`), workspace READMEs, SQL schema docs, and design references; narrative docs summarize and link outward.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `README.md` | New | Root docs hub and audience routing |
| `docs/product/*` | New | Product/user understanding path |
| `docs/technical/*` | New | Setup, architecture, runtime, onboarding path |
| `apps/*/README.md`, `db/sqlserver/*.md`, `packages/contracts/README.md` | Modified | Align existing workspace docs with hub links and scope boundaries |
| `openspec/specs/*`, `design/*.md`, `design/openpencil/forms/*.op` | Modified | Referenced as canonical sources, not duplicated |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Narrative docs drift from canonical sources | Med | Define source-of-truth ownership per doc type |
| Product docs overpromise unbuilt flows | Med | Limit product docs to implemented login/provisioning scope |
| Setup docs hide cookie/proxy/session caveats | High | Call out `Secure` cookie, proxy, and refresh limitations explicitly |

## Rollback Plan

Revert new hub/docs files and restore prior README links only; no runtime or schema rollback is required.

## Dependencies

- Existing OpenSpec specs, workspace READMEs, design docs, and SQL docs remain the canonical inputs.

## Success Criteria

- [ ] Proposal defines a clear docs IA with audience split and no giant README.
- [ ] Proposal names canonical sources for product, technical, schema, and design truth.
- [ ] Proposal identifies docs to create/update without implementing them.
