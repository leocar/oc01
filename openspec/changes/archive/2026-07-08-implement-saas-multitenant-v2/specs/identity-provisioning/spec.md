# Identity Provisioning Specification

## Purpose

Define global administration, tenant provisioning, and session acceptance behavior.

## Requirements

### Requirement: Authenticate Global Super-Admin Authority

Successful global administrator authentication MUST produce `super_admin` authority. The system MUST NOT treat tenant-scoped roles alone as sufficient for global provisioning actions.

#### Scenario: Global authentication grants super-admin authority

- GIVEN a valid global administrator authentication attempt
- WHEN authentication succeeds
- THEN the resulting authority includes `super_admin`

#### Scenario: Tenant role cannot act as global administrator

- GIVEN a caller authenticated only with tenant-scoped authority
- WHEN the caller invokes a global provisioning action
- THEN the system denies the action

### Requirement: Provision Company and Initial Administrator

The system MUST create the company and its initial administrator in one successful provisioning action. The initial administrator MUST be created with company scope. Any temporary bootstrap access MUST require rotation or replacement on first successful use.

#### Scenario: Authorized provisioning creates scoped bootstrap state

- GIVEN an authenticated `super_admin` with valid company and administrator details
- WHEN the provisioning request succeeds
- THEN the system creates the company, creates the initial administrator with company scope, and returns bootstrap access information

#### Scenario: First use of temporary access forces replacement

- GIVEN an initial administrator signs in with temporary bootstrap access
- WHEN the first successful use completes
- THEN the system requires that temporary access to be rotated or replaced before normal continued use

### Requirement: Accept Only Hardened Session Tokens

The system MUST accept only signed JWS compact tokens using an allowlisted `alg`. The system MUST reject `alg` `none`, MUST reject `zip`, and MUST reject tokens whose `p2c` exceeds a design-configurable bound when `p2c` is present. Session cookies MUST be issued as `HttpOnly`, `Secure`, and `SameSite=Strict`.

#### Scenario: Non-compliant token is rejected

- GIVEN a presented token uses `alg` `none`, uses `zip`, or exceeds the accepted `p2c` bound
- WHEN the system evaluates the session token
- THEN the system rejects the token

#### Scenario: Accepted session sets hardened cookie attributes

- GIVEN a token that satisfies the session acceptance contract
- WHEN the system establishes the session cookie
- THEN the cookie is `HttpOnly`, `Secure`, and `SameSite=Strict`
