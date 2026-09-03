# 06: Tracking emissions over time

- **Status**: Draft
- **Protocol**: Chapter 5 (base year, recalculation policy, structural
  changes, methodology changes)
- **Owner**: Michael Takrama
- **Created**: 2026-09-02
- **Modules**: `ghg`, `src/features/ghg`

## Problem

To compare emissions meaningfully over time the Standard requires a **base
year**, a documented **recalculation policy** with a significance threshold,
and recalculation of the base year when structural changes (acquisitions,
divestments, mergers, outsourcing or insourcing), methodology changes, or the
discovery of significant errors would otherwise distort the comparison. It
also says *not* to recalculate for organic growth or decline, nor for
acquiring facilities that did not exist in the base year. CarbonOS today has
an optional `baseYear` integer on the inventory, accepted by the API, shown
nowhere, connected to nothing.

## Behaviour

- An organization designates a **base year** (or a base period average) with
  the inventory that established it, and records a **recalculation policy**:
  the significance threshold (e.g. 5% of base-year emissions) and the
  triggers it honours.
- A boundary version (spec 03) that adds or removes a facility or entity, or a
  membership window (spec 03.2), is a candidate structural change. When the
  affected facilities' base-year emissions exceed the threshold, the base year
  is **flagged for recalculation** with the reason recorded; organic changes
  never flag.
- A run over the base year inventory that is designated the **recalculated
  base** carries the reason and the version that triggered it. Earlier runs
  are kept, so the original and recalculated base years are both readable.
- The report (spec 07) shows the current period against the base year with
  the recalculation history.

Given Sankofa's 2024 base year and the Takoradi acquisition on 1 July 2025:
the v2 boundary version adding Takoradi flags 2024 for recalculation
("structural change: Takoradi Port Loadout added; 4.1% of base-year emissions,
below the 5% threshold, recalculation optional"). The accountant records the
decision either way.

## API

Sketch: `PUT /organizations/{id}/base-year` `{inventoryId, policy}`;
`GET /organizations/{id}/base-year` with the recalculation history; validation
gains a BASE_YEAR finding when a flag is unresolved.

## Data

`ghg_base_years(organization_id, inventory_id, threshold, triggers, ...)` and
`ghg_base_year_recalculations(reason, boundary_version_id, run_id, decided_by,
decided_at)`.

## Events

None.

## Verification

Integration tests for flag and no-flag cases around the threshold; the report
showing both base-year figures.

## Non-goals and open questions

Automatic recalculation arithmetic (a recalculated base is a run the
accountant launches); targets against the base year (Chapter 11).
