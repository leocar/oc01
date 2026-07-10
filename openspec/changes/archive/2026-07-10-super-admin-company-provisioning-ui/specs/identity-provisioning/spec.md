# Delta for Identity Provisioning

## MODIFIED Requirements

### Requirement: Provision Company and Initial Administrator

The system MUST create the company and its initial administrator in one successful provisioning action. The action MUST be available only to authenticated `super_admin` authority. The initial administrator MUST be created with company scope. Any temporary bootstrap access MUST require rotation or replacement on first successful use. Any response or confirmation shown to the caller MUST omit bootstrap secrets and MAY include non-secret bootstrap policy metadata.

(Previously: Successful provisioning returned bootstrap access information to the caller.)

#### Scenario: Authorized provisioning returns non-secret confirmation

- GIVEN an authenticated `super_admin` with valid company and administrator details
- WHEN the provisioning request succeeds
- THEN the system creates the company, creates the initial company-scoped administrator, and returns only non-secret confirmation metadata

#### Scenario: First use of temporary access forces replacement

- GIVEN an initial administrator signs in with temporary bootstrap access
- WHEN the first successful use completes
- THEN the system requires that temporary access to be rotated or replaced before normal continued use

#### Scenario: Non-super-admin provisioning is denied

- GIVEN a caller authenticated without `super_admin` authority
- WHEN the caller invokes company provisioning
- THEN the system denies the action and does not expose provisioning secrets
