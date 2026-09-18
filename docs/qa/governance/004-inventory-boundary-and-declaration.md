# Procedure 4: Inventory, boundary and declaration

**Objective.** Confirm that an inventory starts from its consolidation
approach with the boundary pre-populated from Table 1, that every
operation is either in the boundary or left out with a reason the report
discloses, that an entity's share and membership window are effective-dated,
that the scope 3 declaration cross-checks the classification, and that the
freeze waits for a clean view.

**Covers** [spec 05](../../../specs/05-inventories-and-calculation.md),
[spec 05.1](../../../specs/05.1-inventory-lifecycle-and-run-snapshots.md),
[spec 05.6](../../../specs/05.6-the-inventory-workbench.md),
[spec 03](../../../specs/03-organizational-boundary.md),
[spec 03.2](../../../specs/03.2-effective-dated-membership.md),
[spec 03.4](../../../specs/03.4-entity-dates-facility-attributes-and-boundary-prefill.md),
[spec 07.2](../../../specs/07.2-required-disclosures.md) and the
declaration half of
[spec 07.6](../../../specs/07.6-scope2-instrument-criteria-and-scope3-crosscheck.md).

**Estimated time:** 35 minutes.

**Run this procedure** after procedure 3. Procedure 5 classifies the view
it builds.

## Prerequisites

- Adansi Foods Ltd as procedure 3 leaves it: ten records, ACT-0001 to
  ACT-0010.
- Ama in the normal window.

## A. Creating the inventory

### A1. Pre-population from the approach

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open **Inventories** and click **New inventory**. Name "FY2025", period 2025-01-01 to 2025-12-31, consolidation approach operational control, GWP set AR5, straddling records **Pro-rate by days (default)**, and **Start with every operation the approach includes in the boundary** ticked. Create. | The workbench opens on **Records** with five tabs: **Records**, **Boundary**, **Method**, **Runs** and **Report**. The header reads DRAFT. | | |
| 2 | Open **Boundary**. | Adansi Foods Ltd and Adansi Logistics Ltd are in the boundary with their facilities. Coldstore Ghana Ltd reads "outside the boundary under operational control" at 0% from its Table 1 row; its checkbox is disabled and its row asks why it is left out. | | |
| 3 | Read Adansi Logistics Ltd's row. | **Member from** already reads 2025-07-01, taken from the acquisition date. | | |

### A2. The period hint

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Start another inventory with the period 2025-01-01 to 2026-06-30 and read the form before saving. | The form says the period is 18 months and that Chapter 9 expects an annual inventory. It can still be saved. | | |
| 2 | Change the period to 2025-07-01 to 2026-06-30. | The form says the inventory will be labelled FY2025/26. | | |
| 3 | Cancel. | | | |

## B. The boundary

### B1. An operation left out needs a reason

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On **Boundary**, untick **Tema Depot in boundary**. | Tema Depot leaves the boundary. Unticking E1's only facility unticks E1, and the reason control appears on the entity's row reading "left out without a reason". | | |
| 2 | Read the **Reporting boundary** gate on the pre-flight panel. | An error: "'Tema Depot' (Adansi Logistics Ltd) is neither in the boundary nor excluded with a reason. Tick it in, or record why it is left out.". The facility is named first: the reason is recorded on its entity's row. | | |
| 3 | Choose **Not applicable** with the detail "Scratch: testing the exclusion flow". | The error becomes a warning: the entity is excluded as not applicable while it holds a 100% share under this approach, and the report discloses the exclusion. | | |
| 4 | Tick Tema Depot back in. | The reason is gone. An operation back in the boundary carries no exclusion. | | |

### B2. The associate is disclosed, and can be excluded on method

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Read the **Reporting boundary** gate for Coldstore Ghana Ltd. | A warning: "Coldstore Ghana Ltd has a 0% accounting share under operational control, so its facilities are outside the boundary under this approach and the report discloses the exclusion. Record why it is left out so the report says so.". | | |
| 2 | On its row, choose **Methodology exclusion** with the detail "Associate: no operational control". | The warning goes. The row reads "left out: Methodology exclusion". | | |

### B3. A share override is compared with the entity record

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On Adansi Logistics Ltd's row, change the economic interest to 80. | The gate warns that the share in this view differs from the entity record. The override is for this inventory only; **Legal entities** still reads 100%. | | |
| 2 | Set it back to 100. | The warning goes. | | |

### B4. A membership window is effective-dated

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | With **Member from** 2025-07-01 on Adansi Logistics Ltd, read the gate. | A warning that the entity is a partial-period membership, accounted from that date. | | |
| 2 | Set **Member until** to 2025-06-30. | Refused: "The membership window ends before it starts.". Clear it. | | |
| 3 | Note for procedure 5: ACT-0007 (Tema Depot, May 2025) falls before the window. | Review will exclude it with the computed detail "member from 2025-07-01". | | |

## C. The declaration

### C1. A declared category without lines warns, and a reason silences it

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On **Boundary**, in the operational boundary declaration under the entities, tick **15. Investments** and save. | "Operational boundary declaration saved.". The **Classification** gate warns that Investments is declared as covered but no included record is classified into it, and that a reader takes "covered" to mean quantified. | | |
| 2 | In the reason for not quantifying it this year, type "n/a". | Refused: the reason needs at least 10 characters. | | |
| 3 | Type "Minority holding; no emissions data available this year" and save. | The warning goes. The report will print the category as "declared, not quantified" with the reason. | | |
| 4 | Leave **6. Business travel** and **1. Purchased goods and services** unticked. | Procedure 5 classifies records into both and reads the cross-check the other way round. | | |

## D. The freeze waits for a clean view

### D1. Unclassified records block the freeze, and the boundary stays live

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **Review activity data**, then click **Freeze inventory**. | The dialog "Freeze the inventory?" shows the gate summary first and refuses with "8 records are not classified; classify or exclude them first". Its **Freeze inventory** button is disabled. | | |
| 2 | Close the dialog and untick, then tick, **Tema Depot in boundary**. | The boundary is still editable: nothing is frozen. | | |

## E. The levers procedures 5 and 6 pull

### E1. Edit inventory

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **Edit inventory**. | The form offers the name, the period, the straddle treatment, the purpose, the consolidation approach and the GWP set. | | |
| 2 | Cancel. | Procedure 5 sets the straddle treatment to **Block the run until the record is split** and back; procedure 6 sets the GWP set to AR6 and back. The declaration stays on **Boundary**; **Method** holds the upstream rules, the instruments and the residual mix. | | |

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals:** renaming a facility inside a frozen version (the
mining pack); an empty boundary; a financial-control inventory, which
would consolidate the associate by decision; deleting a facility inside a
frozen boundary.
