# Delta for Frontend Tenant Shell

## ADDED Requirements

### Requirement: Capture Super-Admin Company Provisioning Input

The frontend MUST present a company-creation form to signed-in `super_admin` users on the protected landing screen. The form MUST collect company name and initial administrator email, MUST validate missing or malformed input before submission, MUST show pending and error states during submission, and MUST present accessible success feedback that confirms company creation plus initial `tenant_admin` creation without exposing any secret.

#### Scenario: Valid provisioning submission succeeds

- GIVEN a signed-in `super_admin` on the protected landing screen
- WHEN the user submits a valid company name and administrator email
- THEN the frontend sends the provisioning request, shows a pending state, and displays accessible success confirmation without credentials

#### Scenario: Invalid input is blocked locally

- GIVEN a signed-in `super_admin` on the provisioning form
- WHEN the company name is empty or the administrator email is malformed
- THEN the frontend blocks submission and shows accessible validation feedback

#### Scenario: Submission failure keeps the user in control

- GIVEN a signed-in `super_admin` submits valid provisioning data
- WHEN the provisioning request fails
- THEN the frontend keeps the user on the landing screen and shows an accessible non-secret error state

## MODIFIED Requirements

### Requirement: Guard Protected Tenant Routes

The frontend MUST apply protected route guards before entering tenant-protected views. It MUST route unauthenticated users to the complete login form, MUST admit authenticated `super_admin` users to the protected landing screen that contains the company-provisioning experience, and MUST prevent authenticated non-`super_admin` users from accessing or invoking that provisioning experience.

(Previously: Protected routes admitted authorized tenant users generically and did not define super-admin-only provisioning access.)

#### Scenario: Super-admin reaches provisioning landing

- GIVEN an authenticated user with `super_admin` authority
- WHEN the user navigates to the protected root route
- THEN the frontend admits the route and shows the provisioning landing experience

#### Scenario: Unauthenticated route entry is blocked

- GIVEN a user who is unauthenticated
- WHEN the user navigates to a protected route
- THEN the frontend blocks entry and presents the login form

#### Scenario: Non-super-admin cannot use provisioning landing

- GIVEN an authenticated user without `super_admin` authority
- WHEN the user reaches the protected root route or provisioning UI
- THEN the frontend denies access to the provisioning experience or keeps it unavailable
