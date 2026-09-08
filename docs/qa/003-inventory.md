# QA procedure: GHG inventory (boundary → calculated inventory)

Manual test script for the GHG accounting workflow, exercised on **staging**:
getting in ([spec 01](../../specs/01-identity-and-access.md)), describing the
organization and its facts ([spec 02](../../specs/02-organization-and-facts.md)),
drawing and freezing the organizational boundary
([spec 03](../../specs/03-organizational-boundary.md)), classifying
([spec 04](../../specs/04-operational-boundary-and-classification.md)),
clearing the gates and calculating
([spec 05](../../specs/05-inventories-and-calculation.md)), and reading the
report ([spec 07](../../specs/07-reporting-and-verification.md)).
Run it top to bottom. The scenario is cumulative, and later sections depend on
state built earlier. Tick a verdict and leave a note on every row.
104 cases, estimated about 3 hours. It is self-contained: no other QA
procedure has to be run first.

**When to run:** before tagging a production release, and after any change to
the `ghg` backend module, the `src/features/ghg` frontend feature, the unit
registry (`UnitConverter`), the validation gates, the boundary lifecycle, the
seeded factor library, or admin user creation in the `user` module.

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
owned open pit, operates a processing plant it owns 40% of through a joint
venture, holds 30% of a port loadout terminal that its JV *partner* operates,
and keeps a head office and an exploration camp.

That shape is the whole point. Under **operational control** Sankofa reports
100% of the plant it runs and nothing of the terminal it doesn't; under
**equity share** it reports 40% and 30%. This script records one set of facts,
then consolidates them twice, into two inventories that must produce two
materially different totals without a single activity record being edited.

### Facilities (organizational facts)

| Ref | Name | Location | Equity share % | Financial control | Operational control |
| --- | --- | --- | --- | --- | --- |
| S1 | Obuasi Ridge Open Pit | Obuasi, Ghana | 100 | ✓ | ✓ |
| S2 | Tarkwa Processing Plant | Tarkwa, Ghana | 40 | ✗ | ✓ (JV, Sankofa operates) |
| S3 | Takoradi Port Loadout | Takoradi, Ghana | 30 | ✗ | ✗ (JV, partner operates) |
| S4 | Accra Corporate Office | Accra, Ghana | 100 | ✓ | ✓ |
| S5 | Nkran Exploration Camp | Ashanti Region, Ghana | 100 | ✓ | ✓ |

These are the facility's *facts*. Each inventory's boundary starts from them
(spec 03) and may override them for that inventory alone.

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

Every row earns its place: R1/R2/R8 exercise the three conversion dimensions
(volume, energy, mass); R7 and R8 trip the data-quality INFO findings; R9 trips
the missing-evidence warning; R10 is the non-operated JV that separates the two
consolidation approaches; R11 is a real mining source with no factor in the
seeded library, recorded in a custom unit; R12 falls outside the reporting
period.

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
| R11 | *none exists*; excluded as **Methodology exclusion** |
| R12 | *none*; auto-excluded, outside the period |

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

## B. Organization and facilities (the facts layer)

| # | Step | Expected result | Verdict | Notes |
| --- | --- | --- | --- | --- |
| B1 | Still signed in as the analyst, click **GHG accounting** on `/app` | Lands on `/app/ghg`, heading "GHG accounting", reading "No organizations yet". No other tenant's data is visible | ☐ P ☐ F | |
| B2 | **New organization** → name `Sankofa Gold plc` → **Create organization** | Card appears reading "0 facilities in the boundary". Click **Open** | ☐ P ☐ F | |
| B3 | On the Overview page, read the setup checklist | Card "From facts to a final inventory" with four steps; only "Add your facilities" offers a CTA | ☐ P ☐ F | |
| B4 | Sidebar → **Facilities** → **Add facility**. Try equity share `150`, then `-1` | Both refused (field is min 0, max 100); nothing saved | ☐ P ☐ F | |
| B5 | Add all five facilities from the facilities table above | Table lists five rows with the right location, equity share, Financial ctrl and Operational ctrl. S2 is the only row with financial control off and operational on; S3 has both off | ☐ P ☐ F | |
| B6 | Read the stat chips above the table | Facilities **5**, Operationally controlled **4 of 5**, Avg ownership **74%** | ☐ P ☐ F | |
| B7 | Return to **Overview** | "Add your facilities" is ticked off; the CTA has moved to "Record activity data" | ☐ P ☐ F | |

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

---

## D. Inventory A: organizational boundary (operational control)

Add **only S1, S4 and S5** to the boundary in this section. S2 and S3 are held
back deliberately so section E can exercise reconciliation.

| # | Step | Expected result | Verdict | Notes |
| --- | --- | --- | --- | --- |
| D1 | Sidebar → **Inventories** → **New inventory**. Name `2025 Corporate Inventory`, period `2025-01-01` → `2025-12-31`, purpose `Corporate reporting`, approach **Operational control** | Created; card shows the approach badge, a **BOUNDARY DRAFT** chip and `2025-01-01 → 2025-12-31 · Corporate reporting`. Open it | ☐ P ☐ F | |
| D2 | Read the header, then scroll to **Pre-flight checks** before touching anything | Beside the approach badge a chip reads **BOUNDARY DRAFT**. Pre-flight badge reads **LAUNCH ON HOLD**; Reporting boundary is **HOLD**, reading "The organizational boundary is empty" | ☐ P ☐ F | |
| D3 | In **Organizational boundary**, tick **S1** into the boundary | Row saves already filled in: ownership **100**, both control boxes ticked, copied from the facility record with nothing typed | ☐ P ☐ F | |
| D4 | Tick **S4** and **S5** in | All three show an accounting share of **100%** under operational control | ☐ P ☐ F | |
| D5 | Re-read Pre-flight checks | Reporting boundary is still **HOLD**, but the finding has changed to "The organizational boundary is a draft. Freeze it to enable a run." Activity data completeness now warns that **12 organizational activity records have not been reviewed** and tells you to run "Review activity data" | ☐ P ☐ F | |

---

## E. Review activity data (assignment sync and reconciliation)

| # | Step | Expected result | Verdict | Notes |
| --- | --- | --- | --- | --- |
| E1 | In **Activity view**, click **Review activity data** | Toast "12 new records under review." Twelve rows appear | ☐ P ☐ F | |
| E2 | Find R12 (`Haul fleet diesel (Q1)`, 2026-02-28) | Status `Excluded · Outside reporting period`, auto-excluded with no user input | ☐ P ☐ F | |
| E3 | Find R2, R6 (S2) and R10 (S3) | All three `Excluded · Outside boundary`, because their facilities are not in this inventory's boundary | ☐ P ☐ F | |
| E4 | Confirm the facts were not touched: open **Activity data** in another tab | All twelve records unchanged. Exclusion is a property of the *view*, never of the fact | ☐ P ☐ F | |
| E5 | Back in the inventory, tick **S2** into the boundary | It arrives prefilled at ownership **40**, financial control **off**, operational control **on**, straight from the facility record. Accounting share shows **100%**: operational control is on, so the equity % is irrelevant under this approach | ☐ P ☐ F | |
| E6 | Tick **S3** in | Prefilled at ownership **30** with both controls **off**. Accounting share shows **0%** | ☐ P ☐ F | |
| E7 | Read Pre-flight checks | Reporting boundary is **HOLD** with two findings: the draft error, and the warning "Takoradi Port Loadout has a 0% accounting share under operational control". Completeness warns that three records are excluded "for a reason that no longer holds" | ☐ P ☐ F | |
| E8 | Click **Review activity data** again | Toast "3 stale decisions refreshed." R2, R6 and R10 flip back to included-and-unclassified. R12 stays excluded, since it is still outside the period | ☐ P ☐ F | |
| E9 | Click **Review activity data** a third time | Toast "All activity records are already reviewed." Nothing changes | ☐ P ☐ F | |

---

## F. Classification and unit conversion

| # | Step | Expected result | Verdict | Notes |
| --- | --- | --- | --- | --- |
| F1 | Read Pre-flight checks | Classification is **HOLD**, one error per unclassified record, e.g. "'Haul fleet diesel' (Obuasi Ridge Open Pit, 2025-06-30) is unclassified" | ☐ P ☐ F | |
| F2 | Open R1's **Classify** dropdown | Only the five *volume-dimension* factors are offered, in this order: Diesel, LPG, Natural gas, Petrol, Water supply. The filter is by dimension, not by exact unit: not one of them is per US-gallon. No energy, mass or distance factor appears | ☐ P ☐ F | |
| F3 | Choose **Diesel (/litre)** for R1 | Preview reads `1,250,000 US-gallon → 4,731,764.73 litre × 2.66 kg CO₂e/litre`. Status becomes `Included` with a Scope 1 badge | ☐ P ☐ F | |
| F4 | Classify R2 with **Grid electricity (Ghana) (/kWh)** | Preview reads `48,500 MWh → 48,500,000 kWh × 0.441 kg CO₂e/kWh`; Scope 2 badge | ☐ P ☐ F | |
| F5 | Classify R8 with **Waste to landfill (/tonne)** | Preview reads `640 short-ton → 580.5982 tonne × 446.2 kg CO₂e/tonne`; Scope 3 badge | ☐ P ☐ F | |
| F6 | Classify R3, R4, R5, R6, R7, R9, R10 per the classification table | No conversion preview on any of them, because the recorded unit already matches the factor's unit | ☐ P ☐ F | |
| F7 | Look at R11 (`tonne ANFO`) before classifying it | Note under the dropdown, beginning "No factor matches tonne ANFO". The dropdown falls back to offering **all** factors | ☐ P ☐ F | |
| F8 | Classify R11 with **Waste to landfill (/tonne)** anyway | Emission factors gate turns **HOLD**, reporting that "'ANFO explosives consumed' is recorded in tonne ANFO (unrecognized) but its factor 'Waste to landfill' is per tonne (mass)", so no conversion between them exists. A custom unit never auto-converts, even to a same-word unit | ☐ P ☐ F | |
| F9 | On R11 click **Exclude…** and read the menu | Seven reasons: Outside reporting period, Outside boundary, Non-GHG activity, Duplicate, Not applicable, Methodology exclusion, Other documented reason | ☐ P ☐ F | |
| F10 | Exclude R11 as **Methodology exclusion** | Status `Excluded · Methodology exclusion`; the Emission factors gate returns to **PASS**. Explosives detonation is a real scope 1 process emission the seeded library cannot classify, so the honest reason is a methodology limit, not that it does not apply | ☐ P ☐ F | |

---

## G. Pre-flight gates (break each one on purpose)

Every step here is reverted before the next section. Do them in order.

| # | Step | Expected result | Verdict | Notes |
| --- | --- | --- | --- | --- |
| G1 | Untick **S1** from the boundary | Reporting boundary gains one error per *included* S1 record (four of them) on top of the draft error, e.g. "Included activity 'Haul fleet diesel' (Obuasi Ridge Open Pit) is outside the boundary" | ☐ P ☐ F | |
| G2 | While blocked, try **Launch calculation run** | Button is disabled; its tooltip reads "Resolve the blocking findings first" | ☐ P ☐ F | |
| G3 | Re-tick **S1** (ownership 100, both controls on) | The four outside-boundary errors disappear. Reporting boundary shows only the draft error and the Takoradi 0%-share warning | ☐ P ☐ F | |
| G4 | On R12's `Excluded · Outside reporting period` chip, click the **✕** to re-include it | Activity data completeness turns **HOLD**, reading "Included activity 'Haul fleet diesel (Q1)' is dated 2026-02-28, outside the reporting period" | ☐ P ☐ F | |
| G5 | Exclude R12 again as **Outside reporting period** | Completeness returns to **WARN** | ☐ P ☐ F | |
| G6 | Read the completeness findings in full | Warning "'Process water abstraction' (2025-12-15) has no evidence reference." Info "'FIFO crew charter flights' (2025-10-31) is calculated data." Info "'Domestic waste to landfill' (2025-11-30) is estimated data." | ☐ P ☐ F | |
| G7 | Read the whole panel | Badge **LAUNCH ON HOLD**, and only the draft error is holding it: Reporting boundary HOLD, Activity data completeness WARN, Classification PASS, Emission factors PASS | ☐ P ☐ F | |
| G8 | In **Organizational boundary**, click **Freeze boundary**, then **Cancel** in the dialog | A dialog titled "Freeze the boundary?" says it records an immutable version of the **5 facilities** currently in the boundary and makes the treatments read-only. Cancelling changes nothing; the chip still reads **BOUNDARY DRAFT** | ☐ P ☐ F | |
| G9 | Click **Freeze boundary** again and confirm | Toast "Boundary frozen as v1." The header chip reads **BOUNDARY FROZEN v1**; the section says "Frozen as version 1"; every checkbox and ownership input is disabled; **Reopen as draft** has replaced the freeze button | ☐ P ☐ F | |
| G10 | Read the new **Version history** under the boundary table | One row: `v1 · frozen <today> by <the analyst's email> · 5 facilities`. Click it: it expands to all five facilities with the ownership, controls and accounting share exactly as set, S3 at **0%** | ☐ P ☐ F | |
| G11 | Read the whole panel | Badge **READY TO LAUNCH**. Reporting boundary WARN (the Takoradi warning only), Activity data completeness WARN, Classification PASS, Emission factors PASS. Warnings never block | ☐ P ☐ F | |

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
| H1 | Leave the run label at `Run 001` and click **Launch calculation run** | Toast "Calculation complete."; the browser navigates to the run detail page | ☐ P ☐ F | |
| H2 | Read the total and the scope breakdown | **35,426.44 t CO₂e**, split as the table above | ☐ P ☐ F | |
| H3 | Count the snapshot lines | **10 lines**. R11 and R12 are excluded, so they never reach the calculation | ☐ P ☐ F | |
| H4 | Read the **Boundary version 1** card above the lines | It names version 1, the approach, and who froze it when, then lists **all five** facilities with the shares the run used. A facility is listed here even when it has no line below: this card is the complete boundary, the lines are only what emitted | ☐ P ☐ F | |
| H5 | Find the R1 line (Haul fleet diesel) | Quantity cell shows the original **and** the converted quantity (`1,250,000 US-gallon → 4,731,764.73 litre`); line total **12,586.49 t CO₂e** | ☐ P ☐ F | |
| H6 | Find the R10 line (Shiploader diesel, Takoradi) | Weight column reads **0%** and the line contributes **0 kg CO₂e**: present in the report, contributing nothing | ☐ P ☐ F | |
| H7 | Find the R2 line (Mill grid electricity) | Weight **100%**, line total **21,388.5 t CO₂e**, because Sankofa owns 40% of this plant but operates it | ☐ P ☐ F | |
| H8 | Go back to the inventory and click **Mark as final** on Run 001 | Run shows a `FINAL` pill; the inventories list shows `FINAL RUN DESIGNATED` | ☐ P ☐ F | |
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
| I2 | Tick all five facilities into the boundary | Every treatment prefills from its facility: shares read **100% / 40% / 30% / 100% / 100%** with nothing typed. The same facts now produce different shares because the approach changed | ☐ P ☐ F | |
| I3 | Read Pre-flight checks | Reporting boundary is **HOLD** for the draft error alone: **no** 0%-share warning this time, because Takoradi contributes 30% under equity share | ☐ P ☐ F | |
| I4 | Click **Review activity data** | Toast "12 new records under review." Inventory A's decisions are not inherited; every assignment starts fresh | ☐ P ☐ F | |
| I5 | Confirm R12's status | `Excluded · Outside reporting period`. Nothing else auto-excludes, because all five facilities are in the boundary | ☐ P ☐ F | |
| I6 | Classify R1–R10 per the classification table; exclude R11 as **Methodology exclusion**; then **Freeze boundary** and confirm | Toast "Boundary frozen as v1." (each inventory numbers its own versions). Badge turns **READY TO LAUNCH** | ☐ P ☐ F | |
| I7 | Launch `Run 001` | Total **22,784.35 t CO₂e**, split as the table above | ☐ P ☐ F | |
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
| J8 | Delete **Run 002** | It disappears; the inventory no longer reports a designated final run, and Run 001 is *not* auto-promoted | ☐ P ☐ F | |
| J9 | Re-designate **Run 001** as final | The FINAL pill returns to Run 001 | ☐ P ☐ F | |
| J10 | In inventory A, click **Reopen as draft** | Toast "Boundary reopened as a draft." Chip reads **BOUNDARY DRAFT**; the inputs are editable again; pre-flight is back on **HOLD** for the draft error; Version history still lists v1 | ☐ P ☐ F | |
| J11 | Change S2's ownership to `50`, then **Freeze boundary** and confirm | Toast "Boundary frozen as v2." Chip reads **BOUNDARY FROZEN v2**, and so does the inventory's card back on the Inventories list. Version history lists v2 above v1. Expand each: v2 shows Tarkwa at 50%, v1 still shows it at 40%. Versions are never rewritten. Reporting boundary now also warns "Tarkwa Processing Plant's treatment (50%, financial no, operational yes) differs from the facility record (40%, financial no, operational yes). Review the boundary.": the treatment and the fact disagree, and the gate says so | ☐ P ☐ F | |
| J12 | Open **Run 001** again | Still **35,426.44 t**, and its **Boundary version 1** card still shows Tarkwa at 40%. A later freeze changes nothing a verifier has already been shown | ☐ P ☐ F | |
| J13 | Sidebar → **Facilities** → **Edit** S2, set equity share to `50`, **Save changes**. Return to inventory A | The drift warning is gone: fact and treatment agree again. Nothing else moved: still FROZEN v2, both versions unchanged, Run 001 untouched. Editing a facility never rewrites a boundary | ☐ P ☐ F | |
| J14 | Edit S2 back to `40` | The drift warning returns, naming 50% against 40%. Leave it: it is a true statement about this inventory | ☐ P ☐ F | |

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

## Sign-off

| Field | Value |
| --- | --- |
| App version / date deployed | |
| Tester / date | |
| Cases failed | |
| Follow-up issues filed | |

**Known gaps and non-goals** (do not report as bugs):

1. **Base year** is accepted by the API but has no field on the new-inventory
   form.
2. **Editing an inventory** (name, period, purpose, approach) is API-only:
   there is no Edit button. Delete and recreate.
3. **No password self-service** (spec 01 non-goal). The temporary password
   an admin sets in A6 is the account's password for good: there is no change,
   reset, or forced-rotation flow, and creating a user sends no email.
4. Spec 003 v1 non-goals: no report export (CSV/PDF), no evidence *file* upload
   (string reference only), no multi-gas breakdown, no base-year
   recalculation, no activity-record versioning, no per-assignment share
   overrides, and no conversion/methodology/GWP/duplicate gates.
5. The **emission-factor library is seed-only**. A new factor needs a
   migration, which is why ANFO (F7–F10) has no factor. The seeded values are
   explicitly approximate pending a curated library.
