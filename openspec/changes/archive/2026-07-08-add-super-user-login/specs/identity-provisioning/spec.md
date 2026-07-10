# Delta for Identity Provisioning

## ADDED Requirements

### Requirement: Authenticate Super-User Credentials

The system MUST authenticate the seeded global administrator with submitted username and password credentials. Successful authentication MUST create `super_admin` authority and establish the hardened session contract.

#### Scenario: Valid super-user credentials establish session

- GIVEN the seeded global administrator exists with a matching stored password hash
- WHEN the user submits valid credentials
- THEN the system authenticates the user as `super_admin`
- AND the response establishes a hardened session cookie

#### Scenario: Invalid credentials are rejected safely

- GIVEN an unknown username or a password that does not match the stored hash
- WHEN the user submits credentials
- THEN the system rejects the request without establishing a session
- AND the response does not reveal whether the username exists

## MODIFIED Requirements

### Requirement: Authenticate Global Super-Admin Authority

Successful global administrator authentication MUST produce `super_admin` authority. The system MUST NOT treat tenant-scoped roles alone as sufficient for global provisioning actions. Credential login and accepted signed session tokens MUST produce the same global authority semantics.
(Previously: only successful global administrator authentication was required to produce `super_admin` authority; credential login was not explicitly covered.)

#### Scenario: Global authentication grants super-admin authority

- GIVEN a valid global administrator authentication attempt
- WHEN authentication succeeds
- THEN the resulting authority includes `super_admin`

#### Scenario: Tenant role cannot act as global administrator

- GIVEN a caller authenticated only with tenant-scoped authority
- WHEN the caller invokes a global provisioning action
- THEN the system denies the action

#### Scenario: Credential login grants equivalent super-admin authority

- GIVEN valid seeded super-user credentials
- WHEN credential login succeeds
- THEN protected global provisioning actions evaluate the session as `super_admin`

## REMOVED Requirements

None

## RENAMED Requirements

None
