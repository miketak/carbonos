# Procedure 8: Base year and the organization's record

**Objective.** Confirm that a base year is designated with its reason and
policy, that the designation weighs the years already frozen, that a
divestment undone is superseded rather than raised twice, that candidates
are decided against a run of the base-year inventory or a typed share,
that a different GWP set is flagged, and that the organization is not
deleted while its published record stands.

**Covers** [spec 06](../../../specs/06-tracking-emissions-over-time.md),
[spec 06.1](../../../specs/06.1-recalculation-policy-conformance.md),
[spec 01.3](../../../specs/01.3-organization-confidentiality-and-deletion-safeguards.md),
[spec 01.7](../../../specs/01.7-the-organization-settings-area.md) and
[spec 02.11](../../../specs/02.11-approval-as-a-control.md) (a factor
never applied is deleted).

**Estimated time:** 30 minutes.

**Run this procedure** last.

## Prerequisites

- FY2025 published with Run 005 final (procedure 6); FY2026 frozen with
  one run (procedure 7); the equity view a draft.
- Ama in the normal window; Yaw in the private window for case F2.

This share holds if every record was classified as procedure 5
lists: Tema Depot's only line in Run 005 is the delivery fleet diesel,
13,307.75 kg of 120,373.32 kg, 11.06%.

## A. A later year drops a facility before the designation

### A1. FY2026 without Tema Depot

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open FY2026, click **Reopen as draft** with the reason "Depot sold in January 2026", and on **Boundary** untick **Tema Depot in boundary**. | E1 leaves the boundary with its only facility; the reason control appears on E1's row. | | |
| 2 | Choose **Not applicable** with the detail "Depot sold on 2026-01-31; no operation in the period". Freeze. | "Boundary version 2". No candidate is raised: there is no base year yet. | | |

## B. The designation sweeps the years already frozen

### B1. A base year needs its reason and policy

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open **Base year** and click **Designate base year**. Choose FY2025, significance threshold 5, the reason "First year with metered data at every site", and **From the transaction date (membership windows)**. Save. | The page shows the year, the reason, "5% of base-year emissions" and the convention. **Established by** reads "Run 005 · 120.37 t CO₂e", the final run of the published inventory. | | |
| 2 | Read the candidates. | One FLAGGED candidate at once, against FY2026 version 2: "structural change: Tema Depot removed; 11.06% of base-year emissions, above the 5% threshold, recalculation required". The designation weighed the frozen year without a new freeze. | | |
| 3 | Open FY2026 and read the **Base year** gate. | An error: "Base year flagged for recalculation (structural change: Tema Depot removed; 11.06% of base-year emissions, above the 5% threshold, recalculation required). Record the decision under the organization's base year.". | | |
| 4 | Click **Mark as final** on FY2026's run. | Refused: "The 2025 base year has a recalculation candidate above the significance threshold (structural change: Tema Depot removed; 11.06% of base-year emissions, above the 5% threshold, recalculation required). An inventory that reports against the base year cannot be marked final until the recalculation is completed or declined. Calculation runs stay available, because quantifying the movement is how a recalculation is assessed.". The pre-flight bar reads "Base year holds the final designation; runs stay available." Launch a run: it goes through. | | |
| 5 | Open the equity view and read its gate. | A warning, not an error, ending "This inventory is not held because it is an equity share view and the base year is operational control". | | |

## C. Undoing the removal supersedes the candidate

### C1. Put back as the base year held it

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Reopen FY2026 with the reason "Sale fell through", tick Tema Depot back in, and freeze. | "Boundary version 3". On **Base year** the candidate reads SUPERSEDED with "put back in boundary version 3 as the base year held it". FY2026's gate passes. | | |
| 2 | Reopen with the reason "Sale completed after all", untick Tema Depot with the same reason as case A1, and freeze. | "Boundary version 4". A new FLAGGED candidate reads "structural change: Tema Depot removed; 11.06% of base-year emissions, above the 5% threshold, recalculation required". | | |

## D. Deciding

### D1. A recalculated base is a run of the base-year inventory

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On the flagged candidate click **Record recalculated base** and read the list under **Recalculated base run**. | Only FY2025's runs are offered, each with its total. | | |
| 2 | Pick "Run 002 · 120.46 t CO₂e" and confirm. | The card reads RECALCULATED with Ama's email and "recalculated base: Run 002". FY2026's gate passes. | | |

### D2. Manual candidates need a share or a comparison run

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **Raise a candidate**: trigger **Significant error corrected**, what changed "Scratch: reading the refusal", no share, no comparison run. Submit. | Refused: "Give the affected share of base-year emissions, or name a comparison run of the base-year inventory.". | | |
| 2 | Change the trigger to methodology change, what changed "Grid factor vintage moved to ghana-2027-gov", affected share 2.87. Submit. | A FLAGGED card reads "2.87% of base-year emissions, below the 5% threshold, recalculation optional". The running sum restarted at the recalculation of case D1, so the 11.06% is not added to it. | | |
| 3 | Click **Decline** on it with the note "Below the 5% threshold; the notice records the answer". | DECLINED with the note and Ama's email. Had this candidate been raised before case D1's recalculation, the next structural change would have read "11.06% of base-year emissions on its own, 13.93% together with 1 earlier change since the 2025 base year": the running sum counts every candidate since the base or the last recalculation, declined ones included. | | |

## E. A different GWP set is flagged

### E1. FY2026 on AR6 against an AR5 base year

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Reopen FY2026 with the reason "Reading the GWP flag", **Edit inventory**, GWP set AR6, save, freeze, launch a run, and open its report. | The base-year section reads "This run and the base year use different GWP sets; the required-gases amendment recommends the same set for both.". | | |
| 2 | Reopen, set AR5 back, and freeze. | FY2026 is where procedure 7 left it, one boundary version on. | | |

## F. The organization's record

### F1. A published record keeps the organization

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On **Emission factors**, delete "R-410A (composition)". | Deleted: no classification and no run ever applied it. Try the same on "Long-haul flights (supplier)": refused, it was applied by a calculation run; set its validity end to retire it instead. | | |
| 2 | Open **Settings**, and under **Danger zone** click **Delete organization**. | The dialog lists "FY2025: Published" and refuses: "Publish records are kept: withdraw the final designation or supersede the published inventory first.". | | |
| 3 | Read **History**. | Members added, support access assumed and ended, and every act since, each with an email and a moment. | | |

### F2. A scratch organization is deleted with its name typed

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Yaw in the private window, open **Solo Ltd**, **Settings**, **Delete organization**. Type `solo ltd` and a reason. | **Delete** stays disabled: the name must match exactly. | | |
| 2 | Type `Solo Ltd` with the reason "Scratch organization of the governance pack" and confirm. | Solo Ltd leaves the list and its URL is not found. The dialog said the record of who removed it, when and why is kept. | | |
| 3 | As Admin A, open the administration dashboard. | **Organizations** counts Adansi Foods Ltd alone. | | |

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals:** the whole-year convention and its warnings (one
policy per organization; the pack keeps the transaction date); an
error-correction candidate weighed against a comparison run (the mining
pack); a second structural change accumulated with the first.
