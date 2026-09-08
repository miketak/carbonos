# 02: Organization and facts

- **Status**: Implemented
- **Protocol**: Chapter 6 (identifying sources and collecting activity data),
  Chapter 7 (inventory quality: data quality, evidence)
- **Owner**: Michael Takrama
- **Created**: 2026-08-29; facility control facts 2026-09-02; merged 2026-09-02;
  legal entities 2026-09-08
- **Modules**: `ghg`, `src/features/ghg` (organizations, legal entities,
  facilities, activity data, emission factors, units)

## Problem

Before any accounting decision can be made, the reporting company has to be
described as it is: which organization, which facilities, what happened at
them, in what quantities, on what evidence. The Standard calls this activity
data and asks that its quality be known (Chapter 7). This spec covers the
*facts* side of the model, deliberately free of any accounting treatment: no
scope, no factor, no boundary decision lives here.

## Behaviour

### Organizations

An organization is a reporting company: a unique name (case-insensitive) and
an owner (spec 01). It is the tenant boundary for everything below. Deleting
an organization cascades to all of it.

### Legal entities and their facts

Between the organization and its facilities sit the **legal entities** it
consolidates (spec 03.1): the reporting company itself (created with the
organization, wholly owned, the default for facilities) and any joint venture,
associate or investment. An entity carries the approach-independent facts
Chapter 3 needs before any consolidation approach is applied: its **Table 1
relationship type**, its **economic interest** percent, an optional **legal
ownership** percent for disclosure, and whether the company **operates** it.

These are facts, not decisions. Each inventory's boundary starts from them
and may override them for that inventory alone (spec 03). Editing an entity
never changes an existing boundary treatment; the boundary gate says when the
two disagree. An entity with facilities cannot be deleted, and neither can
the reporting company.

### Facilities

A facility is a site the company reports on: name, location, and the legal
entity it belongs to. Its ownership and control facts are the entity's.

Given "Tarkwa Processing Plant" under "Tarkwa Gold JV Ltd", a joint venture
the company owns 40% of and operates but does not financially control, the
entity record is joint venture, economic interest 40, operated. That single
record is what lets an equity-share inventory account the plant at 40%, a
financial-control inventory at 40%, and an operational-control inventory at
100% without anyone re-entering anything.

A facility with recorded activity data cannot be deleted (409 "Operation not
allowed"): facts referenced by history are the audit trail.

### Activity records

An activity record is one quantity of one thing that happened at one facility:
facility, activity type (free text, e.g. "Haul fleet diesel"), quantity, unit,
date, optional data source, optional evidence reference, data quality, optional
note.

- **Native units.** The quantity is recorded in the unit the source document
  uses (gallons, MWh, short tons). The unit picker groups the registry by
  physical dimension and still accepts a typed custom unit for anything the
  registry does not cover. Conversion happens at calculation time, never at
  entry (spec 05), so the recorded fact matches the source document.
- **Data quality** is one of `MEASURED`, `ESTIMATED`, `CALCULATED`. Anything
  but measured is surfaced as an INFO finding at validation, and a missing
  evidence reference as a WARNING, so completeness and accuracy (Chapter 7) are
  visible before a number is produced.
- **Plausibility.** The activity date must be past or present (422 otherwise).
- **Correction in place.** A fact is corrected via PUT with the same shape as
  creation. Past runs are snapshots and stay unaffected; open inventories see
  the corrected fact and their gates re-evaluate. Full versioning of facts is
  a non-goal today.
- **Deletion.** A record calculated into any run cannot be deleted (409): the
  detail says to correct it instead. Reported results must stay traceable to
  their source.

### The unit registry

Conversions are physical constants held in reviewed code (`UnitConverter`),
not a runtime table. Two units convert only when they share a dimension; each
unit carries aliases so `L`, `litre` and `litres` resolve to one unit.

| Dimension | Base | Registered units |
| --- | --- | --- |
| ENERGY | kWh | kWh, MWh, GWh, GJ, MJ, therm |
| VOLUME | m3 | m3, litre, US-gallon, UK-gallon |
| MASS | kg | kg, tonne, g, lb, short-ton |
| DISTANCE | km | km, mile, m |
| PASSENGER_DISTANCE | passenger-km | passenger-km, passenger-mile |

Substance-specific conversions (natural gas m3 to kWh via calorific value,
fuel volume to mass via density) are deliberately excluded; the accountant
chooses a factor already in that unit. Every seeded factor unit is registered;
a test enforces it.

## API

All under `/api/ghg`, session-authenticated, tenant-scoped (spec 01).

- Organizations: `GET|POST /organizations`, `GET|PUT|DELETE /organizations/{id}`.
  `{name}`; 409 `Duplicate organization`.
- Entities: `GET|POST /organizations/{orgId}/entities`,
  `PUT|DELETE /entities/{id}`. `{name, relationshipType,
  economicInterestPercent, legalOwnershipPercent?, operatedByCompany}`;
  409 on a duplicate name, on restructuring or deleting the reporting
  company, on deleting an entity with facilities (spec 03.1).
- Facilities: `GET|POST /organizations/{orgId}/facilities`,
  `PUT|DELETE /facilities/{id}`. `{name, location, entityId?}`; the response
  carries `entityId`, `entityName`, `relationshipType`; DELETE 409 with
  activity data.
- Activities: `GET|POST /organizations/{orgId}/activities`,
  `PUT|DELETE /activities/{id}`. `{facilityId, activityType, quantity (>0),
  unit, activityDate (past or present), dataSource?, evidenceRef?, dataQuality,
  note?}`; DELETE 409 when a run line references it.
- Units: `GET /units` → `{code, label, dimension, toCanonical}[]`.

## Data

- `V4__ghg_accounting.sql`: `ghg_organizations`, `ghg_facilities`,
  `ghg_activities` (originally with a factor), `ghg_emission_factors` and its
  seed (spec 04).
- `V6__inventory_accounting.sql`: activities become pure facts (gain
  `activity_type`, `unit`, `data_source`, `evidence_ref`, `data_quality`; drop
  `emission_factor_id`).
- `V7__organization_ownership.sql`: `owner_user_id`.
- `V10__facility_control_facts.sql`: `financial_control` and
  `operational_control` replace `controlled`, both backfilled from it.
- `V11__legal_entities.sql`: `ghg_entities`; `ghg_facilities.entity_id`
  replaces the three facility facts, backfilled into a reporting-company
  entity per organization and one entity per facility whose facts differed.

## Events

None published from the facts side.

## Verification

`GhgApiIntegrationTests`: facts carry no accounting treatment; duplicate
organization names; the reporting-company entity and facility default;
entity delete guards; future-dated facts refused; corrections leave runs
untouched; delete guards. `UnitConverterTest`: dimensional conversions, alias
normalization, cross-dimension refusal, seeded-unit coverage. Manual:
`docs/qa/003-inventory.md` sections B and C. Frontend: `EntitiesPage.test.tsx`,
`FacilitiesPage.test.tsx`.

## Non-goals and open questions

- Group structures deeper than one entity layer; entity fact history over
  time (a change on a date is a boundary version with a window, spec 03.2).
- Evidence *file* upload (only a reference string today); bulk import of
  activity data; fact versioning.
