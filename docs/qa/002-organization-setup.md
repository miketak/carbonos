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

### F1. An organization starts with no factors

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open **Emission factors** on a freshly created organization. | **This organization's factors** is empty and there is no shared library card: spec 02.10 retired the seeded tier, so a company chooses the baseline it accounts on rather than inheriting one. The **Factor packs** card offers DESNZ 2026 and Ghana. | | |
| 2 | Open a record's factor picker before importing anything. | The picker offers nothing and says so. Nothing can be classified until a pack is imported or a factor is entered by hand, which is the point. | | |

### F2. Importing a pack

The catalogue offers two packs and only two (spec 02.9): the DESNZ
conversion factors and the Ghana pack.

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Read the **Factor packs** card. | Exactly two cards: **UK Government (DESNZ) GHG conversion factors 2026** and **Ghana: grid electricity and transmission losses**. Each names its source, publication year, GWP basis, licence and retrieval date. | | |
| 2 | Import the **Ghana: grid electricity and transmission losses** pack (the Import pack button on its card; the button's accessible name carries the pack's name). | The import reports "ghana, applying from 2025-01-01: 7 added, 0 versioned, 0 tagged, 0 unchanged." and says nothing more: every row of a shipped pack is in a unit the registry converts, nothing was held before, and nothing was dropped. A pack carrying a unit the registry does not hold adds a sentence to the same message, "1 row skipped, in a unit the registry cannot convert:" and then each row it left out with the unit that stopped it. The organization's factors now include the Ghana grid by data year, each citing the publication it comes from (not the pack) with its URL. One row arrives **Not approved** with an Approve button: the derived Ghana T&D loss factor. Leave it. | | |
| 3 | Import it again. | The second import reports "ghana, applying from 2025-01-01: 0 added, 0 versioned, 0 tagged, 7 unchanged.", again with no skipped rows. Re-importing the same edition is a no-op: it cuts no version and rewrites no value. | | |
| 4 | Read the **Source and vintage** column of the imported **Grid electricity, Ghana (2024)** row. | It says "valid 2025-01-01 to ...": every version an import writes starts on the edition's applies-from date. The row shows no version chain yet, because the lineage holds one version. | | |
| 5 | Read the action column of any imported row. | Where a hand-entered factor offers **Delete**, a pack-derived row reads "Retire, not delete". Hover it: a pack-derived factor is never deleted, because its versions are the record of what was calculated with. | | |
| 6 | Read the **Packs** column of that row, and its **Source and vintage** column. | The pack tag `ghana` sits in the Packs column on its own; the Source column names the publication, "Ember Yearly Electricity Data, Total generation emissions intensity (gCO2e/kWh): Electricity (national grid, generation-based) / Ghana (GHA) / data year 2024 ...", published 2025, not the Ghana pack. A pack selects a row; it does not become its publisher. | | |
| 7 | Import the **UK Government (DESNZ) GHG conversion factors 2026** pack, then search the factor table for **HCFC-22 (R-22)**. | The import reports 1,868 added. Under the name of the HCFC-22 row it says "Outside the scopes (Montreal Protocol, not a Kyoto gas)". DESNZ is the only route to a Montreal Protocol gas now that the refrigerants pack has gone, and it must not land in a scope 1 total. | | |

### F2b. A later edition cuts a version, and what that makes visible

An import never overwrites a figure. It closes the version the
organization holds and cuts a new one from the edition's applies-from
date, so a period already reported keeps the factors it reported with.
Two consequences are correct and worth seeing.

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open **Inventories**, create a draft inventory **FY2025** for 2025-01-01 to 2025-12-31, put a facility in its boundary, classify one record with a factor imported from **DESNZ 2026** (not a Ghana one, which applies from 2025-01-01 and covers the period), and read the validation panel. | It raises a **warning** (not an error): the factor "is valid from 2026-01-01, which does not cover the reporting period". This is new and it is correct: the version the organization holds is the 2026 vintage, and 2025 is before it. The run is not blocked. Delete the inventory afterwards. | | |
| 2 | As a platform administrator, publish a later edition of the Ghana pack under **Factor packs** in the admin console, applying from a date after every locked period (procedure 9 covers authoring and publication). Then, as the preparer, import it. | The import reports counts under four headings: added, versioned, tagged, unchanged. A row whose value moved is **versioned**: the row you held is closed the day before the new edition applies and a new version carries the new value from that day. A row the new edition drops is listed as discontinued and nothing retires it. A row you edited here is listed as a conflict and is left exactly as you left it. | | |
| 3 | Read the **Source and vintage** column of a versioned row. | It offers "2 versions of this factor". Open it: the older version reads the old edition with its window ending the day before the new one applies, and the live version reads the new edition from its applies-from date, marked "(live)". | | |
| 4 | Open a run made before the import and read its **Emission factors applied** table (procedure 7 has one). | Every figure is exactly what it was. The table names the edition and the vintage behind each factor; a run made before this release names none, which is honest rather than a guess. | | |
| 5 | Import an edition whose applies-from date falls inside a **Frozen**, **Final** or **Published** inventory's period. | The import is refused with 409 naming that inventory and its status, and nothing is written. A reported period keeps the factors it reported with. | | |

### F3. The factor table and the picker at scale (a scratch organization)

A published edition is thousands of rows, so the table and the picker ask
the server for a page with the filters applied. Check that in an
organization created for the purpose: importing this edition into the
seeded organization would leave the factor tables of the later procedures
unrecognizable.

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Create an organization **Scale Test Co** and open its **Emission factors** page. | The organization has no factors of its own yet. | | |
| 2 | Import **UK Government (DESNZ) GHG conversion factors 2026**. | The import reports about 1,868 added, and nothing versioned, tagged or unchanged. It takes a few seconds: it is the largest edition shipped. | | |
| 3 | Read the heading of **This organization's factors** and the foot of the table. | The heading says "1,868 factors". The table holds 50 rows and the pager under it reads "Page 1 of 38". The browser does not slow to a crawl: it never receives the whole edition. | | |
| 4 | Read the **Factor** column of any imported row. | Under the name is the publisher's own path, for example "Fuels / Gaseous fuels / Butane", which is what tells rows of the same name apart. | | |
| 5 | Choose **Fuels** in **Published category**. | The table returns to page 1, the heading says how many match, and **Published activity** now offers only the activities inside Fuels. | | |
| 6 | Type `butane` in **Search factors**, clear the category filter first. | The rows narrow to butane. Three carry the name "Gaseous fuels: Butane" and differ only by unit: 3,033.38067 kg CO₂e/tonne, 1.74533 kg CO₂e/litre and 0.22241 kg CO₂e/kWh. | | |
| 7 | Untick **Show unapproved**, then tick it again. | The count changes and the checkbox names how many rows it is hiding while it is unticked. | | |
| 8 | Open **Scale Test Co**'s settings and delete it, giving a reason. | The organization and its factors are gone, and the later procedures still see the seeded organization only. | | |

Then remove nothing: the rest of procedure 2 and procedure 5 expect both
packs, which since spec 02.9 are the only two the catalogue holds.

### F3. An organization's own factor with provenance

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Add a factor **Emulsion explosive (supplier)**: scope 1 process emissions, per tonne, 170 kg CO2e, source "Supplier technical data sheet 2025", data year 2025, valid from 2025-01-01, leaving **Reporting basis** on "Counted in the scopes". Read **Approved for use in runs** before saving. | The box is **unticked when the form opens**: use in a run is a review step, not a box nobody cleared (spec 02.1). Leave it so. The factor is listed as the organization's own without the **Approved** badge; its Packs column reads "entered by hand". | | |
| 2 | Open **Add factor** again and read the **Reporting basis** field. | It offers "Counted in the scopes" and "Outside the scopes (Montreal Protocol, not a Kyoto gas)", with a note that Chapter 4 counts the seven Kyoto gas groups and that a Montreal Protocol gas is reported separately. Cancel without saving. | | |

Procedure 5 shows the gate refusing it until it is approved.

### F4. A blend from the pack, and one that follows the inventory's GWP set

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Find the imported R-407C factor. | The row **Blends: R407C, Emissions including only Kyoto products** shows "1624 kg CO2e/kg" and a source naming the DESNZ 2026 flat file. Its **Blend** column is empty: DESNZ publishes the CO2e figure with the gas mass beside it and no composition. | | |
| 2 | Add a factor by hand with a blend composition: **Refrigerant R-410A leakage**, scope 1 fugitive emissions, per kg, 1923.5 kg CO2e, **HFCs kg per unit** 1, **Blend composition** "HFC-32:0.5,HFC-125:0.5", **GWP basis of the published figure** AR5, source "IPCC AR5 WG1 Table 8.A.1". | It is listed as the organization's own with its blend shown ("50% HFC-32, 50% HFC-125"). A composition is the only route to a figure that reconverts under the inventory's GWP set, and no pack carries one since spec 02.9. The HFC mass is what the by-gas table reports (Corporate Standard chapter 4). | | |
| 3 | Try the same with the composition "HFC-32:0.5,HFC-125:0.6". | Refused under the field: "The mass fractions of a blend must add up to 1 (for example HFC-32:0.5,HFC-125:0.5)." A split that does not account for the whole blend would count part of the gas twice or not at all. | | |

The refrigerants pack that shipped a composition for every blend left with
spec 02.9, so a blend a pack delivers no longer reconverts. Where a
composition is recorded, as on the R-410A library row, the run still derives
the figure from it and the inventory's GWP set: 0.5 × 677 + 0.5 × 3,170 =
1,923.5 kg CO2e per kg under AR5, and 0.5 × 771 + 0.5 × 3,740 = 2,255.5 under
AR6 (procedure 7 A2 checks the line).

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
