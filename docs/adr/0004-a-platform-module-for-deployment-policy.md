---
status: accepted
date: 2026-09-14
decision-makers: miketak
owner: miketak
last_reviewed: 2026-09-14
---

# 0004: A leaf `platform` module for deployment policy

## Context and problem statement

Spec 01.5 gives the platform operator two settings: how long support access
lasts, and who may create a reporting organization. Both were constants in
Java. The `ghg` module has to read them, the administration panel has to
write them, and CarbonOS enforces its module boundaries with
`ModularityTests`, which fails the build on a dependency cycle. Where the
settings live decides whether the graph stays acyclic.

The same question covers the panel's landing figures, which span accounts in
`user` and organizations and factor packs in `ghg`.

## Considered options

- **`shared`**: barred. CLAUDE.md and `shared/package-info.java` both reserve
  it for cross-cutting infrastructure, and a rule about who may create an
  organization is business behavior.
- **`user`**: mechanically fine, since `ghg` already depends on `user`, but a
  lie about what the module owns. It owns accounts and access requests;
  neither setting is about an account.
- **`ghg`**: the GHG accounting module would own the platform's deployment
  policy, and a later setting read by `user` would need `user -> ghg`, a
  cycle.
- **A new `platform` module that also serves the panel's summary**: a cycle.
  `ghg -> platform` to read the settings, `platform -> ghg` to count
  organizations.
- **A new leaf `platform` module, with the summary split per module**: the
  chosen option.

## Decision outcome

Chosen option: a new `com.carbonos.platform` module that owns
`platform_settings` and `platform_setting_changes`, exposes
`PlatformSettings` as its whole public API, and **never depends on `ghg`**.
It takes only `AuthenticatedUser` from `user`, which depends on nothing, so
`ghg -> platform -> user` is a directed acyclic graph.

The landing figures stay **two endpoints**, `/api/admin/summary/accounts`
from `user` and `/api/admin/summary/platform` from `ghg`, composed in the
browser. One combined endpoint would have to live in `ghg` (hosting it in
`user` is a cycle) and would need a new public summary contract on `user`
whose only consumer is a dashboard. Widening a module's public API for a UI
convenience is the wrong trade; each module counting what it owns is not.

### Consequences

- Good: the graph stays acyclic by construction, and a second reader of the
  settings needs no rearrangement. `ModularityTests` gained a case asserting
  `platform` does not depend on `ghg`, so the cycle cannot be reintroduced by
  accident.
- Good: every setting change is recorded with its reason in the module that
  owns it, which is the artifact a verifier asks for.
- Bad: adding a setting costs a column and a migration, because the table is
  typed rather than a key/value bag. That is deliberate: Hibernate validates
  the schema at startup and a CHECK keeps a bad window out of the database as
  well as out of the service.
- Bad: the dashboard makes two requests instead of one. They are issued
  together and rendered together, so the page still has one loading state.
