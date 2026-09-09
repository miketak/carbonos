# 06: Tracking emissions over time

- **Status**: Implemented
- **Protocol**: Chapter 5 (base year, recalculation policy, structural
  changes, methodology changes)
- **Owner**: Michael Takrama
- **Created**: 2026-09-02; implemented 2026-09-08
- **Modules**: `ghg` (`BaseYear`, `BaseYearRecalculation`, `BaseYearService`),
  `src/features/ghg` (Base year page, report base-year section)

## Problem

To compare emissions meaningfully over time the Standard requires a **base
year**, a documented **recalculation policy** with a significance threshold,
and recalculation of the base year when structural changes (acquisitions,
divestments, mergers, outsourcing or insourcing), methodology changes, or the
discovery of significant errors would otherwise distort the comparison. It
also says *not* to recalculate for organic growth or decline, nor for
acquiring facilities that did not exist in the base year. CarbonOS had an
optional `baseYear` integer on the inventory connected to nothing.

## Behavior

- An organization designates a **base year**: the inventory that established
  it (its period's year is the base year, its final run the base-year figure),
  and records a **recalculation policy**: the reason for choosing that year,
  the significance threshold (for example 5% of base-year emissions), and the
  convention for mid-year structural changes (spec 06.1). All three of
  Chapter 5's triggers are honored: structural changes are detected at
  freeze, methodology changes and error corrections are raised by the
  accountant.
- Freezing any other inventory of the organization measures the new boundary
  version against the version before it (or, for a first freeze, the
  base-year inventory's boundary under the same approach). A facility added or
  removed, or a membership window changed (spec 03.2), is a candidate
  structural change. The affected facilities are weighed by their base-year
  emissions (from the base run's lines) as a percent of the base-year total;
  when that is above zero a recalculation candidate is **flagged** with the
  reason recorded, marked above or below the threshold. Facilities that
  emitted nothing in the base year (they did not exist) never flag, and
  neither does organic growth, because nothing structural changed. Each
  candidate is weighed on its own and together with the outstanding earlier
  ones (spec 06.1).
- The accountant **decides** each flag: `RECALCULATED`, naming a run of the
  base-year inventory that is now the recalculated base and carries the
  reason and the triggering version, or `DECLINED` with a note. Earlier runs
  are kept, so the original and recalculated base years are both readable.
- The BASE_YEAR validation gate lists unresolved flags on every inventory of
  the organization: an ERROR when the flag is above the threshold (except on
  the base-year inventory itself, whose run is how a recalculation is made),
  otherwise a WARNING.
- The report (spec 07.1) shows the current period against the base year with
  the recalculation history.

Given Sankofa's 2024 base year (27,930 kg, of which Takoradi 1,330 kg) and a
2025 inventory frozen without Takoradi: the version flags "structural change:
Takoradi Port Loadout removed; 4.76% of base-year emissions, below the 5%
threshold, recalculation optional". The accountant records the decision either
way.

## API

- `GET /organizations/{id}/base-year` → `{id, inventoryId, inventoryName,
  year, thresholdPercent, reason, structuralChangeConvention, baseRunId,
  recalculations[]}` or 204 when none; `PUT` `{inventoryId,
  thresholdPercent, reason, structuralChangeConvention?}`; `DELETE`.
- `POST /organizations/{id}/base-year/recalculations/{recId}/decide`
  `{decision: RECALCULATED|DECLINED, runId?, note?}`; 409 when a recalculated
  base is not a run of the base-year inventory.
- Validation gains the `BASE_YEAR` gate; the run report carries a `baseYear`
  section with the original and recalculated base figures.

## Data

`V14__base_year.sql`: `ghg_base_years` (organization unique, inventory,
threshold) and `ghg_base_year_recalculations` (trigger type, reason,
triggering inventory, boundary version, affected percent, above threshold,
status, run, decision note, decided by, decided at). `V18` (spec 06.1) adds
the reason and the convention and removes the trigger switches.

## Events

None.

## Verification

`GhgApiIntegrationTests.structuralChangesAreFlaggedAgainstTheBaseYearThreshold`:
a below-threshold divestment flags as optional and warns, a tighter threshold
makes the next candidate blocking, declining and recalculating (with a run of
the base year, refusing another inventory's run) resolve the gate, and the
report shows both base-year figures.
`aFacilityThatDidNotExistInTheBaseYearIsOrganicGrowthNotAStructuralChange`.
Frontend: `BaseYearPage.test.tsx`, `RunDetailPage.test.tsx`.

## Non-goals and open questions

Automatic recalculation arithmetic (a recalculated base is a run the
accountant launches); targets against the base year (Chapter 11). The
reason, the mandatory triggers, the cumulative threshold, the convention, the
GWP check and the profile over time are spec 06.1.
