# Procedure 2: Organization setup

**Objective.** Confirm that the organization's structure, sites, source
streams, units and emission factors can be recorded with the facts and the
provenance a verifier expects, and that the rules on each are enforced.

**Covers** [spec 02](../../specs/02-organization-and-facts.md),
[spec 02.1](../../specs/02.1-emission-factor-library.md),
[spec 02.2](../../specs/02.2-units-densities-and-custom-units.md),
[spec 03.1](../../specs/03.1-legal-entities-and-table-1.md),
[spec 03.3](../../specs/03.3-table-1-completeness.md),
[spec 03.4](../../specs/03.4-entity-dates-facility-attributes-and-boundary-prefill.md)
and [spec 04.3](../../specs/04.3-source-streams-and-scope-choice.md).

**Estimated time:** 75 minutes.

**Run this procedure** before a release, and after any change to entities,
facilities, streams, units, densities or the factor library.

## Prerequisites

- An account that owns an organization (procedure 1 leaves the Newcomer as
  the owner of **Sankofa Gold plc**; otherwise sign in and create it).
- If procedure 1 ran, remove its scratch objects first so they do not
  land in the boundary and the activity view later: reopen the inventory
  **QA scratch** as a draft and delete it, remove the record "QA scratch
  diesel" with a reason, then remove the facility **QA scratch site** with
  a reason.
- Nothing else. This procedure builds the company the later ones use.

## A. The scenario

Sankofa Gold plc runs one wholly owned open pit, operates a processing
plant owned by a joint venture it holds 40% of, holds 30% of a port company
whose loadout its partner operates, and keeps a head office, an exploration
camp and a leased warehouse.

| Ref | Legal entity | Relationship | Economic interest | Operated by Sankofa | Notes |
| --- | --- | --- | --- | --- | --- |
| E0 | Sankofa Gold plc | Subsidiary (created with the organization) | 100% | yes | the reporting company |
| E1 | Tarkwa Gold JV Ltd | Joint venture | 40% | yes | jurisdiction GH |
| E2 | Takoradi Port Co | Associate | 30% | no | acquired 2025-07-01; financially controlled by decision |

| Ref | Facility | Location | Entity | Country | Grid region | Type | Lease |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S1 | Obuasi Ridge Open Pit | Obuasi, Ghana | E0 | GH | (blank) | Mine | none |
| S2 | Tarkwa Processing Plant | Tarkwa, Ghana | E1 | GH | GHA | Processing plant | none |
| S3 | Takoradi Port Loadout | Takoradi, Ghana | E2 | GH | (blank) | Port or loadout | none |
| S4 | Accra Corporate Office | Accra, Ghana | E0 | GH | (blank) | Office | none |
| S5 | Nkran Exploration Camp | Ashanti Region, Ghana | E0 | GH | (blank) | Camp | none |
| S6 | Tema Warehouse | Tema, Ghana | E0 | GH | (blank) | Warehouse | Operating lease (leased in) from 2025-07-01 |

## B. Legal entities

### B1. The reporting company is there by definition

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open **Legal entities**. | Sankofa Gold plc is listed as the reporting company: subsidiary, 100%, operated, 100% under every approach. Its edit form takes only a name, the acquisition and disposal dates and a jurisdiction (no relationship or percentages); the row has no Remove button. | | |

### B2. A joint venture with its jurisdiction

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Add E1 with the facts in the table and the jurisdiction `gh`. | The row shows the code upper-cased as GH, 40% under equity share and financial control, 100% under operational control. | | |

### B2a. Out-of-range percentages are refused inline

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Start adding an entity and type 150 in **Economic interest (%)**. Save. | The dialog stays open, the field is outlined as invalid and reads "Economic interest must be between 0 and 100." under it; nothing is created. | | |
| 2 | Change it to 60 and type 20 in **Legal ownership (%)**. Do not save; cancel the dialog. | The message is gone (the value is valid again) and a note under the fields says the two percentages differ by 40 points and that equity share follows economic interest; the note does not block saving. | | |

### B3. An associate consolidated by decision

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Add E2 with the facts in the table: acquired on 2025-07-01, financial control **Consolidated under financial control (IFRS 10)**, basis "Board control under the 2023 shareholders' agreement". | | | |
| 2 | Try a disposal date of 2025-01-01 before saving; then clear it. | The disposal date before the acquisition is refused inline. | | |
| 3 | Save. | The row shows 30% under equity share, **100%** under financial control with "financially controlled by decision", 0% under operational control, and "from 2025-07-01". | | |

### B4. The retired relationship names are refused

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Edit E1 and, in the browser's developer tools, change the `relationshipType` sent in the `PUT /api/ghg/entities/{id}` request to `WHOLLY_OWNED` (or ask a developer to send it). | The request is refused (422) with "WHOLLY_OWNED was renamed SUBSIDIARY (a group company or subsidiary under financial control)." | | |

Skip this case if you cannot alter the request.

### B5. Removal needs a reason and respects dependants

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Add a fourth entity **Dormant Holdings Ltd** (subsidiary, 100%), then remove it. | The removal dialog asks for a reason and keeps its Remove button disabled until one is typed; after a reason the entity disappears from the list. | | |
| 2 | Try to remove E1. | E1 cannot be removed once S2 exists under it: "'Tarkwa Gold JV Ltd' still has facilities. Move them to another entity before deleting it." | | |

Run the second step after C1.

## C. Facilities

### C1. Facilities with their attributes

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open **Facilities** and add S1 to S6 with the attributes in the table. | Each row shows its entity and relationship, its type, and "grid GHA" (typed for S2, derived from the country for the others). S6 shows its lease and start date. | | |

### C2. A lease that ends before it starts is refused

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Edit S6: lease until 2025-01-01. | Refused inline on the lease end date. | | |

### C3. Removal needs a reason

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Add a facility **Temporary Yard** under E0, then remove it. | The dialog asks for a reason; the facility disappears after one is given. | | |

A facility with activity records, or one an unpublished inventory holds in
its boundary, refuses removal; procedure 3 checks the first.

## D. Source streams

### D1. Streams with their default classification

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On S1, open **Source streams** and add: **Haul fleet** (mobile combustion, fuel Diesel, owned), **Contract mining fleet** (mobile combustion, fuel Diesel, **operated by a contractor**) and **Standby gensets** (stationary combustion, fuel Diesel, owned; no record will ever name it, which procedure 5 D2 relies on). | Each stream shows its default scope and category: the owned haul fleet scope 1 mobile combustion, the contractor fleet **scope 3 purchased goods and services**, the gensets scope 1 stationary combustion. | | |
| 2 | On S2 add **Mill grid supply** (purchased electricity, meter ECG-TKW-01). | The mill supply shows its default scope and category: scope 2 purchased electricity. | | |
| 3 | On S5 add **Camp LPG** (stationary combustion, fuel LPG). | The camp LPG shows its default scope and category: scope 1 stationary combustion. | | |

### D2. Names are unique per facility

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On S1, add another stream named **Haul fleet**. | Refused with "'Obuasi Ridge Open Pit' already has a stream named 'Haul fleet'.". | | |

## E. Units and densities

### E1. The typical densities are marked as such

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open **Units**. | The densities table lists Diesel, Petrol, LPG, Kerosene, Heavy fuel oil, Biodiesel and Lubricating oil, each flagged **Typical value** with a source that says it is a planning value, and none of them can be deleted. | | |

### E2. A supplier density

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Record the density **Diesel (GOIL, 2025 CoA)**, 0.8325 kg per litre, source "GOIL certificate of analysis, batch 2025-03". | Listed without the typical flag and with a Delete button the typical rows lack. | | |
| 2 | Record it again with the same material. | Refused with "A density for 'Diesel (GOIL, 2025 CoA)' already exists.". | | |

### E3. A custom unit is a multiple of a registered one

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Define **drum**, label "Drum (200 L)", one unit equals 200 litre. | The drum is listed as `1 drum = 200 litre`. | | |
| 2 | Try to define **litre** as a custom unit. | The registered code is refused inline with "'litre' is already a registered unit.". | | |

## F. Emission factors

### F1. The shared library is cited and read-only

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open **Emission factors** and read the shared library. | Every factor cites a publication, a table and a data year; none says "approx.". The Ghana grid factor (**Grid electricity (Ghana, Ecoriv 2025)**, 0.441 kg CO2e/kWh) says it is a secondary estimate and points to the Ember figure. Library factors offer no edit or delete action. | | |

### F2. Importing a pack

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Import the **Sector pack: mining (Ghana and West Africa)** pack (the Import pack button on its card; the button's accessible name carries the pack's name). | The import reports "53 factors added, 0 updated". The organization's factors now include refrigerants with a blend composition, diesel per tonne and per litre, explosives, and the Ghana grid by year, each with its citation and URL. One row, the derived Ghana T&D loss factor, arrives **Not approved** with an Approve button; leave it. | | |
| 2 | Import it again. | The second import reports "0 factors added, 53 updated". | | |

Every other pack is importable too; do not import them, or the factor
pickers of procedure 5 fill with rows the cases do not name.

### F3. An organization's own factor with provenance

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Add a factor **Emulsion explosive (supplier)**: scope 1 process emissions, per tonne, 170 kg CO2e, source "Supplier technical data sheet 2025", data year 2025, valid from 2025-01-01, **not approved**. | The factor is listed as the organization's own without the **Approved** badge, because **Approved for use in runs** was left unticked. | | |

Procedure 5 shows the gate refusing it until it is approved.

### F4. A blend follows the inventory's GWP set

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Find the imported R-407C factor. | The row **Refrigerant R-407C leakage** shows "1624 kg CO2e/kg", the blend "23% HFC-32, 25% HFC-125, 52% HFC-134a" and a source naming IPCC AR5. | | |

The run derives the figure from the composition and the inventory's GWP
set: 0.23 × 677 + 0.25 × 3,170 + 0.52 × 1,300 = 1,624.21 kg CO2e per kg
under AR5 (procedure 7 A2 checks the line).

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals:** a country picker with names (codes are typed);
calorific values; published density tables; automatic updates when a new
edition of a pack is published.
