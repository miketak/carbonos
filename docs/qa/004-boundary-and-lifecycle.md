# Procedure 4: Boundary and inventory lifecycle

**Objective.** Confirm that an inventory starts from the consolidation
approach, that every operation left out carries a reason, that freezing
cuts an immutable boundary version, and that the lifecycle refuses every
write it must.

**Covers** [spec 03](../../specs/03-organizational-boundary.md),
[spec 03.2](../../specs/03.2-effective-dated-membership.md),
[spec 03.4](../../specs/03.4-entity-dates-facility-attributes-and-boundary-prefill.md),
[spec 05.1](../../specs/05.1-inventory-lifecycle-and-run-snapshots.md),
[spec 05.4](../../specs/05.4-copying-a-view-across-consolidation-approaches.md)
(a copy across approaches),
[spec 05.5](../../specs/05.5-review-at-scale-and-deliberate-lifecycle-acts.md)
(the freeze gate, the reopen reason, the version labels) and
[spec 07.2](../../specs/07.2-required-disclosures.md) (exclusions).

**Estimated time:** 60 minutes.

**Run this procedure** before a release, and after any change to
inventories, boundaries, versions or the lifecycle.

## Prerequisites

- Sankofa Gold plc as procedures 2 and 3 leave it.

## A. Creating inventories

### A1. Pre-population from the approach

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open **Inventories** and create **2025 Operational**: 2025-01-01 to 2025-12-31, operational control, with **Start with every operation the approach includes in the boundary** ticked (the default). | The inventory is created. | | |
| 2 | Open its boundary. | E0 and E1 are in the boundary with all their facilities. E2 is shown as **outside the boundary under operational control** with 0% from its Table 1 row, and its checkbox is disabled. E2's row asks why it is left out. | | |

### A2. The membership window defaults from the entity's dates

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Create **2025 Financial**: same period, financial control, pre-populated. | The inventory is created. | | |
| 2 | Open its boundary and find E2. | E2 is in the boundary at **100%** ("by decision") with the window "member from 2025-07-01" already set from its acquisition date. | | |

### A3. A twelve-month hint

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Start a new inventory with the period 2025-01-01 to 2026-06-30. | The form says "This period is 18 months. Chapter 9 expects an annual inventory; keep it only if the period is deliberate." and can still be saved. (A twelve-month period that does not start in January, 2025-07-01 to 2026-06-30, shows the fiscal-year label FY2025/26 instead.) | | |
| 2 | Cancel. | | | |

## B. Exclusions

### B1. Unticking is the exclusion flow

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In 2025 Operational, untick S5 (the exploration camp). | S5's row shows the reason control ("Why is it left out?"). | | |
| 2 | Open the pre-flight (the launch section). | The **Reporting boundary** gate blocks: "'Nkran Exploration Camp' (Sankofa Gold plc) is neither in the boundary nor excluded with a reason. Tick it in, or record why it is left out.". | | |

### B2. Recording the reasons

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On S5, choose **Not applicable** with the detail "Exploration camp; LPG only, screened at under 0.2% of the total". (S5 carries the two April LPG records of procedure 3, so the detail must not claim the camp used no fuel.) | The row shows its reason. | | |
| 2 | On E2, choose **Methodology exclusion** with the detail "Associate: no operational control". | Both rows show their reason. The **Reporting boundary** gate no longer lists them. | | |

### B3. Ticking an operation back in retires its exclusion

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Tick S5 back in. | The reason is gone after ticking in. | | |
| 2 | Untick it again. | Unticking asks for it again. | | |

### B4. Entity overrides apply to the whole entity

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On E1's row, set the economic interest to 45 for this inventory only. | The boundary shows E1's economic interest as 45% and the version will record it. E1's accounting share stays **100%**. | | |
| 2 | Open **Legal entities**. | The entity record still says 40%, and the **Reporting boundary** gate warns: "Tarkwa Gold JV Ltd's treatment (joint venture, 45%, operated) differs from the entity record (joint venture, 40%, operated). Review the boundary.". | | |

Under operational control Table 1 gives the operator 100% whatever its
interest (Corporate Standard chapter 3), so the override changes nothing
in this inventory's arithmetic and only matters in the equity view of D1.

## C. Freezing and versions

### C1. Freezing cuts a version and reads it back

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Record the S5 exclusion again (B3 removed it), then click **Freeze inventory**. | The dialog lists the five gates first, each with "passes" or its counts (**Reporting boundary** carries the draft hold as 1 error and its warnings, among them the S5 exclusion, disclosed because Sankofa Gold plc holds 100%), then says the freeze "cuts boundary version 1". Nothing has been reviewed yet, so no record blocks the freeze and the button is enabled. | | |
| 2 | Confirm. | The inventory is frozen; the toast reads "Inventory frozen as boundary version 1." and the lifecycle bar shows the badge "Boundary version 1". | | |
| 3 | Open **Boundary version history** and expand the version. | The row reads "Boundary version 1 · frozen <time> by <you> · 2 entities, 4 facilities" (S5 is out). Boundary version 1 lists E0 and E1 with their facilities, shares and the 45% override, and records the S5 and E2 exclusions with their reasons. | | |

### C2. A frozen inventory refuses writes

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Look at the boundary checkboxes, the declaration and the instruments card; look for the **Edit inventory** button in the header. | The page disables every boundary, declaration and instrument control and hides the instrument form; **Edit inventory** (name, period, purpose, straddle treatment, approach, GWP set) is shown on drafts only. The lifecycle bar says the inventory is frozen and must be reopened as a draft to change either. | | |
| 2 | If you can alter requests, send a boundary change (`PUT /api/ghg/inventories/{id}/boundary/entities/{entityId}`). | The request is refused (409) with "The inventory is frozen. Reopen it as a draft to change it." | | |
| 3 | Send a period change (`PUT /api/ghg/inventories/{id}`). | The request is refused (409) with "The period, consolidation approach and GWP set cannot change while the inventory is frozen. Reopen it as a draft first." | | |

Runs are allowed (procedure 7).

### C3. Reopening keeps the version

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **Reopen as draft**. | A dialog "Reopen as a draft?" says boundary version 1 stays on the record with your reason and that the next freeze cuts a new boundary version. Its button is disabled until the reason has 10 characters. | | |
| 2 | Type the reason "S5 belongs in the boundary" and confirm. | The inventory is a draft again; the lifecycle bar reads "1 boundary version cut"; the **History** reads "reopened as a draft: S5 belongs in the boundary"; in the version history, version 1 reads "Reopened by <you> on <time>: S5 belongs in the boundary". | | |
| 3 | Tick S5 back in and freeze again. | Boundary version 2 is cut; version 1 stays readable and unchanged, with its reopen line. | | |

Every freeze cuts a new version, even when nothing changed: procedures 5
and 6 each end with a freeze, so the first run in procedure 7 cites
boundary version 4. The report version is a different count (one per
correction, procedure 8), and the product always says which it means.

### C4. Renaming a facility does not rewrite a version

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Rename S4 to "Accra Head Office" under **Facilities**. | The facility is renamed. | | |
| 2 | Open version 1. | Version 1 still shows "Accra Corporate Office". | | |

### C5. An empty boundary cannot be frozen

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Create **Empty test** without pre-population and try to freeze it. | **Freeze inventory** is disabled ("Add at least one facility first") and the **Reporting boundary** gate says "The organizational boundary is empty: add at least one facility." | | |
| 2 | Delete the inventory afterwards. | | | |

## D. Copying a view

### D1. A second inventory copies the first, and across approaches the boundary follows Table 1

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Start **2025 Equity** with equity share and **Copy the view from (optional)** set to 2025 Operational. | The pre-population checkbox is disabled once a source is chosen (the source is listed as "2025 Operational (2025)"). Because the approaches differ, the form says "2025 Operational is under operational control. Under equity share the boundary is rebuilt from Table 1: every entity with a share joins with its facilities, the source's computed exclusions are dropped and listed, and leased assignments take their Appendix F scope under this approach. The decisions themselves are kept." | | |
| 2 | Create it and open its boundary. | The boundary is not the source's: E0 is in at 100%, E1 at **40%** from the entity record (the 45% override of B4 is not copied), and E2 is **in at 30%** with S3 and the window "member from 2025-07-01" from its acquisition date. No exclusion remains: the E2 exclusion of the source was dropped. | | |
| 3 | Read the header. | "View copied from 2025 Operational: 0 decisions inherited, 5 records of this period the source never decided on. Boundary rebuilt from Table 1 under equity share." (no record was classified yet, so no lease moved scope), then the amber notice "1 boundary exclusion of the source was dropped: the operation holds a share under this approach and joins the boundary. Record a reason again if it should stay out." listing "Takoradi Port Co: Methodology exclusion dropped, 30% equity share under this approach". | | |
| 4 | Untick E2 and choose **Methodology exclusion** with the detail "Associate: not operated". | The **Reporting boundary** gate blocks: "Takoradi Port Co is excluded but holds a 30% equity share under this approach. Include it, or record why it emits nothing." Under equity share an associate is in by definition (chapter 3). | | |
| 5 | Change the reason to **Non-GHG activity** with the detail "Port operated by a third party; loadout emissions reported by the operator". | The gate warns instead: "Takoradi Port Co is excluded as a non-GHG operation but holds a 30% equity share under this approach: the report discloses the exclusion." Tick E2 back in afterwards. | | |

A copy within one approach (2025 Operational into a second
operational-control view) keeps the boundary, the exclusions and every
scope as the source had them; the rebuild happens only across approaches.
The dropped-exclusion notice stays on the page until the inventory is
frozen.

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals:** re-populating the boundary of a draft when its
approach changes (its leased assignments are re-derived under Appendix F,
spec 05.4, but the accountant adds or removes operations by hand);
per-facility Table 1 facts (they live on the entity).
