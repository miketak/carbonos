# 04: Operational boundary and classification

- **Status**: Implemented
- **Protocol**: Chapter 4 (setting operational boundaries: scope 1, 2, 3)
- **Owner**: Michael Takrama
- **Created**: 2026-08-29; merged 2026-09-02; scope as a decision 2026-09-08
- **Modules**: `ghg` (emission-factor library, assignments), `src/features/ghg`
  (activity view, emission factors page)

## Problem

Having decided *which* operations are in (spec 03), the company decides
*which emissions* of those operations it accounts for and how they are
categorised: direct emissions from owned or controlled sources (scope 1),
indirect emissions from purchased electricity, heat and steam (scope 2), and
other indirect emissions in the value chain (scope 3). Every included activity
record must end up in exactly one scope and category with an emission factor
that turns its quantity into CO2e.

## Behaviour

### Scopes and categories

| Scope | Standard's definition | Categories in CarbonOS today |
| --- | --- | --- |
| 1 | Direct emissions from sources the company owns or controls | STATIONARY_COMBUSTION, MOBILE_COMBUSTION, PROCESS_EMISSIONS, FUGITIVE_EMISSIONS |
| 2 | Indirect emissions from the generation of purchased electricity, heat and steam consumed by the company | PURCHASED_ELECTRICITY, PURCHASED_HEAT_STEAM |
| 3 | Other indirect emissions, a consequence of the company's activities but from sources it does not own or control | The Scope 3 Standard's fifteen categories, from PURCHASED_GOODS_SERVICES to INVESTMENTS, plus WATER_SUPPLY for the seeded factor |

Each category belongs to exactly one scope (spec 04.1).

### The emission-factor library

A shared, read-only, seeded library. Each factor has a name, a **default**
scope and category (a suggestion; spec 04.1), whether it is scope-agnostic,
unit, value in kg CO2e per unit, per-gas components (spec 07.1), and source.
Sixteen are seeded (DEFRA 2025, IPCC AR5 GWP100, IPCC 2006 process factors,
and an Ecoriv Ghana grid factor), spanning natural gas, LPG, diesel, petrol,
R-410A leakage, Ghana and UK grid electricity, district heat, car and
long-haul flight travel, bus commuting, landfill waste, water supply, ANFO
explosives, quicklime calcination and wood pellets. Values are close to published figures and explicitly approximate; a
curated library replaces the seed before production use. New factors require a
migration; there is no runtime editor.

### Classification

An assignment (spec 05) is classified by choosing an emission factor **and
the scope and category** the company's relationship to the source dictates;
they default from the factor, and a lease type derives them per Appendix F
(spec 04.1). The picker offers factors whose unit
shares the fact's physical dimension (so a US-gallon fact sees per-litre and
per-m3 factors) and previews the conversion inline, e.g.
`1,250,000 US-gallon → 4,731,764.73 litre × 2.66 kg CO₂e/litre`. A fact in a
custom, unregistered unit matches only a factor with the identical unit string
and never auto-converts; when nothing matches, the picker shows every factor
and the EMISSION_FACTOR gate refuses the run if an incompatible one is chosen.

Given the QA scenario's ANFO explosives recorded in "tonne ANFO": no factor
matches a custom unit, and choosing "Waste to landfill (/tonne)" produces
the blocking finding
`'ANFO explosives consumed' is recorded in tonne ANFO (unrecognized) but its factor 'Waste to landfill' is per tonne (mass)`.
Recorded in tonnes, the ANFO detonation factor classifies it as a scope 1
process emission.

### Exclusion

An included assignment may instead be excluded with a documented reason:
outside reporting period, outside boundary, non-GHG activity, duplicate, not
applicable, methodology exclusion, other documented reason. Exclusions are
retained (auditability) and reversible.

## API

- `GET /api/ghg/emission-factors` → `{id, name, defaultScope,
  defaultCategory, scopeAgnostic, unit, dimension, kgCo2ePerUnit, gases,
  biogenicCo2KgPerUnit, gwpSet, source}[]`, session required, shared across
  tenants.
- `PUT /api/ghg/assignments/{id}/classify` `{emissionFactorId, scope?,
  category?, leaseType?}` → the assignment with `scope`, `category` and
  `leaseType` set; 409 for a category of another scope.
- `PUT /api/ghg/assignments/{id}/exclude` `{reason}`; `PUT .../include`.

## Data

`ghg_emission_factors` and its seed in `V4`; `ghg_assignments.scope`,
`category`, `emission_factor_id`, `exclusion_reason` in `V6`; `default_scope`,
`default_category`, `scope_agnostic`, `lease_type` and the process factors in
`V13`; per-gas components in `V15`.

## Events

None.

## Verification

`GhgApiIntegrationTests`: classification defaults scope and category from
the factor without touching the fact, and the accountant may choose
otherwise; unit mismatch blocks; every seeded factor unit is registered. Frontend: dimension-filtered picker, conversion preview, exclusion
menu. Manual: `docs/qa/003-inventory.md` section F.

## Non-goals and open questions

- A runtime factor editor; automatic scope inference from metadata.
