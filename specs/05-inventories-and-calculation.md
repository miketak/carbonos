# 05: Inventories and calculation

- **Status**: Implemented
- **Protocol**: Chapter 6 (calculating emissions: activity data × emission
  factor), Chapter 7 (inventory quality: validation before reporting)
- **Owner**: Michael Takrama
- **Created**: 2026-08-29 (views, gates, runs), 2026-08-30 (unit conversion);
  merged 2026-09-02; lifecycle, gases and market-based scope 2 2026-09-08
- **Modules**: `ghg`, `src/features/ghg` (inventories list, inventory detail:
  activity view, pre-flight checks, runs)

## Problem

An inventory is the reporting company's view of its facts for one period under
one approach. Producing a number from it has to be gated so that an incomplete
or inconsistent view cannot quietly yield a total, and the number, once
produced, has to be reproducible. This spec covers the view, the review of
facts into it, the validation gates, the calculation with unit conversion, and
the run as an immutable snapshot.

## Behavior

### Inventories

An inventory has a name, a reporting period, an optional purpose, a
consolidation approach, a reporting set of global warming potentials (GWP;
IPCC AR5 by default, spec 07.1), an operational boundary declaration (spec
07.1) and a lifecycle: DRAFT, FROZEN,
FINAL, PUBLISHED (spec 05.1). Many per organization, overlapping periods
allowed: the same facts viewed under different accounting contexts. A
recalculation is a new run, never a new inventory; a correction to a
published inventory is a new inventory that supersedes it. Editing an
inventory's name, period and approach is API-only today; the single-page app (SPA)
deletes and recreates.

### Review activity data

**Review activity data** (draft inventories only) generates one **assignment**
per organizational activity record not yet reviewed. A record dated outside
the period is auto-excluded as `OUTSIDE_PERIOD`. A record whose facility is
not in the boundary, whose entity has a 0% share under the approach, or whose
date is outside the membership window is auto-excluded as `OUTSIDE_BOUNDARY`,
with the reason in words. Every other record is included and unclassified.
The same action re-evaluates earlier automatic exclusions and re-includes any
whose reason no longer holds, such as a facility since added or a period since
widened. Manual exclusions are never touched. The action returns
`{created, updated}`, and the completeness gate warns until it has been run.

### Validation gates

Five gates recompute live; a finding is ERROR (blocks the run), WARNING
(visible, non-blocking) or INFO. A gate is BLOCKED with any error, WARNINGS with
any warning, else PASSED; the inventory is ready when no gate is blocked.

- **BOUNDARY** (spec 03): empty; draft; included activity outside the
  boundary; 0% share; drift from entity facts; partial-period membership.
- **COMPLETENESS**: N records not reviewed; an automatic exclusion whose reason
  no longer holds; an included activity dated outside the period (ERROR); an
  included activity with no evidence reference (WARNING); estimated or
  calculated data (INFO).
- **CLASSIFICATION**: an included activity with no factor (ERROR); a scope
  incompatible with an inherent-scope factor (ERROR); a scope that departs
  from the factor's default (WARNING) (spec 04.1).
- **EMISSION_FACTOR**: an activity whose unit and factor unit are neither
  dimensionally convertible nor identical (ERROR, naming both dimensions); a
  scope 2 record at a facility with a market-based factor that cannot convert
  to kWh (WARNING).
- **BASE_YEAR** (spec 06): an unresolved recalculation flag (ERROR above the
  threshold, else WARNING).

Given an inventory with all facts classified and the boundary frozen but one
record lacking an evidence reference, the panel reads READY TO LAUNCH with
Reporting boundary WARN, Activity data completeness WARN, Classification PASS,
Emission factors PASS, Base year PASS: warnings never block.

### Calculation

A run is created with a label; the period, approach and GWP set are the
inventory's, which must be FROZEN or FINAL. Creation re-validates and refuses
with 409 `Validation failing` on any error. Per included assignment:

```
share             = the frozen boundary version's share for the facility on the activity's date (spec 03)
conversion factor = registry ratio(activity unit → factor unit), or 1 when identical
converted qty     = quantity × conversion factor
factor value      = Σ gas component × GWP(set), or the source CO2e when no split (spec 07.1)
kg CO2e           = converted qty × factor value × share, HALF_UP to 3 dp
kg per gas        = converted qty × gas component × share, HALF_UP to 3 dp (biogenic CO2 alike)
market-based      = kWh × market factor × share for scope 2 lines at a facility with an instrument
```

Conversion is dimensional only (spec 02's registry); a custom unit reconciles
only with an identical factor unit. The run line records the original quantity
and unit, the factor's unit, the converted quantity and the conversion factor,
so the report shows the full arithmetic
(`1,250,000 US-gallon × 3.785411784 = 4,731,764.73 litre × 2.66 × 1.0000`).
Totals accumulate per scope, per gas, and for market-based scope 2 from the
rounded lines. A factor's CO2e excludes biogenic CO2, as Chapter 4 requires:
the biomass factor carries only its CH4 and N2O into scope 1 and its CO2 into
the biogenic column (spec 07.1). Every excluded assignment is snapshotted beside the lines with
its reason (spec 05.1).

Given the QA scenario, twelve facts, two inventories: under operational control
the total is 35,426,443.114 kg; under equity share, from the same facts,
22,784,347.114 kg. The difference is entirely the plant at 40% and the terminal
at 30% versus 100% and 0% (under operational control the terminal's records
are excluded as outside the boundary rather than carried at 0%).

### Runs as snapshots

A run denormalizes facility id and name, activity type, factor name and
value, scope, category, lease type, quantity and unit, factor unit, converted
quantity, conversion factor, accounting share, kg CO2e, kg per gas, biogenic
CO2 and the market-based figure per line, plus every exclusion, and cites the
boundary version. Runs are listed newest first; one may be designated
**final** for the inventory, which moves it to FINAL. Runs are numbered and
never deleted; a run is voided with a reason (spec 05.2). A fact corrected after
a run leaves the run unchanged and shows in the next one.

## API

- `GET|POST /organizations/{orgId}/inventories`, `GET|PUT|DELETE /inventories/{id}`
  `{name, periodStart, periodEnd, purpose?, baseYear?, consolidationApproach,
  gwpSet?}`; 422 when the period ends before it starts; 409 when the period,
  approach or GWP set changes while frozen, or on any change once published.
- Lifecycle: `POST /inventories/{id}/freeze|reopen|finalize|withdraw-final|publish|supersede`
  (spec 05.1).
- `GET /inventories/{id}/assignments`; `POST /inventories/{id}/assignments/sync`
  → `{created, updated}`; classify / exclude / include (spec 04). All 409
  unless the inventory is a draft.
- `GET /inventories/{id}/validation` → `{ready, gates:[{gate, status,
  findings:[{severity, message}]}]}`, gates in the fixed order BOUNDARY,
  COMPLETENESS, CLASSIFICATION, EMISSION_FACTOR, BASE_YEAR.
- `GET|POST /inventories/{id}/runs` `{label}` (409 when blocked or not
  frozen); `GET /runs/{id}` → `{run, lines, exclusions}`; `POST /runs/{id}/void` `{reason}` (spec 05.2);
  `POST /runs/{id}/finalize`; `GET /runs/{id}/report` (spec 07.1).

## Data

`V6`: `ghg_inventories`, `ghg_assignments` (unique inventory + activity;
included, exclusion_reason CHECK, scope, category, factor), `ghg_runs`
re-parented to inventories with `final_run_id`. `V8__unit_conversion.sql`:
`factor_unit`, `converted_quantity`, `conversion_factor` on `ghg_run_lines`.
`V9`: `boundary_version_id` and `_no` on runs (spec 03). `V12`: `status`,
`ghg_run_exclusions`, `facility_id` on lines. `V13`: `lease_type`. `V15`:
`gwp_set`, per-gas, biogenic and market-based columns on runs and lines.

## Events

`GhgRunCompleted(runId, inventoryId, totalKgCo2e)` on every run and
`InventoryPublished(inventoryId, runId)` on publication. No consumer yet;
they are the hooks for reporting and notification modules.

## Verification

`GhgApiIntegrationTests`: multiple inventories per period; sync auto-exclusion
and reconciliation; the four gates; run refused while blocked; snapshot and
final designation; two inventories accounting one fact differently; US-gallon
converted to litre in the run; cross-dimension units block. `UnitConverterTest`.
Frontend: pre-flight panel, launch gating, review toast, run list. Manual:
`docs/qa/003-inventory.md` sections E to J, with hand-computed totals.

## Non-goals and open questions

- Assignment-level share overrides; conversion, methodology and
  duplicate-detection gates.
- A frozen inventory with nothing reviewed is launchable and yields an empty
  run, since "unreviewed" is a warning by design.
