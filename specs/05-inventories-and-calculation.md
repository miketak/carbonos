# 05: Inventories and calculation

- **Status**: Implemented
- **Protocol**: Chapter 6 (calculating emissions: activity data × emission
  factor), Chapter 7 (inventory quality: validation before reporting)
- **Owner**: Michael Takrama
- **Created**: 2026-08-29 (views, gates, runs), 2026-08-30 (unit conversion);
  merged 2026-09-02
- **Modules**: `ghg`, `src/features/ghg` (inventories list, inventory detail:
  activity view, pre-flight checks, runs)

## Problem

An inventory is the reporting company's view of its facts for one period under
one approach. Producing a number from it has to be gated so that an incomplete
or inconsistent view cannot quietly yield a total, and the number, once
produced, has to be reproducible. This spec covers the view, the review of
facts into it, the validation gates, the calculation with unit conversion, and
the run as an immutable snapshot.

## Behaviour

### Inventories

An inventory has a name, a reporting period, an optional purpose, an optional
base year (a field only; spec 06), and a consolidation approach. Many per
organization, overlapping periods allowed: the same facts viewed under
different accounting contexts. A recalculation is a new run, never a new
inventory. Editing an inventory is API-only today; the SPA deletes and
recreates.

### Review activity data

"Review activity data" generates one **assignment** per organizational
activity record not yet reviewed: auto-excluded as `OUTSIDE_PERIOD` when the
date falls outside the period, else `OUTSIDE_BOUNDARY` when the facility is
not in the boundary, otherwise included and unclassified. The same action
re-evaluates earlier automatic exclusions and re-includes any whose reason no
longer holds (a facility since added, a period since widened); manual
exclusions are never touched. It returns `{created, updated}` and the
completeness gate warns until it has been run.

### Validation gates

Four gates recompute live; a finding is ERROR (blocks the run), WARNING
(visible, non-blocking) or INFO. A gate is BLOCKED with any error, WARNINGS with
any warning, else PASSED; the inventory is ready when no gate is blocked.

- **BOUNDARY** (spec 03): empty; draft; included activity outside the
  boundary; 0% share; drift from facility facts.
- **COMPLETENESS**: N records not reviewed; an automatic exclusion whose reason
  no longer holds; an included activity dated outside the period (ERROR); an
  included activity with no evidence reference (WARNING); estimated or
  calculated data (INFO).
- **CLASSIFICATION**: an included activity with no factor (ERROR).
- **EMISSION_FACTOR**: an activity whose unit and factor unit are neither
  dimensionally convertible nor identical (ERROR, naming both dimensions).

Given an inventory with all facts classified and the boundary frozen but one
record lacking an evidence reference, the panel reads READY TO LAUNCH with
Reporting boundary WARN, Activity data completeness WARN, Classification PASS,
Emission factors PASS: warnings never block.

### Calculation

A run is created with a label; the period and approach are the inventory's.
Creation re-validates and refuses with 409 `Validation failing` on any error.
Per included assignment:

```
share             = the frozen boundary version's share for the facility (spec 03)
conversion factor = registry ratio(activity unit → factor unit), or 1 when identical
converted qty     = quantity × conversion factor
kg CO2e           = converted qty × factor value × share, HALF_UP to 3 dp
```

Conversion is dimensional only (spec 02's registry); a custom unit reconciles
only with an identical factor unit. The run line records the original quantity
and unit, the factor's unit, the converted quantity and the conversion factor,
so the report shows the full arithmetic
(`1,250,000 US-gallon × 3.785411784 = 4,731,764.73 litre × 2.66 × 1.0000`).
Totals accumulate per scope from the rounded lines.

Given the QA scenario, twelve facts, two inventories: under operational control
the total is 35,426,443.114 kg; under equity share, from the same facts,
22,784,347.114 kg. The difference is entirely the plant at 40% and the terminal
at 30% versus 100% and 0%.

### Runs as snapshots

A run denormalizes facility name, activity type, factor name and value, scope,
category, quantity and unit, factor unit, converted quantity, conversion
factor, accounting share and kg CO2e per line, and cites the boundary version.
Runs are listed newest first; one may be designated **final** for the
inventory; deleting the final run clears the designation without promoting
another. A fact corrected after a run leaves the run unchanged and shows in
the next one.

## API

- `GET|POST /organizations/{orgId}/inventories`, `GET|PUT|DELETE /inventories/{id}`
  `{name, periodStart, periodEnd, purpose?, baseYear?, consolidationApproach}`;
  422 when the period ends before it starts.
- `GET /inventories/{id}/assignments`; `POST /inventories/{id}/assignments/sync`
  → `{created, updated}`; classify / exclude / include (spec 04).
- `GET /inventories/{id}/validation` → `{ready, gates:[{gate, status,
  findings:[{severity, message}]}]}`, gates in the fixed order BOUNDARY,
  COMPLETENESS, CLASSIFICATION, EMISSION_FACTOR.
- `GET|POST /inventories/{id}/runs` `{label}` (409 when blocked);
  `GET|DELETE /runs/{id}`; `POST /runs/{id}/finalize`.

## Data

`V6`: `ghg_inventories`, `ghg_assignments` (unique inventory + activity;
included, exclusion_reason CHECK, scope, category, factor), `ghg_runs`
re-parented to inventories with `final_run_id`. `V8__unit_conversion.sql`:
`factor_unit`, `converted_quantity`, `conversion_factor` on `ghg_run_lines`.
`V9`: `boundary_version_id` and `_no` on runs (spec 03).

## Events

`GhgRunCompleted(runId, inventoryId, totalKgCo2e)` on every run. No consumer
yet; it is the hook for reporting and notification modules.

## Verification

`GhgApiIntegrationTests`: multiple inventories per period; sync auto-exclusion
and reconciliation; the four gates; run refused while blocked; snapshot and
final designation; two inventories accounting one fact differently; US-gallon
converted to litre in the run; cross-dimension units block. `UnitConverterTest`.
Frontend: pre-flight panel, launch gating, review toast, run list. Manual:
`docs/qa/003-inventory.md` sections E to J, with hand-computed totals.

## Non-goals and open questions

- The activity view is not frozen and exclusions are not snapshotted into a
  run; the inventory has no lifecycle of its own: spec 05.1.
- Assignment-level share overrides; conversion, methodology, GWP-set and
  duplicate-detection gates; multi-gas breakdown (spec 07.1); base-year
  recalculation (spec 06).
- A frozen inventory with nothing reviewed is launchable and yields an empty
  run, since "unreviewed" is a warning by design; revisit under spec 05.1.
