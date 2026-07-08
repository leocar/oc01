# SaaS Admin Shell - Dark Glass Morphism

OpenPencil document: `design/saas-admin-shell.op`

> Note: The OpenPencil `.op` source is materialized in the Windows workspace. This markdown remains as the reviewable UI contract for the same design asset.

## Purpose

Admin workspace for `super_admin` tenant provisioning, tenant-isolation monitoring, and audit review.

## Visual Direction

- Dark glass morphism SaaS admin interface.
- Background: deep navy/indigo gradient.
- Surfaces: dark translucent-style panels with subtle cyan/violet glow.
- Accents: cyan for active/security-positive states, violet for privileged authority, red/amber for denied access and enumeration risk.
- Typography: IBM Plex Sans for UI text, IBM Plex Mono for security/audit data.

## Screen Structure

- Left glass sidebar with brand lockup, provisioning navigation, tenants, audit log, and RLS policies.
- Main top bar showing `SaaS Tenant Command` and `super_admin` authority.
- Metric cards for tenant count, denied cross-tenant attempts, and RLS policy health.
- Provisioning panel for company name, initial admin email, and create-tenant action.
- Accessible announcement preview for provisioning feedback.
- Audit signals panel showing 403 cross-tenant denials, `SESSION_CONTEXT` activity, and ID enumeration signals.

## Accessibility Contract

- Provisioning success and security validation errors must be announced accessibly.
- Security dialogs must trap focus while open and restore focus on close.
- Color-coded states must include textual labels; color alone is not sufficient.
