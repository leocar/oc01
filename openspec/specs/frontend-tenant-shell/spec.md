# Frontend Tenant Shell Specification

## Purpose

Define tenant-aware authentication, routing, and accessibility behavior.

## Requirements

### Requirement: Guard Protected Tenant Routes

The frontend MUST apply protected route guards before entering tenant-protected views. It MUST present tenant context consistently for authorized navigation, MUST route unauthenticated users to the complete login form, MUST admit authenticated `super_admin` users to the protected landing screen that contains the company-provisioning experience, and MUST prevent authenticated non-`super_admin` users from accessing or invoking that provisioning experience.

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

### Requirement: Provide Accessible Security Feedback and Dialog Behavior

The frontend MUST provide accessible feedback for successful provisioning and for security validation errors. Modal or dialog flows used for security-sensitive actions MUST contain focus while open and return focus to a logical invoking element when dismissed.

#### Scenario: Provisioning success is announced accessibly

- GIVEN a provisioning flow completes successfully
- WHEN the success state is shown to the user
- THEN the frontend presents accessible success feedback

#### Scenario: Security validation error is announced accessibly

- GIVEN a security validation error blocks user progress
- WHEN the error state is shown
- THEN the frontend presents accessible error feedback describing the validation failure

#### Scenario: Security dialog contains and restores focus

- GIVEN a security-related modal or dialog is opened
- WHEN the user navigates within or dismisses it
- THEN focus remains contained while open and returns to a logical invoking element when closed

### Requirement: Provide Complete Super-User Login Form

The frontend MUST present an accessible login form for username and password credentials. The form MUST support loading, success, and failure states without exposing sensitive credential details.

#### Scenario: Login form submits credentials

- GIVEN an unauthenticated user is on the login route
- WHEN the user submits username and password values
- THEN the frontend sends the credentials to the login API
- AND indicates that authentication is in progress

#### Scenario: Login failure remains accessible

- GIVEN the login API rejects the credentials
- WHEN the failure is shown
- THEN the frontend keeps the user on the login route
- AND announces a generic authentication error accessibly

#### Scenario: Successful login enters protected shell

- GIVEN the login API accepts the credentials and returns session authority
- WHEN the frontend stores the authenticated state
- THEN the user is routed into the protected command shell
