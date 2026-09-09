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

1. Open **Legal entities**.

**Expected result:** Sankofa Gold plc is listed as the reporting company:
subsidiary, 100%, operated, 100% under every approach. Its edit form only
renames it; it cannot be removed.

Verdict: ☐ pass ☐ fail. Notes:

### B2. A joint venture with its jurisdiction

1. Add E1 with the facts in the table and the jurisdiction `gh`.

**Expected result:** the row shows the code upper-cased as GH, 40% under
equity share and financial control, 100% under operational control.

Verdict: ☐ pass ☐ fail. Notes:

### B3. An associate consolidated by decision

1. Add E2 with the facts in the table: acquired on 2025-07-01, financial
   control **Consolidated under financial control (IFRS 10)**, basis
   "Board control under the 2023 shareholders' agreement".
2. Try a disposal date of 2025-01-01 before saving; then clear it.

**Expected result:** the disposal date before the acquisition is refused
inline. After saving, the row shows 30% under equity share, **100%** under
financial control with "financially controlled by decision", 0% under
operational control, and "from 2025-07-01".

Verdict: ☐ pass ☐ fail. Notes:

### B4. The retired relationship names are refused

1. Edit E1 and, in the browser's developer tools, change the relationship
   value sent to `WHOLLY_OWNED` (or ask a developer to send it).

**Expected result:** the request is refused with a message naming the
replacement row. Skip this case if you cannot alter the request.

Verdict: ☐ pass ☐ fail. Notes:

### B5. Removal needs a reason and respects dependants

1. Add a fourth entity **Dormant Holdings Ltd** (subsidiary, 100%), then
   remove it.
2. Try to remove E1.

**Expected result:** the removal dialog asks for a reason and refuses an
empty one; after a reason the entity disappears from the list. E1 cannot
be removed once S2 exists under it (the message says it still has
facilities).

Verdict: ☐ pass ☐ fail. Notes:

## C. Facilities

### C1. Facilities with their attributes

1. Open **Facilities** and add S1 to S6 with the attributes in the table.

**Expected result:** each row shows its entity and relationship, its type,
and "grid GHA" (typed for S2, derived from the country for the others).
S6 shows its lease and start date.

Verdict: ☐ pass ☐ fail. Notes:

### C2. A lease that ends before it starts is refused

1. Edit S6: lease until 2025-01-01.

**Expected result:** refused inline on the lease end date.

Verdict: ☐ pass ☐ fail. Notes:

### C3. Removal needs a reason

1. Add a facility **Temporary Yard** under E0, then remove it.

**Expected result:** the dialog asks for a reason; the facility disappears
after one is given. (A facility with activity records, or one an unpublished
inventory holds in its boundary, refuses removal; procedure 3 checks the
first.)

Verdict: ☐ pass ☐ fail. Notes:

## D. Source streams

### D1. Streams with their default classification

1. On S1, open **Source streams** and add: **Haul fleet** (mobile
   combustion, fuel Diesel, owned) and **Contract mining fleet** (mobile
   combustion, fuel Diesel, **operated by a contractor**).
2. On S2 add **Mill grid supply** (purchased electricity, meter ECG-TKW-01).
3. On S5 add **Camp LPG** (stationary combustion, fuel LPG).

**Expected result:** each stream shows its default scope and category: the
owned haul fleet scope 1 mobile combustion, the contractor fleet **scope 3
purchased goods and services**, the mill supply scope 2 purchased
electricity, the camp LPG scope 1 stationary combustion.

Verdict: ☐ pass ☐ fail. Notes:

### D2. Names are unique per facility

1. On S1, add another stream named **Haul fleet**.

**Expected result:** refused as a duplicate on that facility.

Verdict: ☐ pass ☐ fail. Notes:

## E. Units and densities

### E1. The typical densities are marked as such

1. Open **Units**.

**Expected result:** the densities table lists Diesel, Petrol, LPG,
Kerosene, Heavy fuel oil, Biodiesel and Lubricating oil, each flagged
**Typical value** with a source that says it is a planning value, and none
of them can be deleted.

Verdict: ☐ pass ☐ fail. Notes:

### E2. A supplier density

1. Record the density **Diesel (GOIL, 2025 CoA)**, 0.8325 kg per litre,
   source "GOIL certificate of analysis, batch 2025-03".
2. Record it again with the same material.

**Expected result:** the first is listed without the typical flag; the
second is refused as a duplicate material.

Verdict: ☐ pass ☐ fail. Notes:

### E3. A custom unit is a multiple of a registered one

1. Define **drum**, label "Drum (200 L)", one unit equals 200 litre.
2. Try to define **litre** as a custom unit.

**Expected result:** the drum is listed as `1 drum = 200 litre`. The
registered code is refused inline.

Verdict: ☐ pass ☐ fail. Notes:

## F. Emission factors

### F1. The shared library is cited and read-only

1. Open **Emission factors** and read the shared library.

**Expected result:** every factor cites a publication, a table and a data
year; none says "approx.". The Ghana grid factor says it is a secondary
estimate and points to the Ember figure. Library factors offer no edit or
delete action.

Verdict: ☐ pass ☐ fail. Notes:

### F2. Importing a pack

1. Import the **sector-mining** pack.
2. Import it again.

**Expected result:** the first import reports the number of factors
created; the second reports them as updated, not created again. The
organization's factors now include refrigerants with a blend composition,
fuels per tonne and per litre, and the Ghana grid by year, each with its
citation and URL.

Verdict: ☐ pass ☐ fail. Notes:

### F3. An organization's own factor with provenance

1. Add a factor **Emulsion explosive (supplier)**: scope 1 process
   emissions, per tonne, 170 kg CO2e, source "Supplier technical data sheet
   2025", data year 2025, valid from 2025-01-01, **not approved**.

**Expected result:** the factor is listed as the organization's own and
marked not approved. (Procedure 5 shows the gate refusing it until it is
approved.)

Verdict: ☐ pass ☐ fail. Notes:

### F4. A blend follows the inventory's GWP set

1. Find the imported R-407C factor.

**Expected result:** it shows a blend composition (HFC-32, HFC-125,
HFC-134a by mass) and a CO2e per kg stated under AR5. (Procedure 7 shows
the AR6 figure differ.)

Verdict: ☐ pass ☐ fail. Notes:

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
