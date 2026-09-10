---
owner: miketak
last_reviewed: 2026-09-09
---

# Architecture

CarbonOS is a modular monolith: one Spring Boot process with strict
internal boundaries, one React single-page application in front of it, one
PostgreSQL database behind it, and an S3-compatible bucket for files. This
page explains why it is shaped that way and how a request moves through it.

## System context

```mermaid
flowchart LR
    accTitle: CarbonOS in its context
    accDescr: Accountants, reviewers and verifiers use the SPA; it talks to the Spring Boot backend, which stores facts in Postgres, files in an S3-compatible bucket, and sends mail over SMTP. GitHub Actions deploys both to Railway.
    users["GHG accountant,\nreviewer, verifier"] --> spa["React SPA"]
    spa -- "JSON over HTTPS, session cookie" --> api["Spring Boot\nmodular monolith"]
    api --> db[("PostgreSQL")]
    api --> s3["S3-compatible bucket\n(evidence, avatars)"]
    api --> smtp["SMTP"]
    ci["GitHub Actions"] -. "deploys" .-> spa
    ci -. "deploys" .-> api
```

## Why one process with hard walls

A greenhouse gas inventory is one consistent ledger: an emission figure is
only defensible when the record, the factor, the boundary share, and the
run that combined them can be shown together. Splitting that across
services would trade a transaction for a saga and make every verifier
question harder to answer. So the backend is one deployable and one
database.

The walls come from Spring Modulith. Each business capability is a
top-level package; its public API is the root package and everything
under `internal/` is private. `ModularityTests` fails the build when a
module imports another's internals, and modules talk through application
events where they can. The result is a codebase that can be split later
if it ever needs to be, without paying for the split now. See
[Backend modules](../reference/backend-modules.md) for the modules and
their events.

## Facts, views, computations

The domain model separates three kinds of thing, and most of the product's
rules follow from keeping them apart.

```mermaid
flowchart TB
    accTitle: Facts, views and computations
    accDescr: An organization owns legal entities, facilities and activity records as facts, a base year as policy, and inventories as views over those facts; each inventory holds boundary treatments and activity assignments, and calculation runs compute lines from a frozen view.
    org["Organization"]
    facts["Facts: legal entities, facilities,\nactivity records, evidence"]
    policy["Policy: base year and\nrecalculation policy"]
    inv["Views: inventories\n(draft, frozen, final, published)"]
    treat["Boundary treatments\nand versions"]
    assign["Activity assignments,\ndeclaration, instruments"]
    runs["Computations: runs\nwith lines and exclusions"]
    org --> facts
    org --> policy
    org --> inv
    inv --> treat
    inv --> assign
    inv --> runs
    facts -. "read, never changed by a view" .-> assign
```

- **Facts** are what happened: a legal entity with its ownership, a
  facility, ten thousand litres of diesel in June with an invoice attached.
  Facts belong to the organization, not to any inventory. Correcting a fact
  needs a reason and keeps the history; removing one leaves a tombstone.
- **Views** are accounting decisions over the facts for one reporting
  period under one consolidation approach: which entities are in the
  boundary and at what share, how each record is classified, which
  instruments apply. Two inventories can view the same facts differently,
  which is how an equity-share view and an operational-control view coexist.
- **Computations** are runs. A run reads a frozen view, applies the factors
  and shares, and writes its lines as a snapshot that never changes. A
  later fact correction produces a new run, not a changed one; a published
  report is stored as it was read.

This is why an inventory must be frozen before it can run, why runs are
numbered and never reused, and why a correction after publication is a new
inventory that supersedes the old one. The
[inventory lifecycle](inventory-lifecycle.md) walks through those states.

## A request, end to end

```mermaid
sequenceDiagram
    accTitle: Freezing an inventory, from click to database
    accDescr: The SPA calls the API through the fetch wrapper, the controller validates the DTO, the service applies the rule inside a transaction and publishes an event, and errors come back as RFC 9457 problem details.
    participant B as Browser (SPA)
    participant W as api() wrapper
    participant C as InventoryController
    participant S as InventoryService
    participant D as PostgreSQL
    B->>W: freeze(inventoryId)
    W->>C: POST /api/ghg/inventories/{id}/freeze (cookie, X-XSRF-TOKEN)
    C->>S: freeze(id, actor)
    S->>D: load inventory, cut boundary version, write audit event
    D-->>S: committed
    S-->>C: BoundaryVersion
    C-->>W: 200 BoundaryVersionResponse
    W-->>B: typed result, query cache invalidated
    Note over C,W: A rule violation returns 409 and a field error 422,<br/>both as application/problem+json
```

Three things in that path are deliberate. The browser never builds a
request itself; `api()` in `src/lib/api.ts` adds credentials and the
CSRF token and turns a problem detail into a typed error that forms can
print inline. The controller speaks records, never entities, so the wire
format cannot drift with the schema by accident. And the service is the
only place a rule lives: the controller does not know that a frozen
inventory refuses writes, and neither does the SPA; it learns from the 409.

## What is deliberately not here

No message broker, no cache, no second database, no microservices, no
server-side rendering. Each would solve a problem the product does not
have yet. The decision records under `docs/adr/` are where such a change
would be argued.
