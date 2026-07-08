# Authorization RBAC Specification

## Purpose

Define tenant-scoped role behavior for company resources.

## Requirements

### Requirement: Apply Tenant-Scoped RBAC

The system MUST distinguish at least `tenant_admin`, `editor`, and `reader` within the active tenant. `tenant_admin` MUST be able to perform tenant administration actions allowed by policy, `editor` MUST be able to perform permitted write actions without gaining tenant administration authority, and `reader` MUST be limited to read-only actions. No tenant role MAY grant cross-tenant access.

#### Scenario: Tenant admin performs allowed tenant action

- GIVEN a signed-in `tenant_admin` in Tenant A
- WHEN the user performs a permitted tenant administration action in Tenant A
- THEN the system authorizes the action

#### Scenario: Editor performs allowed write action

- GIVEN a signed-in `editor` in Tenant A
- WHEN the user performs a permitted write action in Tenant A
- THEN the system authorizes the action without granting tenant administration authority

#### Scenario: Reader write or delete is denied inside own tenant

- GIVEN a signed-in `reader` in Tenant A
- WHEN the user attempts a write or delete action on a Tenant A resource
- THEN the system denies the action

#### Scenario: Tenant role cannot cross tenant boundary

- GIVEN a signed-in tenant user acting in Tenant A
- WHEN the user targets a Tenant B resource without explicit administrative scope
- THEN the system denies the action
