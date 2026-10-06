<!-- generated from qa/packs/governance/008-base-year-and-the-record.yaml by make qa-export; edit the YAML -->
# Procedure 8: Base year and the organization's record

**Objective.** Confirm that a base year is designated with its reason and policy, that the designation weighs the years already frozen, that a divestment undone is superseded rather than raised twice, that candidates are decided against a run of the base-year inventory or a typed share, that a different GWP set is flagged, and that the organization is not deleted while its published record stands.

**Covers** [spec 06](../../../specs/06-tracking-emissions-over-time.md), [spec 06.1](../../../specs/06.1-recalculation-policy-conformance.md), [spec 01.3](../../../specs/01.3-organization-confidentiality-and-deletion-safeguards.md), [spec 01.7](../../../specs/01.7-the-organization-settings-area.md) and [spec 02.11](../../../specs/02.11-approval-as-a-control.md). Spec 02.11 for a factor never applied, which is deleted.

**Estimated time:** 30 minutes.

**Procedure version:** 5 (2026-10-06). The change notes are at the foot.

**Run this procedure** after procedure 7. It runs last.

## Prerequisites

- FY2025 published with Run 005 final (procedure 6); FY2026 frozen with one run (procedure 7); the equity view a draft.
- Ama in the normal window; Yaw in the private window for case F2.
- This share holds if every record was classified as procedure 5 lists: Tema Depot's only line in Run 005 is the delivery fleet diesel, 13,307.75 kg of 120,373.32 kg, 11.06%.
- Accounts in this procedure (replace `you+…@…` with aliases of the mailbox you read):
- Ama Owusu signs in with `you+ama@…` (the Ama alias) and `Ama-pass-2026`, in the private window.
- Admin B signs in with `you+adminb@…` (the Admin B alias) and `AdminB-pass-2026`, in the private window.
- Kofi Mensah signs in with `you+kofi@…` (the Kofi alias) and `Kofi-pass-2026`, in the private window.
- Yaw Darko signs in with `you+yaw@…` (the Yaw alias) and `Yaw-pass-2026`, in the private window.
- Admin signs in with your administrator address (the Admin alias) and the password the engineering team sent you, in the normal window.

## A. A later year drops a facility before the designation

### A1. FY2026 without Tema Depot

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Ama Owusu in the private window, sign in as "Ama Owusu" with `you+ama@…` (the Ama alias) and `Ama-pass-2026`. | Ama Owusu is signed in. |  |  |
| 2 | Click **Reopen as draft**, type "Depot sold in January 2026" and confirm. |  |  |  |
| 3 | On **Boundary**, untick **Tema Depot in boundary**. | Adansi Logistics Ltd is out of the boundary; its row asks "Why is it left out?": E1 leaves the boundary with its only facility; the reason control appears on E1's row. |  |  |
| 4 | On Adansi Logistics Ltd's row, choose **Not applicable** with the detail "Depot sold on 2026-01-31; no operation in the period". | The row reads left out: **Not applicable**. |  |  |
| 5 | Click **Freeze inventory**. | The header reads "Boundary version 2". No candidate is raised: **Baseline and targets** still offers **Designate base year**: there is no base year yet. |  |  |

## B. The designation sweeps the years already frozen

### B1. A base year needs its reason and policy

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open **Settings** and the **Baseline and targets** tab. Choose FY2025, significance threshold 5, the reason "First year with metered data at every site", and **From the transaction date (membership windows)**. Click **Designate base year**. | The page shows the year 2025, the reason "First year with metered data at every site", "5% of base-year emissions", the convention **From the transaction date (membership windows)**. **Established by** reads "Base-year run: Run 005 · 120.37 t CO₂e", the final run of the published inventory. |  |  |
| 2 | In Adansi Foods Ltd, open **Baseline and targets**. | A FLAGGED candidate against boundary version 2 reads "structural change: Tema Depot removed; 11.06% of base-year emissions, above the 5% threshold, recalculation required": one FLAGGED candidate at once, against FY2026 version 2: the designation weighed the frozen year without a new freeze. |  |  |
| 3 | Read the **Base year** gate on the pre-flight panel under **Records**. | An error on the **Base year** gate: "Base year flagged for recalculation (structural change: Tema Depot removed; 11.06% of base-year emissions, above the 5% threshold, recalculation required). Record the decision under the organization's base year.". |  |  |
| 4 | On **Runs**, click **Submit for review** on Run 001 and confirm. | Refused: "The 2025 base year has a recalculation candidate above the significance threshold (structural change: Tema Depot removed; 11.06% of base-year emissions, above the 5% threshold, recalculation required). An inventory that reports against the base year cannot be submitted for review until the recalculation is completed or declined. Calculation runs stay available, because quantifying the movement is how a recalculation is assessed.": the hold is on the acts that report a figure; a run is submitted for review before it is signed off (spec 05.8), and the submission meets the hold first. |  |  |
| 5 | Open the inventory "FY2026" (**Open**). | The screen reads "Base year holds the final designation; runs stay available.". |  |  |
| 6 | On **Runs**, click **Launch calculation run**. | Run 002 is listed; numbers are never reused: a run goes through: quantifying the movement is how a recalculation is assessed. |  |  |
| 7 | Read the **Base year** gate on the pre-flight panel under **Records**. | A warning on the **Base year** gate: "This inventory is not held because it is an equity share view and the base year is operational control": a warning, not an error. |  |  |

## C. Undoing the removal supersedes the candidate

### C1. Put back as the base year held it

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **Reopen as draft**, type "Sale fell through" and confirm. |  |  |  |
| 2 | On **Boundary**, tick **Tema Depot in boundary**. | Tema Depot is in the boundary. |  |  |
| 3 | Click **Freeze inventory**. | The header reads "Boundary version 3". A SUPERSEDED candidate reads "structural change: Tema Depot removed; 11.06% of base-year emissions, above the 5% threshold, recalculation required" and the note "put back in boundary version 3 as the base year held it". No error remains on the pre-flight. |  |  |
| 4 | Click **Reopen as draft**, type "Sale completed after all" and confirm. |  |  |  |
| 5 | On **Boundary**, untick **Tema Depot in boundary**. | Tema Depot leaves the boundary. |  |  |
| 6 | On Adansi Logistics Ltd's row, choose **Not applicable** with the detail "Depot sold on 2026-01-31; no operation in the period". | The row reads left out: **Not applicable**. |  |  |
| 7 | Click **Freeze inventory**. | The header reads "Boundary version 4". A FLAGGED candidate against boundary version 4 reads "structural change: Tema Depot removed; 11.06% of base-year emissions, above the 5% threshold, recalculation required": a new FLAGGED candidate. |  |  |

## D. Deciding

### D1. A recalculated base is a run of the base-year inventory

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On the flagged candidate click **Record recalculated base** and read the list under **Recalculated base run**. | Only the base-year inventory's runs are offered, each with its total (Run 002, Run 003, Run 004, Run 005), and not Run 001: a voided run must not be relied on, so it cannot be the recalculated base. |  |  |
| 2 | Pick "Run 002" under **Recalculated base run** and confirm with **Record**. | A RECALCULATED candidate reads "structural change: Tema Depot removed; 11.06% of base-year emissions, above the 5% threshold, recalculation required" with `you+ama@…` (the Ama alias) and "recalculated base: Run 002". No error remains on the pre-flight. |  |  |

### D2. Manual candidates need a share or a comparison run

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **Raise a candidate**: trigger **Significant error corrected**, what changed "Scratch: reading the refusal", no share, no comparison run. Submit. | Refused inline: "Give the affected share of base-year emissions, or name a comparison run of the base-year inventory.". |  |  |
| 2 | Click **Raise a candidate**: trigger **Methodology change**, what changed "Grid factor vintage moved to ghana-2027-gov", affected share 2.87, no comparison run. Submit. | A FLAGGED candidate reads "2.87% of base-year emissions, below the 5% threshold, recalculation optional": the running sum restarted at the recalculation of case D1, so the 11.06% is not added to it. |  |  |
| 3 | Click **Decline** on it with the note "Below the 5% threshold; the notice records the answer" and confirm. | A DECLINED candidate reads "2.87% of base-year emissions" with `you+ama@…` (the Ama alias) and the note "Below the 5% threshold; the notice records the answer": had this candidate been raised before case D1's recalculation, the next structural change would have read "11.06% of base-year emissions on its own, 13.93% together with 1 earlier change since the 2025 base year": the running sum counts every candidate since the base or the last recalculation, declined ones included. |  |  |

## E. A different GWP set is flagged

### E1. FY2026 on AR6 against an AR5 base year

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **Reopen as draft**, type "Reading the GWP flag" and confirm. |  |  |  |
| 2 | Click **Edit inventory**, set the GWP set to AR6, and save. | The header reads GWP AR6. |  |  |
| 3 | Click **Freeze inventory**. |  |  |  |
| 4 | On **Runs**, click **Launch calculation run**. | The base-year section reads "This run and the base year use different GWP sets; the required-gases amendment recommends the same set for both." |  |  |
| 5 | Click **Reopen as draft**, type "Back to the base year's set" and confirm. |  |  |  |
| 6 | Click **Edit inventory**, set the GWP set to AR5, and save. | The header reads GWP AR5. |  |  |
| 7 | Click **Freeze inventory**. | The header reads FROZEN. The header reads "Boundary version 6": FY2026 is where procedure 7 left it, five boundary versions on. |  |  |

## F. The organization's record

### F1. A published record keeps the organization

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On **Emission factors**, click **Delete** on "R-410A (composition)". | "R-410A (composition)" is deleted: no classification and no run ever applied it. |  |  |
| 2 | On **Emission factors**, click **Delete** on "Long-haul flights (supplier)". | Refused: "'Long-haul flights (supplier)' was applied by a calculation run. Set its validity end to retire it instead of deleting it.": set its validity end to retire it instead. |  |  |
| 3 | Open **Settings**, and under **Danger zone** click **Delete organization**. | The dialog lists "FY2025: Published" and refuses: "Publish records are kept: withdraw the final designation or supersede the published inventory first.". |  |  |
| 4 | In Adansi Foods Ltd, open **Settings**. | **History** holds an admin access assumed entry, with `you+adminb@…` (the Admin B alias) and the moment. **History** holds a factor pack adopted entry, with `you+kofi@…` (the Kofi alias) and the moment. History lists the members added, the entities, facilities and emission sources of procedure 2, support access assumed and ended, the adoption, and every act since, each with an email and a moment. Its rows are not only members: read them by their label. |  |  |

### F2. A scratch organization is deleted with its name typed

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Yaw Darko in the private window, sign in as "Yaw Darko" with `you+yaw@…` (the Yaw alias) and `Yaw-pass-2026`. | Yaw Darko is signed in. |  |  |
| 2 | In Solo Ltd, open **Settings**, then click **Delete organization**. Fill in **Type Solo Ltd to confirm** with `solo ltd`, fill in **Reason** with `Scratch organization of the governance pack`, then click **Delete**. | **Delete** stays disabled: "Type the organization's name exactly to confirm.": the name must match exactly. |  |  |
| 3 | In Solo Ltd, open **Settings**, then click **Delete organization**. Fill in **Type Solo Ltd to confirm** with `Solo Ltd`, fill in **Reason** with `Scratch organization of the governance pack`, then click **Delete**. | Solo Ltd leaves the list and its URL is not found. The dialog said the record of who removed it, when and why is kept. |  |  |
| 4 | As Admin in the normal window, sign in as "Admin" with your administrator address (the Admin alias) and the password the engineering team sent you. | Admin is signed in. |  |  |
| 5 | Open **Dashboard**. | **Organizations** reads 1. No tile carries a client's emissions figure: Organizations counts Adansi Foods Ltd alone. |  |  |

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals:** the whole-year convention and its warnings (one policy per organization; the pack keeps the transaction date); an error-correction candidate weighed against a comparison run (the mining pack); a second structural change accumulated with the first.

## Change notes

- **Version 2, 2026-09-29.** F1 step 3 expects the structure rows the organization history now records beside the member rows (PR #121).
- **Version 3, 2026-09-29.** D1 step 1: a voided run is no longer offered as the recalculated base (the walkthrough fix of 2026-09-29). B1 step 1: the form sends the inventory the select shows, and an empty reason is refused in words.
- **Version 4, 2026-10-02.** Transliterated to the QA scenario DSL. The designation, the candidates, the gate, the final-run hold, the runs the dialog offers, the report's GWP note, the deletion refusals and the history are read from the API as well as from the screen; the history's breadth and the tombstone's wording are observed on screen. The refusals carry rule ids (ghg.base-year.*, ghg.organization.has-records, ghg.organization.name-confirmation, ghg.factor.*). E1 counts the boundary versions the procedure cuts (six by its end).
- **Version 5, 2026-10-06.** B1: the base-year hold meets the submission for review, which comes before the sign-off (spec 05.8, ECO-13).
