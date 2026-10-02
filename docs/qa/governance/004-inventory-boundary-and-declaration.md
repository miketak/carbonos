<!-- generated from qa/packs/governance/004-inventory-boundary-and-declaration.yaml by make qa-export; edit the YAML -->
# Procedure 4: Inventory, boundary and declaration

**Objective.** Confirm that an inventory starts from its consolidation approach with the boundary pre-populated from Table 1, that every operation is either in the boundary or left out with a reason the report discloses, that an entity's share and membership window are effective-dated, that the scope 3 declaration cross-checks the classification, and that the freeze waits for a clean view.

**Covers** [spec 05](../../../specs/05-inventories-and-calculation.md), [spec 05.1](../../../specs/05.1-inventory-lifecycle-and-run-snapshots.md), [spec 05.6](../../../specs/05.6-the-inventory-workbench.md), [spec 03](../../../specs/03-organizational-boundary.md), [spec 03.2](../../../specs/03.2-effective-dated-membership.md), [spec 03.4](../../../specs/03.4-entity-dates-facility-attributes-and-boundary-prefill.md), [spec 07.2](../../../specs/07.2-required-disclosures.md) and [spec 07.6](../../../specs/07.6-scope2-instrument-criteria-and-scope3-crosscheck.md). The declaration half of spec 07.6.

**Estimated time:** 35 minutes.

**Procedure version:** 3 (2026-10-02). The change notes are at the foot.

**Run this procedure** after procedure 3. Procedure 5 classifies the view it builds.

## Prerequisites

- Adansi Foods Ltd as procedure 3 leaves it: ten records, ACT-0001 to ACT-0010.
- Ama in the normal window.

## A. Creating the inventory

### A1. Pre-population from the approach

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Ama Owusu in the private window, sign in as "Ama Owusu". | Ama Owusu is signed in. |  |  |
| 2 | Open **Inventories** and click **New inventory**. Name "FY2025", period 2025-01-01 to 2025-12-31, consolidation approach operational control, GWP set AR5, straddling records **Pro-rate by days (default)**, and **Start with every operation the approach includes in the boundary** ticked. Click **Create inventory**. | The list shows "FY2025" as DRAFT with **Open**: "FY2025 created." appears first. |  |  |
| 3 | Open the inventory "FY2025" (**Open**). | The workbench opens on **Records** with 5 tabs: **Records**, **Boundary**, **Method**, **Runs**, **Report**. The header reads DRAFT. |  |  |
| 4 | On the inventory "FY2025", open **Boundary**. | Adansi Foods Ltd is in the boundary; Kumasi Plant is in. Adansi Logistics Ltd is in the boundary; Tema Depot is in. Coldstore Ghana Ltd is out of the boundary; it reads "Outside the boundary under operational control" at 0% from its Table 1 row; its checkbox is disabled; its row asks "Why is it left out?": its 0% comes from its Table 1 row, an associate under operational control. |  |  |
| 5 | On the inventory "FY2025", open **Boundary**. | **Member from** reads 2025-07-01: Member from is taken from the acquisition date. |  |  |

### A2. The period hint

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **New inventory**, set the period 2025-01-01 to 2026-06-30, and read the form before saving. | The form says "This period is 18 months. Chapter 9 expects an annual inventory; keep it only if the period is deliberate.": it can still be saved. |  |  |
| 2 | Click **New inventory**, set the period 2025-07-01 to 2026-06-30, and read the form before saving. | The form says "A fiscal year: the inventory will be labelled FY2025/26.". |  |  |
| 3 | Click **Cancel** in "New inventory". |  |  |  |

## B. The boundary

### B1. An operation left out needs a reason

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On **Boundary**, untick **Tema Depot in boundary**. | Adansi Logistics Ltd is out of the boundary; Tema Depot is out; its row asks "Why is it left out?": unticking E1's only facility unticks E1, and the reason control appears on the entity's row. |  |  |
| 2 | Read the **Reporting boundary** gate on the pre-flight panel under **Records**. | An error on the **Reporting boundary** gate: "'Tema Depot' (Adansi Logistics Ltd) is neither in the boundary nor excluded with a reason. Tick it in, or record why it is left out.": the facility is named first: the reason is recorded on its entity's row. |  |  |
| 3 | On Adansi Logistics Ltd's row, choose **Not applicable** with the detail "Scratch: testing the exclusion flow". | The **Reporting boundary** gate no longer says "is neither in the boundary nor excluded with a reason". A warning on the **Reporting boundary** gate: "Adansi Logistics Ltd is excluded as not applicable in the period but holds a 100% share under this approach: the report discloses the exclusion.": the error becomes a warning, the entity holds a 100% share under this approach. |  |  |
| 4 | On **Boundary**, tick **Tema Depot in boundary**. | Adansi Logistics Ltd is in the boundary; no reason is recorded: an operation back in the boundary carries no exclusion. |  |  |

### B2. The associate is disclosed, and can be excluded on method

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Read the **Reporting boundary** gate on the pre-flight panel under **Records**. | A warning on the **Reporting boundary** gate: "Coldstore Ghana Ltd has a 0% accounting share under operational control, so its facilities are outside the boundary under this approach and the report discloses the exclusion. Record why it is left out so the report says so.". |  |  |
| 2 | On Coldstore Ghana Ltd's row, choose **Methodology exclusion** with the detail "Associate: no operational control". | The **Reporting boundary** gate no longer says "Record why it is left out so the report says so". The row reads left out: **Methodology exclusion**. |  |  |

### B3. A share override is compared with the entity record

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On Adansi Logistics Ltd's row, change the economic interest to 80. | A warning on the **Reporting boundary** gate: "differs from the entity record". Adansi Logistics Ltd is listed with 100% under equity share: the override is for this inventory only; Legal entities still reads 100%. |  |  |
| 2 | On Adansi Logistics Ltd's row, change the economic interest to 100. | The **Reporting boundary** gate no longer says "differs from the entity record". |  |  |

### B4. A membership window is effective-dated

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On the inventory "FY2025", open **Boundary**. | **Member from** reads 2025-07-01. A warning on the **Reporting boundary** gate: "Adansi Logistics Ltd is a member from 2025-07-01: a partial-period membership, accounted from that date.". |  |  |
| 2 | Set **Member until** to 2025-06-30 on Adansi Logistics Ltd's row. | Refused: "The membership window ends before it starts.": clear the typed date; the window stays as it was. |  |  |
| 3 | Look. | Note for procedure 5: ACT-0007 (Tema Depot, May 2025) falls before the window. Review will exclude it with the computed detail "member from 2025-07-01". |  |  |

## C. The declaration

### C1. A declared category without lines warns, and a reason silences it

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In the operational boundary declaration, tick **15. Investments**, and click **Save declaration**. | A warning on the **Classification** gate: "Scope 3 '15. Investments' is declared as covered but no included record is classified into it: a reader takes 'covered' to mean quantified. Classify records into it, or say in the declaration why it is not quantified this year.": "Operational boundary declaration saved." first. |  |  |
| 2 | In the operational boundary declaration, tick **15. Investments**, in the reason for not quantifying 15. Investments this year, type "n/a", and click **Save declaration**. | Refused inline: "Say why '15. Investments' is not quantified (at least 10 characters).". |  |  |
| 3 | In the operational boundary declaration, tick **15. Investments**, in the reason for not quantifying 15. Investments this year, type "Minority holding; no emissions data available this year", and click **Save declaration**. | The **Classification** gate no longer says "is declared as covered but no included record is classified into it": the report will print the category as "declared, not quantified" with the reason. |  |  |
| 4 | On the inventory "FY2025", open **Boundary**. | **6. Business travel** stays unticked. **1. Purchased goods and services** stays unticked: procedure 5 classifies records into both and reads the cross-check the other way round. |  |  |

## D. The freeze waits for a clean view

### D1. Unclassified records block the freeze, and the boundary stays live

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **Review activity data**. |  |  |  |
| 2 | Click **Freeze inventory**. | The dialog "Freeze the inventory?" shows the gate summary first and refuses with "8 records are not classified; classify or exclude them first". Its **Freeze inventory** button is disabled. |  |  |
| 3 | Click **Cancel** in "Freeze the inventory?". |  |  |  |
| 4 | On **Boundary**, untick **Tema Depot in boundary**. | Tema Depot leaves the boundary. |  |  |
| 5 | On **Boundary**, tick **Tema Depot in boundary**. | The header reads DRAFT: the boundary is still editable: nothing is frozen. |  |  |

## E. The levers procedures 5 and 6 pull

### E1. Edit inventory

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **Edit inventory**. | The form offers **Name**, **Period start**, **Period end**, **Records that straddle the period or a membership window**, **Purpose (optional)**, **Consolidation approach**, **GWP set**. |  |  |
| 2 | Click **Cancel** in "Edit inventory". | Procedure 5 sets the straddle treatment to Block the run until the record is split and back; procedure 6 sets the GWP set to AR6 and back. The declaration stays on Boundary; Method holds the upstream rules, the instruments and the residual mix. |  |  |

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals:** renaming a facility inside a frozen version (the mining pack); an empty boundary; a financial-control inventory, which would consolidate the associate by decision; deleting a facility inside a frozen boundary.

## Change notes

- **Version 2, 2026-09-29.** C1 step 1 quotes the declaration warning with the category's report label, "Scope 3 '15. Investments' ..." (PR #119).
- **Version 3, 2026-10-02.** Transliterated to the QA scenario DSL. The gate findings are read from the validation report as well as from the pre-flight panel; the freeze refusal is checked against the records the server lists; the period hint and the edit form are observed on screen only.
