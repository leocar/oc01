# Super User Login OpenPencil Design Reference

## Canvas

- Target: mobile single-task screen
- Size: 375 x 812
- Style: dark glassmorphism with cyan/violet security accents
- Primary account hint: `sa`

## Composition

### Root Frame

- Name: `Super User Login`
- Background: diagonal gradient from `#060816` through `#101827` to `#04111F`
- Padding: `32px 20px`

### Login Panel

- Glass card surface: `rgba(15,23,42,0.72)`
- Rounded panel with centered vertical layout
- Content order:
  - Security glyph with shield/check icon
  - Eyebrow: `SUPER USER ACCESS`
  - Title: `Sign in as sa`
  - Subtitle explaining global administrator access
  - Username field
  - Password field with lock and visibility affordance
  - Primary submit button
  - Generic invalid-credentials message region
  - Session security note

## Form Controls

- Username field label/placeholder: `Username: sa`
- Password field label/placeholder: `Password`
- Primary action: `Enter Command Shell`
- Error copy: `Invalid credentials are shown here without revealing account details.`

## Accessibility Notes

- The invalid-credentials message must be announced accessibly.
- Loading state must disable repeated submission.
- Input labels must remain programmatically available even if visual treatment uses placeholders.
- The first focus target on `/login` should be the username field.

## Implementation Notes

- Match this reference in `apps/web/src/app/auth/login.component.ts`.
- Preserve dark glassmorphism language already established for the admin shell.
- Do not hardcode or display the real password in UI, source, tests, docs, or snapshots.
