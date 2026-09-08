# QA procedure: GHG inventory (boundary → calculated inventory)

Manual test script for the GHG accounting workflow, exercised on **staging**:
getting in ([spec 01](../../specs/01-identity-and-access.md)), describing the
organization, its legal entities and its facts
([spec 02](../../specs/02-organization-and-facts.md),
[spec 03.1](../../specs/03.1-legal-entities-and-table-1.md)),
drawing and freezing the organizational boundary
([spec 03](../../specs/03-organizational-boundary.md),
[spec 03.2](../../specs/03.2-effective-dated-membership.md)), classifying
([spec 04](../../specs/04-operational-boundary-and-classification.md),
[spec 04.1](../../specs/04.1-scope-as-accounting-decision.md)),
clearing the gates and calculating
([spec 05](../../specs/05-inventories-and-calculation.md)), the inventory
lifecycle ([spec 05.1](../../specs/05.1-inventory-lifecycle-and-run-snapshots.md)),
the base year ([spec 06](../../specs/06-tracking-emissions-over-time.md)),
and reading the report ([spec 07](../../specs/07-reporting-and-verification.md),
[spec 07.1](../../specs/07.1-reporting-completeness.md)).
Run it top to bottom. The scenario is cumulative, and later sections depend on
state built earlier. Tick a verdict and leave a note on every row.
166 cases, estimated about 5 hours. It is self-contained: no other QA
procedure has to be run first.

**When to run:** before tagging a production release, and after any change to
the `ghg` backend module, the `src/features/ghg` frontend feature, the unit
registry (`UnitConverter`), the validation gates, the inventory lifecycle, the
Table 1 derivation, the seeded factor library, or admin user creation in the
`user` module.

## Prerequisites

- **App:** https://frontend-staging-2e61.up.railway.app
- **An ADMIN account and its password.**
- **Two email addresses for the accounts you will create.**
- **Two temporary passwords** of at least 8 characters that you can retype
  later.
- **Two browser contexts.** The normal window is the admin's (section A) and
  later the outsider's (section K); the private window belongs to the analyst
  from A11 onwards. Keeping them apart stops the sessions colliding.
- **A calculator.** Section H checks the engine's arithmetic against figures
  computed by hand. Do not eyeball them.

> This procedure leaves a full year of data under the analyst's account and
> does not clean up. On staging that is harmless: the organization is
> tenant-scoped and invisible to everyone else. To clear it, delete the
> *organization* (facilities and inventories cascade with it); individual
> facilities carrying activity data refuse deletion by design (J2).

---

## The scenario

**Sankofa Gold plc** is a mid-tier Ghanaian gold miner. It runs one wholly
owned open pit, operates a processing plant owned by a joint venture company
it holds 40% of, holds 30% of the port company whose loadout terminal its JV
*partner* operates, and keeps a head office and an exploration camp.

That shape is the whole point. Under **operational control** Sankofa reports
100% of the plant it runs and nothing of the terminal it doesn't; under
**equity share** it reports 40% and 30%. This script records one set of facts,
then consolidates them twice, into two inventories that must produce two
materially different totals without a single activity record being edited.
A third inventory later exercises membership windows, scope choices, the
lifecycle, the base year and the Chapter 9 report.

### Legal entities (organizational facts, Table 1)

| Ref | Name | Relationship | Economic interest % | Operated by Sankofa |
| --- | --- | --- | --- | --- |
| E0 | Sankofa Gold plc | Wholly owned (the reporting company, created with the organization) | 100 | ✓ |
| E1 | Tarkwa Gold JV Ltd | Joint venture (joint financial control) | 40 | ✓ |
| E2 | Takoradi Port Co | Associate (significant influence, no control) | 30 | ✗ |

### Facilities (organizational facts)

| Ref | Name | Location | Legal entity |
| --- | --- | --- | --- |
| S1 | Obuasi Ridge Open Pit | Obuasi, Ghana | E0 Sankofa Gold plc |
| S2 | Tarkwa Processing Plant | Tarkwa, Ghana | E1 Tarkwa Gold JV Ltd |
| S3 | Takoradi Port Loadout | Takoradi, Ghana | E2 Takoradi Port Co |
| S4 | Accra Corporate Office | Accra, Ghana | E0 Sankofa Gold plc |
| S5 | Nkran Exploration Camp | Ashanti Region, Ghana | E0 Sankofa Gold plc |

These are *facts*. Each inventory's boundary starts from the entity's facts
(spec 03) and may override them for that inventory alone, at the entity
level.

### Activity records (organizational facts)

Record these exactly: quantities, units and dates are load-bearing. Data
source is free text; use the evidence reference given.

| Ref | Site | Activity | Quantity | Unit | Date | Evidence ref | Quality |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R1 | S1 | Haul fleet diesel | 1250000 | US-gallon | 2025-06-30 | INV-2025-0631 | Measured |
| R2 | S2 | Mill grid electricity | 48500 | MWh | 2025-07-31 | ECG-2025-07 | Measured |
| R3 | S1 | Light vehicle fleet petrol | 120000 | litre | 2025-05-31 | FL-2025-05 | Measured |
| R4 | S4 | Office grid electricity | 210000 | kWh | 2025-08-31 | ECG-ACC-08 | Measured |
| R5 | S5 | Camp LPG | 18000 | litre | 2025-04-30 | LPG-0430 | Measured |
| R6 | S2 | Chiller refrigerant top-up | 45 | kg | 2025-09-15 | MNT-4471 | Measured |
| R7 | S4 | FIFO crew charter flights | 1850000 | passenger-km | 2025-10-31 | TRV-Q4 | **Calculated** |
| R8 | S1 | Domestic waste to landfill | 640 | short-ton | 2025-11-30 | WST-2025 | **Estimated** |
| R9 | S1 | Process water abstraction | 2400000 | m3 | 2025-12-15 | **(leave empty)** | Measured |
| R10 | S3 | Shiploader diesel | 310000 | litre | 2025-09-30 | TKD-0930 | Measured |
| R11 | S1 | ANFO explosives consumed | 8400 | **custom:** `tonne ANFO` | 2025-08-31 | BL-2025 | Measured |
| R12 | S1 | Haul fleet diesel (Q1) | 300000 | litre | 2026-02-28 | INV-2026-0228 | Measured |

Three more are recorded later, in section M, for the third inventory:

| Ref | Site | Activity | Quantity | Unit | Date | Evidence ref | Quality |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R13 | S1 | Contractor mining fleet diesel | 2100000 | litre | 2025-06-30 | CTR-2025-H1 | Measured |
| R14 | S3 | Shiploader diesel (Q1) | 100000 | litre | 2025-03-31 | TKD-0331 | Measured |
| R15 | S1 | ANFO explosives consumed (tonnes) | 8400 | tonne | 2025-08-31 | BL-2025 | Measured |
| R16 | S1 | Boiler wood pellets | 10 | tonne | 2025-05-31 | PEL-0531 | Measured |

Every row earns its place: R1/R2/R8 exercise the three conversion dimensions
(volume, energy, mass); R7 and R8 trip the data-quality INFO findings; R9 trips
the missing-evidence warning; R10 is the non-operated associate that separates
the two consolidation approaches; R11 is a real mining source recorded in a
custom unit no factor matches; R12 falls outside the reporting period; R13 is
the same diesel as R1 burned by a contractor (scope 3); R14 predates an
acquisition date; R15 is R11 recorded in a registered unit so the
process-emission factor applies; R16 is a biomass fuel whose CO2 is biogenic.

### Classification (used in F and I)

| Ref | Emission factor to choose |
| --- | --- |
| R1 | Diesel (/litre) |
| R2 | Grid electricity (Ghana) (/kWh) |
| R3 | Petrol (/litre) |
| R4 | Grid electricity (Ghana) (/kWh) |
| R5 | LPG (/litre) |
| R6 | Refrigerant R-410A leakage (/kg) |
| R7 | Business travel - long-haul flight (/passenger-km) |
| R8 | Waste to landfill (/tonne) |
| R9 | Water supply (/m3) |
| R10 | Diesel (/litre) |
| R11 | *none matches the custom unit*; excluded as **Methodology exclusion** |
| R12 | *none*; auto-excluded, outside the period |
| R13 | Diesel (/litre), **Scope 3**, category "1. Purchased goods and services" (section M) |
| R14 | *none*; auto-excluded, outside the membership window (section M) |
| R15 | ANFO explosives detonation (/tonne), scope 1 process emissions (section M) |
| R16 | Wood pellets (biomass) (/tonne), scope 1 (section P) |

---

## A. Onboarding (an admin creates the accounts)

CarbonOS has no self-service signup. An administrator creates an account with
a temporary password and passes it to the user out of band. This section
builds the two accounts the rest of the procedure runs on: **the analyst**,
who will own Sankofa Gold's data, and **the outsider**, who exists only to
prove in section K that they cannot see it.

| # | Step | Expected result | Verdict | Notes |
| --- | --- | --- | --- | --- |
| A1 | In the **normal window**, open the app signed out and sign in as the ADMIN | The sign-in form accepts the credentials | ☐ P ☐ F | |
| A2 | Watch the screen immediately afterwards | A full-screen "CarbonOS / Measure. Certify. Sustain." splash plays for about ten seconds. A click or a keypress skips it | ☐ P ☐ F | |
| A3 | Read the welcome page at `/app` | Three cards: **GHG accounting**, **Edit profile** and **Manage users**. The last is shown only to admins | ☐ P ☐ F | |
| A4 | Click **Manage users** | `/admin/users`, heading "Users", listing every account with display name, email, role, status and created date | ☐ P ☐ F | |
| A5 | **Add user**. Enter the analyst's email, display name `Ama Boateng`, role **Member**, and the temporary password `secret` (six characters) | Refused: the temporary password must be at least 8 characters. Nothing is created | ☐ P ☐ F | |
| A6 | Replace it with your real 8-character-plus temporary password and submit **Add user** | Note the hint under the field: "Share it with the user out of band; they should change it later." A row appears for Ama Boateng, role MEMBER, status ACTIVE | ☐ P ☐ F | |
| A7 | Click **Add user** again and submit the *same* email with any other details | Refused as a duplicate. No second row, and the existing account is untouched | ☐ P ☐ F | |
| A8 | **Add user** for the outsider: the second email, display name `Kwesi Mensah`, role **Member**, its own temporary password | A second MEMBER row appears. This account stays idle until section K | ☐ P ☐ F | |
| A9 | Sign out of the admin session | Returns to the signed-out app. The normal window is now free for section K | ☐ P ☐ F | |
| A10 | In the **private window**, sign in as the analyst with a deliberately wrong password | "Invalid email or password." An unknown email gives the identical message, so accounts cannot be enumerated | ☐ P ☐ F | |
| A11 | Sign in as the analyst with the temporary password | The splash plays, then `/app` | ☐ P ☐ F | |
| A12 | Read the analyst's welcome page | Two cards only: **GHG accounting** and **Edit profile**. No **Manage users**, because this is a MEMBER | ☐ P ☐ F | |
| A13 | Open `/admin/users` directly in the analyst's window | An "Access denied" panel with a "Back to home" link, not the user table | ☐ P ☐ F | |

---

## B. Organization, legal entities and facilities (the facts layer)

| # | Step | Expected result | Verdict | Notes |
| --- | --- | --- | --- | --- |
| B1 | Still signed in as the analyst, click **GHG accounting** on `/app` | Lands on `/app/ghg`, heading "GHG accounting", reading "No organizations yet". No other tenant's data is visible | ☐ P ☐ F | |
| B2 | **New organization** → name `Sankofa Gold plc` → **Create organization** | Card appears reading "0 facilities in the boundary". Click **Open** | ☐ P ☐ F | |
| B3 | On the Overview page, read the setup checklist | Card "From facts to a final inventory" with four steps; only "Add your legal entities and facilities" offers a CTA | ☐ P ☐ F | |
| B4 | Sidebar → **Legal entities** | One row already: **Sankofa Gold plc**, wholly owned, 100%, operated, with a "Reporting company" pill and no **Remove** button. It was created with the organization | ☐ P ☐ F | |
| B5 | **Add legal entity**: E1 `Tarkwa Gold JV Ltd`, relationship **Joint venture (joint financial control)**, economic interest `40`, legal ownership left empty, operated by company **on**. Then E2 `Takoradi Port Co`, **Associate**, `30`, operated **off** | Three rows. Read the three share columns, which are Table 1 applied: E1 reads equity **40%**, financial control **40%**, operational control **100%**; E2 reads **30% / 0% / 0%**; E0 reads **100% / 100% / 100%** | ☐ P ☐ F | |
| B6 | **Edit** E0 and try to change its relationship | The form only allows renaming: the reporting company is wholly owned by definition. Cancel | ☐ P ☐ F | |
| B7 | Sidebar → **Facilities** → **Add facility**. Read the **Legal entity** select | It defaults to Sankofa Gold plc and lists all three entities, with a hint that ownership and control facts live on the entity | ☐ P ☐ F | |
| B8 | Add all five facilities from the facilities table above, choosing the entity per row | Table lists five rows with location and the legal entity (name with the relationship beneath). Stat chips read Facilities **5**, Legal entities represented **3 of 3**, Wholly owned **3 of 5** | ☐ P ☐ F | |
| B9 | **Legal entities** → **Remove** on E2 | Refused: the entity still has facilities (S3). Move them first | ☐ P ☐ F | |
| B10 | Return to **Overview** | The first step is ticked off; the CTA has moved to "Record activity data" | ☐ P ☐ F | |

---

## C. Activity data (facts, units, plausibility)

| # | Step | Expected result | Verdict | Notes |
| --- | --- | --- | --- | --- |
| C1 | Sidebar → **Activity data** → **Record activity**. Open the **Unit** dropdown | Grouped by dimension: Energy, Volume, Mass, Distance, Passenger-distance, plus a final "Custom unit…" option | ☐ P ☐ F | |
| C2 | Record **R1**: facility S1, activity `Haul fleet diesel`, quantity `1250000`, unit **US-gallon**, date `2025-06-30`, data source `Fuel supplier invoice`, evidence `INV-2025-0631`, quality Measured | Toast "Activity recorded." Row shows `1,250,000 US-gallon`, the *recorded* unit, not litres | ☐ P ☐ F | |
| C3 | Try to record an activity dated **tomorrow** | Refused: the date field's max is today. If forced, the API answers 422 | ☐ P ☐ F | |
| C4 | Record **R2 through R10** from the table (nine records). Leave R9's evidence reference **empty** | Nine rows added. R9 shows a blank evidence cell | ☐ P ☐ F | |
| C5 | Record **R11**: unit → **Custom unit…**, type `tonne ANFO` | The picker swaps to a free-text box with "Choose from the list instead" and a hint that custom units only match a factor with the identical unit and won't auto-convert | ☐ P ☐ F | |
| C6 | Record **R12** (dated `2026-02-28`) | Accepted. It is a past date, and facts exist independently of any reporting period | ☐ P ☐ F | |
| C7 | Review the table | Twelve rows, newest date first. No row shows a scope, category or emission factor anywhere. Facts carry no accounting decisions | ☐ P ☐ F | |
| C8 | Sidebar → **Emission factors** | Sixteen factors. The scope column is headed "Suggested scope"; Diesel, Petrol, LPG, Natural gas, the two process factors and Wood pellets carry an "any scope" marker, Grid electricity does not. A "Gases (kg per unit)" column splits each factor, e.g. Diesel `CO₂ 2.6307 · CH₄ 0.0001 · N₂O 0.0001`, Waste to landfill `CO₂ 12.2 · CH₄ 15.5`, Wood pellets ending in `biogenic CO₂ 1,800` | ☐ P ☐ F | |

---

## D. Inventory A: organizational boundary (operational control)

Add **only S1, S4 and S5** to the boundary in this section. S2 and S3 are held
back deliberately so section E can exercise reconciliation.

| # | Step | Expected result | Verdict | Notes |
| --- | --- | --- | --- | --- |
| D1 | Sidebar → **Inventories** → **New inventory**. Name `2025 Corporate Inventory`, period `2025-01-01` → `2025-12-31`, purpose `Corporate reporting`, approach **Operational control**, GWP set left at **AR5** | Created; card shows the approach badge, a **DRAFT** chip and `2025-01-01 → 2025-12-31 · Corporate reporting`. Open it | ☐ P ☐ F | |
| D2 | Read the header, then scroll to **Pre-flight checks** before touching anything | Beside the approach badge a chip reads **DRAFT** and a pill reads **GWP AR5**. The **Inventory lifecycle** card explains the draft state and offers **Freeze inventory**. Pre-flight badge reads **LAUNCH ON HOLD**; Reporting boundary is **HOLD**, reading "The organizational boundary is empty"; a fifth gate, **Base year**, reads PASS | ☐ P ☐ F | |
| D3 | In **Organizational boundary**, read the list | One block per legal entity (E0, E1, E2), each with its facilities beneath, nothing ticked | ☐ P ☐ F | |
| D4 | Tick **S1** (under Sankofa Gold plc) into the boundary | The entity block fills in with nothing typed: relationship **Wholly owned**, economic interest **100**, operated **on**, accounting share **100%**, and a line spelling out the Table 1 row ("wholly owned operation or subsidiary; operational control: 100% (operator)"). S4 and S5 stay unticked | ☐ P ☐ F | |
| D5 | Tick **S4** and **S5** in | All three sit under the one entity at **100%** | ☐ P ☐ F | |
| D6 | Re-read Pre-flight checks | Reporting boundary is still **HOLD**, but the finding has changed to "The inventory is a draft. Freeze it to enable a run." Activity data completeness now warns that **12 organizational activity records have not been reviewed** and tells you to run "Review activity data" | ☐ P ☐ F | |

---

## E. Review activity data (assignment sync and reconciliation)

| # | Step | Expected result | Verdict | Notes |
| --- | --- | --- | --- | --- |
| E1 | In **Activity view**, click **Review activity data** | Toast "12 new records under review." Twelve rows appear | ☐ P ☐ F | |
| E2 | Find R12 (`Haul fleet diesel (Q1)`, 2026-02-28) | Status `Excluded · Outside reporting period`, auto-excluded with no user input | ☐ P ☐ F | |
| E3 | Find R2, R6 (S2) and R10 (S3) | All three `Excluded · Outside boundary`, because their facilities are not in this inventory's boundary | ☐ P ☐ F | |
| E4 | Confirm the facts were not touched: open **Activity data** in another tab | All twelve records unchanged. Exclusion is a property of the *view*, never of the fact | ☐ P ☐ F | |
| E5 | Back in the inventory, tick **S2** into the boundary | Tarkwa Gold JV Ltd arrives prefilled: **Joint venture**, economic interest **40**, operated **on**, straight from the entity record. Accounting share shows **100%** with the row "joint venture under joint financial control; operational control: 100% (operator)": Sankofa operates it, so the interest is irrelevant under this approach | ☐ P ☐ F | |
| E6 | Tick **S3** in | Takoradi Port Co arrives prefilled as **Associate**, **30**, operated **off**. Accounting share shows **0%** and an amber note says it is outside the boundary under this approach and that the version will record it as excluded | ☐ P ☐ F | |
| E7 | Read Pre-flight checks | Reporting boundary is **HOLD** with two findings: the draft error, and the warning beginning "Takoradi Port Co has a 0% accounting share under operational control". Completeness warns that two records (R2, R6) are excluded "for a reason that no longer holds" | ☐ P ☐ F | |
| E8 | Click **Review activity data** again | Toast "3 stale decisions refreshed." R2 and R6 flip back to included-and-unclassified. R10 stays `Excluded · Outside boundary`, its detail now reading "Takoradi Port Co: 0% accounting share under operational control". R12 stays excluded, since it is still outside the period | ☐ P ☐ F | |
| E9 | Click **Review activity data** a third time | Toast "All activity records are already reviewed." Nothing changes | ☐ P ☐ F | |

---

## F. Classification and unit conversion

| # | Step | Expected result | Verdict | Notes |
| --- | --- | --- | --- | --- |
| F1 | Read Pre-flight checks | Classification is **HOLD**, one error per unclassified record, e.g. "'Haul fleet diesel' (Obuasi Ridge Open Pit, 2025-06-30) is unclassified" | ☐ P ☐ F | |
| F2 | Open R1's **Classify** dropdown | Only the five *volume-dimension* factors are offered, in this order: Diesel, LPG, Natural gas, Petrol, Water supply. The filter is by dimension, not by exact unit: not one of them is per US-gallon. No energy, mass or distance factor appears | ☐ P ☐ F | |
| F3 | Choose **Diesel (/litre)** for R1 | Preview reads `1,250,000 US-gallon → 4,731,764.73 litre × 2.66 kg CO₂e/litre`. Status becomes `Included` with a Scope 1 badge. Beside the factor a **scope** select reads Scope 1 and a **category** select reads Mobile combustion, both defaulted from the factor; a **lease type** select reads "Not a leased asset" | ☐ P ☐ F | |
| F3b | Classify R4 with **Grid electricity (Ghana) (/kWh)** and open its scope select | The scope select is disabled with the hint "This factor's scope is inherent": grid electricity is scope 2 whoever buys it | ☐ P ☐ F | |
| F4 | Classify R2 with **Grid electricity (Ghana) (/kWh)** | Preview reads `48,500 MWh → 48,500,000 kWh × 0.441 kg CO₂e/kWh`; Scope 2 badge | ☐ P ☐ F | |
| F5 | Classify R8 with **Waste to landfill (/tonne)** | Preview reads `640 short-ton → 580.5982 tonne × 446.2 kg CO₂e/tonne`; Scope 3 badge | ☐ P ☐ F | |
| F6 | Classify R3, R5, R6, R7, R9 per the classification table (R10 is excluded under this approach; R4 is done) | No conversion preview on any of them, because the recorded unit already matches the factor's unit | ☐ P ☐ F | |
| F7 | Look at R11 (`tonne ANFO`) before classifying it | Note under the dropdown, beginning "No factor matches tonne ANFO". The dropdown falls back to offering **all** factors, including "ANFO explosives detonation (/tonne)" | ☐ P ☐ F | |
| F8 | Classify R11 with **Waste to landfill (/tonne)** anyway | Emission factors gate turns **HOLD**, reporting that "'ANFO explosives consumed' is recorded in tonne ANFO (unrecognized) but its factor 'Waste to landfill' is per tonne (mass)", so no conversion between them exists. A custom unit never auto-converts, even to a same-word unit | ☐ P ☐ F | |
| F9 | On R11 click **Exclude…** and read the menu | Seven reasons: Outside reporting period, Outside boundary, Non-GHG activity, Duplicate, Not applicable, Methodology exclusion, Other documented reason | ☐ P ☐ F | |
| F10 | Exclude R11 as **Methodology exclusion** | Status `Excluded · Methodology exclusion`; the Emission factors gate returns to **PASS**. The library has a process-emission factor for ANFO, but this record's custom unit cannot be reconciled with it, so the honest reason is a methodology limit on the record as entered (section M records it again in tonnes) | ☐ P ☐ F | |

---

## G. Pre-flight gates (break each one on purpose)

Every step here is reverted before the next section. Do them in order.

| # | Step | Expected result | Verdict | Notes |
| --- | --- | --- | --- | --- |
| G1 | Untick **S1** from the boundary | Reporting boundary gains one error per *included* S1 record (four of them) on top of the draft error, e.g. "Included activity 'Haul fleet diesel' (Obuasi Ridge Open Pit, 2025-06-30) is outside the boundary (facility not in the boundary)". Sankofa Gold plc stays in the boundary because S4 and S5 are | ☐ P ☐ F | |
| G2 | While blocked, try **Launch calculation run** | Button is disabled; its tooltip reads "Resolve the blocking findings first" | ☐ P ☐ F | |
| G3 | Re-tick **S1** | The four outside-boundary errors disappear. Reporting boundary shows only the draft error and the Takoradi 0%-share warning | ☐ P ☐ F | |
| G4 | On R12's `Excluded · Outside reporting period` chip, click the **✕** to re-include it | Activity data completeness turns **HOLD**, reading "Included activity 'Haul fleet diesel (Q1)' is dated 2026-02-28, outside the reporting period" | ☐ P ☐ F | |
| G5 | Exclude R12 again as **Outside reporting period** | Completeness returns to **WARN** | ☐ P ☐ F | |
| G6 | Read the completeness findings in full | Warning "'Process water abstraction' (2025-12-15) has no evidence reference." Info "'FIFO crew charter flights' (2025-10-31) is calculated data." Info "'Domestic waste to landfill' (2025-11-30) is estimated data." | ☐ P ☐ F | |
| G7 | Read the whole panel | Badge **LAUNCH ON HOLD**, and only the draft error is holding it: Reporting boundary HOLD, Activity data completeness WARN, Classification PASS, Emission factors PASS | ☐ P ☐ F | |
| G8 | In **Inventory lifecycle**, click **Freeze inventory**, then **Cancel** in the dialog | A dialog titled "Freeze the inventory?" says it freezes the boundary and the activity view together and cuts boundary version 1. Cancelling changes nothing; the chip still reads **DRAFT** | ☐ P ☐ F | |
| G9 | Click **Freeze inventory** again and confirm | Toast "Inventory frozen as boundary v1." The header chip reads **FROZEN · BOUNDARY v1**; every checkbox, input and classify control on the page is disabled; **Reopen as draft** has replaced the freeze button, and **Publish** is disabled with the tooltip "Designate a final run first" | ☐ P ☐ F | |
| G10 | Read the new **Version history** under the boundary | One row: `v1 · frozen <today> by <the analyst's email> · 2 entities, 4 facilities`. Click it: it expands to the entities with their Table 1 facts and share and the facilities beneath; Takoradi Port Co is listed as **excluded** with the reason "0% accounting share under operational control: outside the boundary under this approach" | ☐ P ☐ F | |
| G11 | Read the whole panel | Badge **READY TO LAUNCH**. Reporting boundary WARN (the Takoradi warning only), Activity data completeness WARN, Classification PASS, Emission factors PASS, Base year PASS. Warnings never block | ☐ P ☐ F | |

---

## H. Launch run A and verify the arithmetic

Expected figures, computed by hand from the seeded factors, the registry
constants (`US-gallon → litre = 3.785411784`, `MWh → kWh = 1000`,
`short-ton → tonne = 0.90718474`) and `converted quantity × factor × share`:

| | Scope 1 | Scope 2 | Scope 3 | Total |
| --- | --- | --- | --- | --- |
| kg CO₂e | 12,967,920.182 | 21,481,110.000 | 977,412.932 | **35,426,443.114** |
| displayed | 12,967.92 t | 21,481.11 t | 977.41 t | **35,426.44 t CO₂e** |

| # | Step | Expected result | Verdict | Notes |
| --- | --- | --- | --- | --- |
| H1 | Leave the run label at `Run 001` and click **Launch calculation run** | Toast "Calculation complete."; the browser navigates to the run report page, laid out as ten numbered sections in the order Chapter 9 of the Standard lists them | ☐ P ☐ F | |
| H2 | Read **Emissions by scope** | **35,426.44 t CO₂e**, split as the table above. Scope 2 shows a location-based figure only: no facility has a market-based instrument | ☐ P ☐ F | |
| H3 | Count the **Snapshot lines** | **9 lines**. R10, R11 and R12 are excluded, so they never reach the calculation | ☐ P ☐ F | |
| H4 | Read **Company and organizational boundary** | It names Sankofa Gold plc, the approach, version 1 and who froze it when, then lists the entities with their Table 1 facts, shares and facilities. Takoradi Port Co is listed as excluded with its reason: the card is the complete boundary declaration, the lines are only what emitted | ☐ P ☐ F | |
| H5 | Find the R1 line (Haul fleet diesel) | Quantity cell shows the original **and** the converted quantity (`1,250,000 US-gallon → 4,731,764.73 litre`); line total **12,586.49 t CO₂e** | ☐ P ☐ F | |
| H6 | Read **Exclusions** | Three rows grouped by reason: R10 under Outside boundary with the detail "Takoradi Port Co: 0% accounting share under operational control", R11 under Methodology exclusion, R12 under Outside reporting period with the detail naming the period | ☐ P ☐ F | |
| H7 | Find the R2 line (Mill grid electricity) | Weight **100%**, line total **21,388.5 t CO₂e**, because Sankofa operates the plant its JV company owns 40% of | ☐ P ☐ F | |
| H7b | Read **Emissions by gas** and **Biogenic CO₂** | Seven gases in the Standard's order with kg of gas and kg CO₂e; CH₄ and N₂O are non-zero (fuels and landfill), HFCs carry the R-410A top-up (45 kg × 2,088 = **93.96 t**), biogenic CO₂ is **0 kg** and stated as outside the scopes | ☐ P ☐ F | |
| H8 | Go back to the inventory and click **Mark as final** on Run 001 | Run shows a `FINAL` pill; the header chip reads **FINAL · BOUNDARY v1**; the lifecycle card now offers **Withdraw final designation** and an enabled **Publish** | ☐ P ☐ F | |
| H9 | Open the organization **Overview** | The setup checklist is gone, replaced by the dashboard: animated total, scope bars, "Top facilities by emissions" led by Tarkwa Processing Plant | ☐ P ☐ F | |

---

## I. Inventory B: equity share over the same facts

Not one fact from section C is edited or re-entered. This is the same twelve
records consolidated a second way.

| | Scope 1 | Scope 2 | Scope 3 | Total |
| --- | --- | --- | --- | --- |
| kg CO₂e | 13,158,924.182 | 8,648,010.000 | 977,412.932 | **22,784,347.114** |
| displayed | 13,158.92 t | 8,648.01 t | 977.41 t | **22,784.35 t CO₂e** |

| # | Step | Expected result | Verdict | Notes |
| --- | --- | --- | --- | --- |
| I1 | **Inventories** → **New inventory**. Name `2025 Equity Share Inventory`, same period, purpose `JV partner reporting`, approach **Equity share** | Created alongside inventory A. Overlapping periods are allowed by design | ☐ P ☐ F | |
| I2 | Tick the **Sankofa Gold plc**, **Tarkwa Gold JV Ltd** and **Takoradi Port Co** entity checkboxes (not the facilities) | Each entity arrives with **all** its facilities ticked and its treatment prefilled: shares read **100% / 40% / 30%** with nothing typed. The same facts now produce different shares because the approach changed | ☐ P ☐ F | |
| I3 | Read Pre-flight checks | Reporting boundary is **HOLD** for the draft error alone: **no** 0%-share warning this time, because Takoradi contributes 30% under equity share | ☐ P ☐ F | |
| I4 | Click **Review activity data** | Toast "12 new records under review." Inventory A's decisions are not inherited; every assignment starts fresh | ☐ P ☐ F | |
| I5 | Confirm R12's status | `Excluded · Outside reporting period`. Nothing else auto-excludes, because all five facilities are in the boundary at a non-zero share | ☐ P ☐ F | |
| I6 | Classify R1–R10 per the classification table; exclude R11 as **Methodology exclusion**; then **Freeze inventory** and confirm | Toast "Inventory frozen as boundary v1." (each inventory numbers its own versions). Badge turns **READY TO LAUNCH** | ☐ P ☐ F | |
| I7 | Launch `Run 001`, then back on the inventory click **Mark as final** on it | Total **22,784.35 t CO₂e**, split as the table above; 10 lines; the inventory reads **FINAL · BOUNDARY v1** (section O designates it as the base year) | ☐ P ☐ F | |
| I8 | Compare the R2 line against inventory A's | `48,500 MWh → 48,500,000 kWh`, identical factor, but weight **40%** and line total **8,555.4 t** instead of 21,388.5 t | ☐ P ☐ F | |
| I9 | Compare the R10 line | Weight **30%**, line total **247.38 t CO₂e**, up from zero in inventory A | ☐ P ☐ F | |
| I10 | Compare Scope 3 across the two runs | Identical, **977.41 t** in both, because every scope-3 fact sits at a wholly owned site | ☐ P ☐ F | |
| I11 | Re-open inventory A's Run 001 | Unchanged: still 35,426.44 t, still marked FINAL. Building a second view did not disturb the first | ☐ P ☐ F | |

---

## J. Audit and immutability rules

This section corrects a fact that both inventories already consolidated.
Every run launched so far is a snapshot, so none of their totals may move:
inventory B's Run 001 must still read 22,784.35 t at the end of this section
too. Only *future* runs see the correction.

| # | Step | Expected result | Verdict | Notes |
| --- | --- | --- | --- | --- |
| J1 | **Activity data** → **Remove** on R1 | Refused, beginning "This record has been calculated into one or more runs." The message tells you to correct the record instead of deleting it | ☐ P ☐ F | |
| J2 | **Facilities** → **Remove** on S1 | Refused, beginning "'Obuasi Ridge Open Pit' has recorded activity data." The message calls the facts an audit trail and tells you to remove or reassign its records first | ☐ P ☐ F | |
| J3 | **Activity data** → **Correct** on R3, change quantity from `120000` to `130000` litre, save | Toast "Record corrected. Past runs are unaffected." | ☐ P ☐ F | |
| J4 | Re-open inventory A's Run 001 | Still exactly **35,426.44 t**. A run is a snapshot; correcting a fact never rewrites history | ☐ P ☐ F | |
| J5 | Open inventory A and read Pre-flight checks | Still READY TO LAUNCH. The gates re-evaluated against the corrected fact, and no re-classification is needed | ☐ P ☐ F | |
| J6 | Launch a second run, label `Run 002` | Total **35,448.06 t CO₂e**, 21,620 kg higher (10,000 extra litres × 2.162). Its report cites **Boundary version 1**, the same version as Run 001, which sits beside it unchanged | ☐ P ☐ F | |
| J7 | Mark **Run 002** as final | Run 002 gains the `FINAL` pill; Run 001 loses it. Exactly one final run per inventory | ☐ P ☐ F | |
| J8 | Delete **Run 002** | It disappears; the designation is withdrawn, the chip falls back to **FROZEN · BOUNDARY v1**, and Run 001 is *not* auto-promoted | ☐ P ☐ F | |
| J9 | Re-designate **Run 001** as final | The FINAL pill returns to Run 001; chip **FINAL · BOUNDARY v1** | ☐ P ☐ F | |
| J10 | In inventory A's lifecycle card, look for **Reopen as draft** | It is not offered while a run is final: the card offers **Withdraw final designation** and **Publish**. Click **Withdraw final designation** | ☐ P ☐ F | |
| J10b | Now click **Reopen as draft** | Toast "Inventory reopened as a draft." Chip reads **DRAFT**; the inputs are editable again; pre-flight is back on **HOLD** for the draft error; Version history still lists v1 | ☐ P ☐ F | |
| J11 | Change Tarkwa Gold JV Ltd's economic interest to `50` in the boundary, then **Freeze inventory** and confirm | Toast "Inventory frozen as boundary v2." Chip reads **FROZEN · BOUNDARY v2**, and so does the inventory's card back on the Inventories list. Version history lists v2 above v1. Expand each: v2 shows Tarkwa Gold JV Ltd at 50%, v1 still shows it at 40%. Versions are never rewritten. Reporting boundary now also warns "Tarkwa Gold JV Ltd's treatment (joint venture, 50%, operated) differs from the entity record (joint venture, 40%, operated). Review the boundary.": the treatment and the fact disagree, and the gate says so | ☐ P ☐ F | |
| J12 | Open **Run 001** again | Still **35,426.44 t**, and its boundary card still shows Tarkwa Gold JV Ltd at 40%. A later freeze changes nothing a verifier has already been shown | ☐ P ☐ F | |
| J13 | Sidebar → **Legal entities** → **Edit** Tarkwa Gold JV Ltd, set economic interest to `50`, save. Return to inventory A | The drift warning is gone: fact and treatment agree again. Nothing else moved: still FROZEN v2, both versions unchanged, Run 001 untouched. Editing an entity never rewrites a boundary | ☐ P ☐ F | |
| J14 | Edit the entity back to `40`, then in inventory A **Mark as final** on Run 001 | The drift warning returns, naming 50% against 40%. Leave it: it is a true statement about this inventory. The chip reads **FINAL · BOUNDARY v2** again, ready for section N | ☐ P ☐ F | |

---

## K. Tenant isolation (spec 01)

Copy inventory A's URL out of the analyst's private window first, then work
in the normal window, which A9 left signed out.

| # | Step | Expected result | Verdict | Notes |
| --- | --- | --- | --- | --- |
| K1 | Sign in as **the outsider** (A8) and open `/app/ghg` | "No organizations yet". Sankofa Gold is invisible, not merely unopenable | ☐ P ☐ F | |
| K2 | Paste Sankofa's organization URL (`/app/ghg/<id>`) | "Organization not found", **not** an access-denied message. Outsiders must not be able to confirm the id exists | ☐ P ☐ F | |
| K3 | Paste inventory A's URL (`/app/ghg/<id>/inventories/<id>`) | Same "Organization not found" card. The workspace shell refuses before any inventory is fetched | ☐ P ☐ F | |
| K4 | Paste the factor library URL (`/app/ghg/<id>/factors`) | Same card. The library is shared between signed-in users, but it is not a way into someone else's workspace | ☐ P ☐ F | |
| K5 | Sign out, sign back in as the **ADMIN**, and open `/app/ghg` | Sankofa Gold plc is listed, alongside every other tenant's organizations | ☐ P ☐ F | |

---

## L. API spot-checks (terminal, optional)

Skip this section if you don't have a terminal with `curl`.

### L1. GHG API is closed when signed out

```
curl -s -o /dev/null -w "%{http_code}\n" \
  https://frontend-staging-2e61.up.railway.app/api/ghg/organizations
```

**Expect:** `401`.
Verdict: ☐ pass ☐ fail. Notes:

### L2. The shared factor library still needs a session

```
curl -s -o /dev/null -w "%{http_code}\n" \
  https://frontend-staging-2e61.up.railway.app/api/ghg/emission-factors
```

**Expect:** `401`. "Shared, read-only" means shared between signed-in users,
not public.
Verdict: ☐ pass ☐ fail. Notes:

### L3. Cross-tenant reads are 404, not 403

In **the outsider's** browser dev-tools console, with Sankofa's organization
id:

```
fetch('/api/ghg/organizations/<sankofa-org-id>').then(r => console.log(r.status))
```

**Expect:** `404`. A `403` would confirm the id exists and is a bug.
Verdict: ☐ pass ☐ fail. Notes:

---

## M. Inventory C: membership windows and scope as a decision

A third inventory under **equity share** exercises spec 03.2 and spec 04.1.
Record the three extra facts first (R13, R14, R15 from the scenario).

| # | Step | Expected result | Verdict | Notes |
| --- | --- | --- | --- | --- |
| M1 | **Activity data** → record **R13**, **R14**, **R15** and **R16** as listed in the scenario (R15 in the registered unit **tonne**, not the custom one) | Sixteen rows | ☐ P ☐ F | |
| M2 | **Inventories** → **New inventory**: name `2025 Acquisition View`, same period, purpose `Post-acquisition`, approach **Equity share**. Open it and tick **S1**, **S4** (under Sankofa Gold plc) and **S3** (Takoradi Port Co) | Two entities in the boundary: Sankofa Gold plc at **100%** with S1 and S4 (S5 unticked), Takoradi Port Co at **30%** | ☐ P ☐ F | |
| M3 | On Takoradi Port Co set **Member from** to `2025-07-01` (leave "Member until" empty) | The block shows "member from 2025-07-01". Reporting boundary warns that Takoradi Port Co is a member from 2025-07-01: a partial-period membership | ☐ P ☐ F | |
| M4 | **Review activity data** | Toast "16 new records under review." R14 (Shiploader diesel, 2025-03-31) is `Excluded · Outside boundary` with the detail "Takoradi Port Co: member from 2025-07-01"; R10 (2025-09-30) is included; R2, R5, R6 (S2, S5) are outside the boundary; R12 is outside the period | ☐ P ☐ F | |
| M5 | Classify R1, R3, R4, R7, R8, R9, R10 per the classification table; exclude R11 as **Methodology exclusion** and R16 as **Not applicable** (section P uses it) | As in section F | ☐ P ☐ F | |
| M6 | Classify **R13** (Contractor mining fleet diesel) with **Diesel (/litre)**, then change its **scope** select to **Scope 3** | The category select now lists the fifteen scope 3 categories; it defaults to "1. Purchased goods and services". A muted note reads "suggests Scope 1". Classification WARNs (not HOLD): "'Contractor mining fleet diesel' is classified in scope 3; 'Diesel' suggests scope 1." The same physics, a different relationship to the source | ☐ P ☐ F | |
| M7 | Classify **R15** (ANFO in tonnes) | The picker offers the mass factors including **ANFO explosives detonation (/tonne)**; choose it. Scope 1, category **Process emissions**, no conversion preview | ☐ P ☐ F | |
| M8 | Change R4's **lease type** to **Operating lease (leased in)** | Scope flips to **Scope 3**, category **8. Upstream leased assets**: under equity share an operating lease the company holds is scope 3 (Appendix F). Set it back to "Not a leased asset": scope 2 again | ☐ P ☐ F | |
| M9 | In **Operational boundary declaration**, tick **Business travel**, **Waste generated in operations**, **Purchased goods and services**, write `Other scope 3 categories are immaterial for a single-mine group.` and **Save declaration** | Toast "Operational boundary declaration saved." | ☐ P ☐ F | |
| M10 | In **Market-based scope 2 instruments**, add facility **S4**, instrument **Energy attribute certificate**, `0.05` kg CO₂e per kWh, source `Supplier REC 2025` | A row appears for Accra Corporate Office; toast "Instrument recorded for Accra Corporate Office." | ☐ P ☐ F | |
| M11 | Read Pre-flight checks | Reporting boundary WARN (the partial-period membership), Completeness WARN, Classification WARN (R13's scope choice), Emission factors PASS, Base year PASS. Do **not** freeze yet: section O freezes this inventory | ☐ P ☐ F | |

---

## N. Inventory A: publish and supersede (the lifecycle)

| # | Step | Expected result | Verdict | Notes |
| --- | --- | --- | --- | --- |
| N1 | Open inventory A (FINAL, Run 001) and click **Publish**, then **Cancel** | A dialog titled "Publish the inventory?" warns that nothing can change afterwards and that a correction is a new inventory. Cancelling changes nothing | ☐ P ☐ F | |
| N2 | **Publish** again and confirm | Toast "Inventory published." Chip reads **PUBLISHED · BOUNDARY v2**; the lifecycle card shows the publication date and offers **Create correction**; every control on the page is disabled; **Launch calculation run** and **Delete** on runs are gone | ☐ P ☐ F | |
| N3 | Open Run 001's report and read **Reporting period** | The status reads PUBLISHED with the date | ☐ P ☐ F | |
| N4 | **Inventories** list: try **Delete** on inventory A | No delete button is offered for a published inventory | ☐ P ☐ F | |
| N5 | Back in A, click **Create correction**, keep the default name `2025 Corporate Inventory (correction)`, confirm | Toast names the correction; the browser opens the new inventory: **DRAFT**, same period and approach, the boundary already drawn exactly as A's v2 (Tarkwa Gold JV Ltd at 50%, Takoradi excluded at 0%), no activity reviewed yet | ☐ P ☐ F | |
| N6 | Return to inventory A | The header reads "Superseded by a correction" with a link to the new inventory; the chip reads **PUBLISHED · SUPERSEDED**; **Create correction** is no longer offered | ☐ P ☐ F | |

---

## O. Base year and recalculation (spec 06)

Inventory B (equity share, Run 001 designated final in I7) becomes the base
year. Freezing inventory C, whose boundary differs from B's, must flag a
structural change measured against B's run. By hand, from section I's line
figures: the facilities C leaves out or windows (S2: 8,555,400 + 37,584 kg;
S5: 28,026 kg; S3's window: 247,380 kg) sum to **8,868,390 kg**, which is
**38.92%** of B's 22,784,347.114 kg.

| # | Step | Expected result | Verdict | Notes |
| --- | --- | --- | --- | --- |
| O1 | Sidebar → **Base year** | A card "Base year and recalculation policy" explaining none is designated, with a form: base-year inventory, significance threshold (default `5`), three trigger checkboxes | ☐ P ☐ F | |
| O2 | Choose **2025 Equity Share Inventory**, threshold `5`, all three triggers on, **Designate base year** | The card now reads base year **2025**, the inventory name, threshold 5%, the triggers honoured. "Recalculation history" reads "No recalculation candidates yet." | ☐ P ☐ F | |
| O3 | Open inventory C and **Freeze inventory** | Toast "Inventory frozen as boundary v1." Pre-flight's **Base year** gate turns **HOLD**: "Base year flagged for recalculation (structural change: ... 38.92% of base-year emissions, above the 5% threshold, recalculation required)." The reason names Tarkwa Processing Plant removed, Nkran Exploration Camp removed and Takoradi Port Loadout membership window changed. **Launch calculation run** is disabled | ☐ P ☐ F | |
| O4 | Open inventory B (the base year itself) and read its Pre-flight checks | The same flag appears as a **WARN**ing, not a hold: the base-year inventory must stay runnable, because a recalculated base is one of its runs | ☐ P ☐ F | |
| O5 | Sidebar → **Base year** → in the history, **Decline** the candidate with the note `Divestments are reflected in the 2025 acquisition view; the base year is kept as established.` | The candidate reads DECLINED with your email, the time and the note. Inventory C's Base year gate returns to **PASS** | ☐ P ☐ F | |
| O6 | In inventory C, launch `Run 001` and read the report's **Base year** section | It names 2025, the base-year inventory, the 5% threshold, the original base figure **22,784.35 t CO₂e**, and the declined recalculation with its reason and note | ☐ P ☐ F | |

Expected figures for C's Run 001, by hand (S1 and S4 at 100%, S3 at 30%, R3
already corrected to 130,000 litre in J3):

| Line | kg CO₂e |
| --- | --- |
| R1 haul fleet diesel | 12,586,494.182 |
| R3 light vehicle petrol | 281,060.000 |
| R15 ANFO (8,400 t × 170) | 1,428,000.000 |
| R10 shiploader diesel (× 0.3) | 247,380.000 |
| R4 office electricity | 92,610.000 |
| R7 charter flights | 360,750.000 |
| R8 landfill waste | 259,062.932 |
| R9 water | 357,600.000 |
| R13 contractor diesel (scope 3) | 5,586,000.000 |
| **Scope 1 / 2 / 3 / total** | **14,542,934.182 / 92,610.000 / 6,563,412.932 / 21,198,957.114** |

| # | Step | Expected result | Verdict | Notes |
| --- | --- | --- | --- | --- |
| O7 | Read **Emissions by scope** on C's report | **21,198.96 t CO₂e**, split as the table above. Scope 2 shows **location-based 92.61 t** and **market-based 10.5 t** side by side (210,000 kWh × 0.05), with the certificate listed beneath | ☐ P ☐ F | |
| O8 | Read **Operational boundary** | Scopes covered: 1, 2, 3. Declared scope 3 categories: purchased goods and services, waste, business travel, with the rationale; categories actually reported this run match | ☐ P ☐ F | |
| O9 | Read **Emissions by gas** | CH₄ **9,717.749 kg** (272.1 t CO₂e), N₂O **698.976 kg** (185.23 t CO₂e), CO₂ the remainder; HFCs, PFCs, SF₆ and NF₃ absent. Landfill (R8) is almost all CH₄ | ☐ P ☐ F | |
| O10 | Read **Exclusions** | R14 under Outside boundary with "Takoradi Port Co: member from 2025-07-01"; R2, R5, R6 under Outside boundary with "facility not in the boundary"; R11 under Methodology exclusion; R16 under Not applicable; R12 under Outside reporting period | ☐ P ☐ F | |
| O11 | Read **Methodology** | A statement naming Table 1, unit conversion within a dimension, IPCC AR5 potentials and both scope 2 methods; the factor sources list | ☐ P ☐ F | |
| O12 | Find the R13 line | Scope 3, category "1. Purchased goods and services", factor Diesel, **5,586 t CO₂e** | ☐ P ☐ F | |
| O13 | In **Company and organizational boundary**, read Takoradi Port Co's entry | Beneath the entity name the version records "member from 2025-07-01": the version states from when, not only who | ☐ P ☐ F | |

The window now moves, which reconciles R14, changes the boundary and flags a
second, smaller candidate.

| # | Step | Expected result | Verdict | Notes |
| --- | --- | --- | --- | --- |
| O14 | Back in inventory C, **Reopen as draft**, then set Takoradi Port Co's **Member from** to `2025-01-01` | Completeness warns "'Shiploader diesel (Q1)' (2025-03-31) is excluded for a reason that no longer holds" | ☐ P ☐ F | |
| O15 | **Review activity data** | Toast "1 stale decision refreshed." R14 is now included and unclassified; classify it with **Diesel (/litre)** | ☐ P ☐ F | |
| O16 | Set Takoradi Port Co's **Member until** to `2025-06-30` | Reporting boundary turns **HOLD**: "Included activity 'Shiploader diesel' (Takoradi Port Loadout, 2025-09-30) is outside the boundary (Takoradi Port Co: member from 2025-01-01 until 2025-06-30)": R10 now falls after the window | ☐ P ☐ F | |
| O17 | Click **Clear** on the membership window | Both dates empty; the error and the partial-period warning are gone; R10 and R14 both included | ☐ P ☐ F | |
| O18 | **Freeze inventory** and confirm | Toast "Inventory frozen as boundary v2." Pre-flight's **Base year** gate reads **WARN**, not hold: "structural change: Takoradi Port Loadout membership window changed; 1.09% of base-year emissions, below the 5% threshold, recalculation optional" (R10's 247,380 kg against B's total). Only the window changed between v1 and v2 | ☐ P ☐ F | |
| O19 | Launch `Run 002` | Total **21,278.76 t CO₂e** (Run 001 plus R14's 100,000 litre × 2.66 × 30% = **79.8 t**); the Exclusions section no longer lists R14 | ☐ P ☐ F | |
| O20 | Open **Run 001**'s report again | Its Exclusions section still lists R14 under Outside boundary with "member from 2025-07-01", and its boundary card still shows the window: a run's exclusions are a snapshot, not a live view | ☐ P ☐ F | |
| O21 | Open inventory B and launch `Run 002` there | B is FINAL, and runs stay allowed: total **22,805.97 t CO₂e** (Run 001 plus R3's correction from J3, 10,000 litre × 2.162 = 21.62 t). Do not mark it final | ☐ P ☐ F | |
| O22 | Sidebar → **Base year** → on the second, optional candidate click **Record recalculated base**, choose B's **Run 002**, note `Base restated for the corrected petrol volume.` | The candidate reads RECALCULATED, naming the run, your email and the note | ☐ P ☐ F | |
| O23 | Open inventory C's **Run 002** report, section **Base year** | The original base **22,784.35 t** and, in the history, the recalculated base **22,805.97 t** beside the reason: both base years are readable | ☐ P ☐ F | |
| O24 | **Facilities** → **Add facility** `Kumasi Assay Lab`, `Kumasi, Ghana`, entity Sankofa Gold plc. In inventory C, **Reopen as draft**, tick the new facility in, **Freeze inventory** | Toast "Inventory frozen as boundary v3." No new candidate appears under **Base year** (still two): a facility with no base-year emissions is organic growth, not a structural change | ☐ P ☐ F | |
| O25 | **Base year** → **Edit policy**: threshold `3`, untick "methodology changes", **Save policy** | The card reads threshold 3% and the triggers honoured; the history is untouched | ☐ P ☐ F | |

---

## P. GWP set, biogenic CO₂ and leases under operational control (spec 07.1, 04.1)

| # | Step | Expected result | Verdict | Notes |
| --- | --- | --- | --- | --- |
| P1 | **New inventory**: name `2025 AR6 check`, same period, approach **Operational control**, GWP set **AR6**. Open it and tick **S1** and **S4** in | Header pill reads **GWP AR6** | ☐ P ☐ F | |
| P2 | **Review activity data**, then classify **R8** with Waste to landfill, **R16** with **Wood pellets (biomass)**, and **R4** with Grid electricity (Ghana) setting its **lease type** to **Operating lease (leased in)** | R4 stays **Scope 2**, Purchased electricity: under operational control an asset the company leases in and operates is scope 1 or 2 whatever the lease type (contrast M8 under equity share). Classification stays **PASS**: the scope matches the factor's suggestion | ☐ P ☐ F | |
| P3 | Exclude every other included record (R1, R3, R7, R9, R11, R13, R15) as **Not applicable**; **Freeze inventory**; launch `Run 001` | Total **350.93 t CO₂e**: R8 **258.16 t** (258,163.005 kg: 12.2 CO₂ + 15.5 × 27.9 CH₄ = 444.65 per tonne × 580.598 t, against 259.06 t under AR5 in earlier runs), R16 **153.48 kg** (10 t × (0.1 × 27.9 + 0.046 × 273)), R4 **92.61 t**. Methodology names IPCC AR6 | ☐ P ☐ F | |
| P4 | Read **Biogenic CO₂** | **18 t** (10 t × 1,800 kg), stated as outside the scopes; the total above does not include it | ☐ P ☐ F | |
| P5 | Read **Emissions by gas** | CH₄ **9,000.273 kg** (8,999.273 from the landfill plus 1 from the pellets), N₂O **0.46 kg** (the pellets); HFCs, PFCs, SF₆, NF₃ absent | ☐ P ☐ F | |

---

## Q. Inventory D: financial control, and the end of the base year

Under **financial control** a jointly controlled venture is accounted at its
economic interest, the Table 1 row spec 03.1 was written for.

| # | Step | Expected result | Verdict | Notes |
| --- | --- | --- | --- | --- |
| Q1 | **New inventory**: name `2025 Financial Control View`, same period, approach **Financial control**. Open it and tick **S2** in | Tarkwa Gold JV Ltd enters at **40%** with the row "joint venture under joint financial control; financial control: 40% economic interest (jointly controlled)" | ☐ P ☐ F | |
| Q2 | Tick **S3** in, then untick it again | Takoradi Port Co enters at **0%** (associate, no control), then leaves the boundary entirely when its last facility is unticked: the entity block returns to unticked | ☐ P ☐ F | |
| Q3 | **Review activity data**, classify **R2** with Grid electricity (Ghana) and **R6** with Refrigerant R-410A leakage | Only R2 and R6 are included; every record at S1, S3, S4 and S5 is `Excluded · Outside boundary` with "facility not in the boundary", and R12 is outside the period | ☐ P ☐ F | |
| Q4 | **Freeze inventory** | Toast "Inventory frozen as boundary v1." No base-year candidate appears: the base year is an equity-share inventory and this is the inventory's first version, so there is nothing comparable to measure against | ☐ P ☐ F | |
| Q5 | Launch `Run 001` | Total **8,592.98 t CO₂e**: R2 **8,555.4 t** (48,500,000 kWh × 0.441 × 40%) and R6 **37.58 t** (45 kg × 2,088 × 40%), both at weight **40%**. Under operational control (section H) the same plant counted at 100%; under equity share at 40%; here at 40% because Sankofa jointly controls it | ☐ P ☐ F | |
| Q6 | Read **Emissions by gas** | HFCs **37.58 t CO₂e** with no kg figure (a blend, per the footnote) | ☐ P ☐ F | |
| Q7 | Sidebar → **Base year** → **Clear base year** | The card returns to the designation form and the history is gone. Open inventory C's Run 002 report: the Base year section now reads that no base year is designated | ☐ P ☐ F | |

---

## Sign-off

| Field | Value |
| --- | --- |
| App version / date deployed | |
| Tester / date | |
| Cases failed | |
| Follow-up issues filed | |

**Known gaps and non-goals** (do not report as bugs):

1. **Editing an inventory** (name, period, purpose, approach) is API-only:
   there is no Edit button. Delete and recreate.
2. **No password self-service** (spec 01 non-goal). The temporary password
   an admin sets in A6 is the account's password for good: there is no change,
   reset, or forced-rotation flow, and creating a user sends no email.
3. Non-goals: no report export (CSV/PDF), no evidence *file* upload (string
   reference only), no activity-record versioning, no per-assignment share
   overrides, no conversion/methodology/duplicate gates, no automatic
   recalculation arithmetic (a recalculated base is a run the accountant
   launches), and HFC/PFC blends stay on their source's GWP basis.
4. The **emission-factor library is seed-only**. A new factor needs a
   migration. The seeded values are explicitly approximate pending a curated
   library.
