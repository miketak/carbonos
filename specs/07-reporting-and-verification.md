# 07: Reporting and verification

- **Status**: Implemented
- **Protocol**: Chapter 9 (reporting GHG emissions), Chapter 10 (verification)
- **Owner**: Michael Takrama
- **Created**: 2026-08-29 (run report), 2026-09-02 (boundary version card);
  merged 2026-09-02
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

A run is read as the inventory report for its period: the run label, the
approach, a FINAL pill when designated, the period and line count; total
emissions and the scope 1, 2, 3 breakdown; the **boundary version** the run
computed from (its number, the approach, who froze it and when, and every
facility in scope with ownership, controls and share, including facilities
that emitted nothing); and the **snapshot lines**: facility, source and
category, scope, quantity with the conversion shown
(`1,250,000 US-gallon → 4,731,764.73 litre`), factor, weight (the accounting
share), and CO2e. A run older than versioning says so instead of citing a
version.

The organization overview shows the headline of the latest final run: total,
scope bars, top facilities.

### Traceability

Reported CO2e → run → boundary version → the full set of in-scope facilities
and shares; and reported CO2e → run line → assignment → emission factor →
activity record → evidence reference. Nothing on the second chain can be
deleted once a run references it (spec 02), and nothing on either chain is
rewritten by later edits.

### What a verifier can do today

- Open any run and read the boundary version and snapshot lines in full.
- Open the inventory's version history and expand any version to see the
  boundary exactly as frozen, with the freezer's identity.
- Compare two inventories over the same facts under different approaches.
- Follow the manual verification script `docs/qa/003-inventory.md`, whose
  expected totals are computed independently of the engine.

A verifier is a signed-in user of the organization; there is no verifier role
yet (spec 01 non-goals).

## API

`GET /api/ghg/runs/{id}` → `{run, lines}` with the run carrying
`boundaryVersionId`/`No`; `GET /api/ghg/boundary-versions/{id}`.

## Data

No tables of its own; the report reads `ghg_runs`, `ghg_run_lines`,
`ghg_boundary_versions` and entries.

## Events

`GhgRunCompleted` is the hook for a future notification or export consumer.

## Verification

`RunDetailPage.test.tsx`: the report with the share applied, the boundary
card including a facility with no line, the pre-versioning message.
`OverviewPage.test.tsx`. Manual: `docs/qa/003-inventory.md` sections H, I, J.

## Non-goals and open questions

Everything Chapter 9 requires that the report does not yet contain (each gas,
biogenic CO2, scope 2 dual reporting, the operational boundary declaration,
exclusions, base year, methodology statement): spec 07.1. Export to PDF or CSV.
An assurance statement or a verifier role.
