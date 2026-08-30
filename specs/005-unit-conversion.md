# 005 — Unit conversion for activity data

- **Status**: Implemented
- **Owner**: Michael Takrama
- **Created**: 2026-08-30
- **Backend module(s)**: `ghg`
- **Frontend feature(s)**: `src/features/ghg`
- **Relates to**: [003 — Inventory accounting model](003-inventory-accounting-model.md)
  (this refines the calculation step of invariant 3)

## Problem / Motivation

Until now an activity had to be recorded in the _exact same unit string_ as the
emission factor it would be classified with; any difference hard-blocked the
run. Real-world data arrives in whatever unit the meter or bill uses — gallons,
MWh, short tons — so accountants were forced to hand-convert before entry. That
is error-prone and breaks the audit trail: the recorded fact no longer matches
the source document.

## Behaviour

1. **Facts are recorded in their native unit.** The activity-entry form offers a
   unit picker grouped by physical dimension (Energy, Volume, Mass, Distance,
   Passenger-distance) and still accepts a typed **custom unit** for anything the
   registry does not cover.
2. **Classification converts, within a dimension.** When an included activity is
   classified, the system converts its quantity into the factor's unit using
   pure dimensional conversion (e.g. `10,000 US-gallon → 37,854.12 litre`), then
   computes `converted quantity × factor × accounting share`. The classify UI
   offers factors whose unit shares the activity's dimension and previews the
   conversion inline.
3. **Conversion is dimensional only.** Units convert only within the same
   physical quantity. Cross-type conversions that depend on a substance (natural
   gas m³ ↔ kWh via calorific value, fuel volume ↔ mass via density) are **out of
   scope** — the accountant handles those by choosing a factor already in that
   unit. (A future phase may add per-fuel properties.)
4. **Custom/unrecognized units never auto-convert.** They reconcile only with a
   factor of the identical unit string; otherwise the run is blocked.
5. **Fail-safe.** When an activity's unit and its factor's unit are neither
   dimensionally convertible nor identical, the EMISSION_FACTOR validation gate
   raises an error naming the two dimensions, and the run is refused (409) — the
   system never silently produces a wrong number.
6. **Runs stay faithful snapshots.** A run line records the original recorded
   quantity and unit, the factor's unit, the converted quantity, and the
   conversion factor, so the report shows the full arithmetic
   (`10,000 US-gallon × 3.785412 = 37,854.12 litre × 2.66 × 0.8`).

## Unit registry

Conversions are physical constants held in reviewed code (`UnitConverter`), not a
runtime table. Two units convert only when they share a `Dimension`. Each
seeded factor unit must be registered — a test enforces it. Every unit carries
aliases so `L`, `litre`, and `litres` resolve to one unit.

| Dimension           | Canonical base | Registered units |
| ------------------- | -------------- | ---------------- |
| ENERGY              | kWh            | kWh, MWh, GWh, GJ, MJ, therm |
| VOLUME              | m³             | m³, litre, US-gallon, UK-gallon |
| MASS                | kg             | kg, tonne, g, lb, short-ton |
| DISTANCE            | km             | km, mile, m |
| PASSENGER_DISTANCE  | passenger-km   | passenger-km, passenger-mile |

## Out of scope

- Substance-specific conversion (calorific value, density).
- User-editable unit definitions (the registry is code-owned).

## Verification

- `UnitConverterTest` — dimensional conversions, alias/case normalization,
  cross-dimension and unknown-unit refusal, seeded-unit coverage.
- `GhgApiIntegrationTests` — a US-gallon activity classified with a per-litre
  factor computes the converted total and snapshots both quantities; a kg
  activity against a per-litre factor blocks the run; every seeded factor unit is
  registered.
- Frontend `units.test.ts` plus the inventory workspace test cover the grouped
  picker, the dimension filter, and the inline conversion preview.
