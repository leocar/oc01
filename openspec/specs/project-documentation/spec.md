# Project Documentation Specification

## Purpose

Define a layered documentation system that routes readers quickly, preserves canonical technical truth, and stays reviewable as OC01 evolves.

## Requirements

### Requirement: Root Documentation Hub

The system MUST provide a root documentation hub that explains OC01, identifies target audiences, and routes readers to product, technical, and canonical references without becoming a mega-document.

#### Scenario: Reader finds the right path
- GIVEN a reviewer opens the root hub
- WHEN they scan its top-level sections
- THEN they can identify where to start for product, technical, and source-of-truth material

#### Scenario: Hub avoids duplication
- GIVEN the root hub references deeper material
- WHEN a topic already has a canonical source
- THEN the hub links outward instead of restating full details

### Requirement: Product and User Documentation

The system MUST provide product-facing documentation for implemented roles, login, provisioning, and tenant concepts, and MUST NOT describe unimplemented user journeys as available behavior.

#### Scenario: Product reader understands current scope
- GIVEN a product doc reader
- WHEN they read the overview and roles/flows material
- THEN they can explain current actors, login entry, and company provisioning scope

#### Scenario: Product docs avoid overpromising
- GIVEN a flow is not implemented yet
- WHEN a reader reviews product docs
- THEN the docs label it as out of scope, planned, or absent rather than present behavior

### Requirement: Technical and Onboarding Documentation

The system MUST provide technical documentation that covers repo structure, architecture boundaries, local onboarding, runtime expectations, and verification entrypoints for contributors and operators.

#### Scenario: New contributor follows the technical path
- GIVEN a developer new to OC01
- WHEN they read the technical docs
- THEN they can locate setup, architecture, runtime, and verification guidance

#### Scenario: Technical docs remain discoverable
- GIVEN a maintainer needs a specific topic
- WHEN they scan technical docs
- THEN each document has a focused purpose instead of mixed onboarding and architecture prose

### Requirement: Canonical Source Boundaries

The system MUST declare which sources are canonical for product behavior, workspace setup, schema/RLS, contracts, design intent, and specs, and SHOULD use narrative docs only to summarize and link to those sources.

#### Scenario: Reader verifies a source of truth
- GIVEN a reader needs authoritative detail
- WHEN they inspect the documentation boundaries
- THEN they can identify the exact canonical source for that topic

#### Scenario: Narrative docs prevent drift
- GIVEN a topic already exists in OpenSpec, README, SQL, or design references
- WHEN narrative docs discuss it
- THEN they summarize the topic and point to the canonical source instead of duplicating low-level detail

### Requirement: Local Setup Caveats

The system MUST document local setup caveats that affect successful use, including secure session-cookie expectations, local proxy assumptions, and known session-refresh or re-login limitations.

#### Scenario: Setup doc exposes caveats
- GIVEN a developer follows onboarding locally
- WHEN they read setup and runtime notes
- THEN they can find the cookie, proxy, and session limitations that may affect local behavior

#### Scenario: Docs do not imply seamless refresh
- GIVEN session behavior has known limitations
- WHEN a reader checks local runtime guidance
- THEN the docs state the limitation and its practical effect clearly

### Requirement: Maintenance and Review Usability

The system MUST keep documentation reviewable by using short hubs, audience-based sections, explicit ownership boundaries, and doc structures that let reviewers verify completeness by reading.

#### Scenario: Reviewer can inspect completeness quickly
- GIVEN a reviewer opens the documentation set
- WHEN they compare the hub and linked docs
- THEN they can verify coverage for product, technical, canonical-boundary, and caveat topics without reconstructing the repo

#### Scenario: Maintainer sees what to update
- GIVEN product or technical behavior changes
- WHEN a maintainer checks documentation boundaries
- THEN they can determine which narrative doc and which canonical source require updates
