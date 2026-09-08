# 07: Reporting and verification

- **Status**: Implemented
- **Protocol**: Chapter 9 (reporting GHG emissions), Chapter 10 (verification)
- **Owner**: Michael Takrama
- **Created**: 2026-08-29 (run report), 2026-09-02 (boundary version card);
  merged 2026-09-02; Chapter 9 report 2026-09-08
- **Modules**: `src/features/ghg` (run detail, overview dashboard, boundary
  version history); `docs/qa`

## Problem

The point of the inventory is a report someone else can rely on. Chapter 9
lists what a report must contain; Chapter 10 describes what a verifier does:
assess the boundary, completeness and the data trail, and form an opinion on
whether the reported figures are free of material misstatement. This spec
covers what CarbonOS reports today, how a reader traces a figure to its
sources, and how a verifier can examine it.

## Behaviour

### The run report

A run is read as the inventory report for its period, in the order Chapter
9 lists the required elements (spec 07.1): the company and the **boundary
version** the run computed from (its number, the approach, who froze it and
when, and every entity in scope with its Table 1 facts, share, window and
facilities, including entities that emitted nothing and those recorded as
excluded); the operational boundary declaration; the period and the
inventory's status; emissions by scope, with scope 2 location-based and
market-based side by side where instruments exist; each of the seven gases;
biogenic CO2 outside the scopes; the base year with its recalculation
history; the methodology statement; the **exclusions** grouped by reason;
and the **snapshot lines**: facility, source and category, scope, quantity
with the conversion shown (`1,250,000 US-gallon → 4,731,764.73 litre`),
factor, weight (the accounting share), and CO2e. A run older than versioning
says so instead of citing a version.

The organization overview shows the headline of the latest final run: total,
scope bars, top facilities.

### Traceability

Reported CO2e → run → boundary version → the full set of in-scope entities,
facilities and shares; and reported CO2e → run line → assignment → emission
factor → activity record → evidence reference; and every exclusion → run
exclusion → activity record. Nothing on the second chain can be deleted once
a run references it (spec 02), nothing on any chain is rewritten by later
edits, and a published inventory cannot change at all (spec 05.1).

### What a verifier can do today

- Open any run and read the Chapter 9 report, the boundary version, the
  exclusions and the snapshot lines in full.
- Open the inventory's version history and expand any version to see the
  boundary exactly as frozen, with the freezer's identity.
- Compare two inventories over the same facts under different approaches.
- Follow the manual verification script `docs/qa/003-inventory.md`, whose
  expected totals are computed independently of the engine.

A verifier is a signed-in user of the organization; there is no verifier role
yet (spec 01 non-goals).

## API

`GET /api/ghg/runs/{id}` → `{run, lines, exclusions}` with the run carrying
`boundaryVersionId`/`No`; `GET /api/ghg/runs/{id}/report` → the Chapter 9
composite (spec 07.1); `GET /api/ghg/boundary-versions/{id}`.

## Data

No tables of its own; the report reads `ghg_runs`, `ghg_run_lines`,
`ghg_run_exclusions`, `ghg_boundary_versions` and entries, `ghg_base_years`
and `ghg_market_factors`.

## Events

`GhgRunCompleted` and `InventoryPublished` are the hooks for a future
notification or export consumer.

## Verification

`RunDetailPage.test.tsx`: the report with the share applied, the boundary
card including an entity with no line, scope 2 both ways, the gases, the
declaration and grouped exclusions, the pre-versioning message.
`OverviewPage.test.tsx`. `GhgApiIntegrationTests`: the report endpoint.
Manual: `docs/qa/003-inventory.md` sections H, I, J.

## Non-goals and open questions

Export to PDF or CSV. An assurance statement or a verifier role.
