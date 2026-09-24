# Procedure 7: The pack lifecycle end to end

**Objective.** Confirm that a platform administrator clones a published
edition into a draft, changes one value, reads the validation report, and
cannot publish the draft they curated; that a second administrator
publishes it with its source document and applies-from date; that the
organization sees the notice in its own workspace, reads what a decision
would move, refuses the preparer and the administrator under support
access, and accepts as a reviewer with the chapter 5 answer; that the next
run cites the new vintage while the reported year keeps its figures; that
an edition applying inside a reported period cannot be adopted; and that a
withdrawal closes the notice it raised without touching a factor.

**Covers** [spec 02.5](../../../specs/02.5-factor-pack-editions.md),
[spec 02.6](../../../specs/02.6-versioned-pack-import.md),
[spec 02.7](../../../specs/02.7-adopting-a-new-edition.md),
[spec 02.3](../../../specs/02.3-factor-identity-across-packs.md),
[spec 02.8](../../../specs/02.8-viewing-a-packs-factors.md),
[spec 01.3](../../../specs/01.3-organization-confidentiality-and-deletion-safeguards.md)
(support access) and [spec 01.5](../../../specs/01.5-the-platform-administration-panel.md).

**Estimated time:** 40 minutes.

**Run this procedure** after procedure 6. The edition identifiers it
publishes are citations and can never be reused: a second pass on the same
database needs new ones.

## Prerequisites

- Adansi Foods Ltd holding the `ghana` edition (procedure 2) with FY2025
  published and its correction frozen (procedure 6).
- Admin A in the normal window; Admin B, Ama, Esi and Kofi in the private
  window as the cases name them.
- `fixtures/source-document.txt` and `fixtures/adansi-2026.csv`.

## A. The draft

### A1. A clone starts from the predecessor's rows

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Admin A, open **Administration**, then **Factor packs**. | Two families, `defra` with two PUBLISHED editions (2025 and 2026) and `ghana` with one, each edition with its applies-from date, its row count and how many organizations hold it: all three read "1 organization". | | |
| 2 | Click **Clone** on the `ghana` edition. | The dialog "Clone ghana" says the draft starts with the 7 rows of `ghana`, copied, with the name, source, URL, year and GWP basis filled in. | | |
| 3 | Type the identifier `ghana`. | Refused: "An edition named 'ghana' already exists. An edition identifier is the citation a report prints, so it is never reused.". | | |
| 4 | Type `ghana-2027-gov`, applies from 2026-01-01, and create. | A toast reads "ghana-2027-gov was created from ghana with its 7 rows.". The draft is listed under the family reading DRAFT, 7 rows, "No organization". | | |
| 5 | Open `ghana` and try to edit a row. | The page says the edition is published, so its rows, metadata and values never change again, and the edit is refused with "'ghana' is published. A published edition's rows, metadata and values never change …": reports already rest on them. | | |

### A2. One value changes, and the rules are read live

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open `ghana-2027-gov`, edit `GHANA:grid:GHA:2024` and change its kg CO₂e per unit from 0.468809 to 0.44. Save. | The row reads 0.44. The published `ghana` still reads 0.468809. | | |
| 2 | Edit the same row again: code `grid2024`, unit `widgets`, data year empty. Save, then open the **Validation** tab. | Three findings on the row: the code needs two or more colon-separated segments, `widgets` is not a registered unit, and the provenance is missing the data year. | | |
| 3 | Put the code, the unit `kWh` and the data year 2024 back. | "Every rule passes". | | |

## B. Publication

### B1. The curator cannot publish

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Still as Admin A, click **Publish** on `ghana-2027-gov`. | The dialog "Publish ghana-2027-gov" lists the conditions; the rules line passes. **Publish** is disabled: no source document yet. | | |
| 2 | Attach `source-document.txt` and type "Gas supplier delivery note, March 2025 (test source)" as the source document as cited, keeping applies from 2026-01-01. | The dialog shows the document's SHA-256 "computed over the bytes stored". The last condition reads not met, "The approver must not be the curator. You built this draft, so another administrator checks it against the source document and publishes it.", and **Publish** stays disabled. The edition is still a draft. | | |

### B2. The second administrator reads the blast radius and publishes

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Admin B in the private window, open `ghana-2027-gov` and click **Blast radius**. | A drawer says publishing changes no organization's data. One row changed, `GHANA:grid:GHA:2024`, from 0.468809 to 0.44, -6.15%, held by Adansi Foods Ltd. Adansi's card names the estimated movement, about -3,486 kg CO₂e from its last completed run (the correction's Run 001, 121,000 kWh), and lists the lineage inside a locked period (FY2025). | | |
| 2 | Clear the applies-from date. | The date condition reads not met, "Give the date the edition applies from. It is the vintage boundary an adoption is run from.", and **Publish** is disabled. | | |
| 3 | Set 2026-01-01 and publish. | "ghana-2027-gov was published.". PUBLISHED; `ghana` reads SUPERSEDED, because the new edition applies after it. The **Metadata** tab names Admin A as curator and Admin B as approver; it prints the provenance review and the evidence checksum, not the publication moment, which the edition's events carry. | | |
| 4 | As Ama, read `GHANA:grid:GHA:2024` on **Emission factors** and the total of Run 005. | 0.468809 and 120,373.32 kg. Publishing moved nothing. | | |

## C. The organization decides

### C1. The notice is in the organization's workspace

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Ama, look at the left navigation. | **Updates** carries the badge 1, titled "1 factor pack update waiting". | | |
| 2 | Open **Updates**. | One row: `ghana-2027-gov` in place of `ghana`, raised now, 1 row affected, 1 moving more than five percent, the estimated movement, status "Waiting on you". | | |
| 3 | Click **Review**. | The drawer names the edition, the predecessor and the date it applies from. **What moves (7)** lists every lineage the edition carries: six at 0% and `GHANA:grid:GHA:2024` held 0.468809, edition 0.44, -6.15%, with its estimated movement. The movement is estimated over the open FY2025 equity view. **Earlier periods** lists the reported 2025 periods: the coverage warnings that follow are what a vintage means. The last line prints the diff hash. | | |
| 4 | Read the note above the buttons. | "The organization has no base year, so no recalculation candidate can be raised.". Once a base year is designated (procedure 8), the note says instead that accepting raises a recalculation candidate and, above the significance threshold, holds final designation and publication until it is completed or declined. | | |

### C2. A preparer reads and cannot decide

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Esi in the private window, open the same drawer. | Fully readable. **Accept** and **Decline** are disabled with the tooltip "Needs the Reviewer or Owner role.". | | |

### C3. Support access reads everything and cannot decide

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Admin B, open **GHG accounting**. | Adansi Foods Ltd is not listed: an administrator is an outsider. | | |
| 2 | Open **Administration**, **Organizations**, and click **Assume access** on Adansi Foods Ltd with the reason `short`. | The button stays disabled until the reason has 10 characters. | | |
| 3 | Type "Ticket 118: the owner asked what the notice means" and confirm. | "Support access to Adansi Foods Ltd assumed.". The row shows the expiry and **End access**. | | |
| 4 | Open **GHG accounting**, then Adansi Foods Ltd, then **Updates**. | Every page carries the banner "You are in Adansi Foods Ltd under support access until <time>. Every act is recorded in this organization's history.". There is no **Settings** entry. | | |
| 5 | Click **Review**, answer the chapter 5 question, and click **Accept**. | Refused: "Support access cannot adopt an edition for an organization. That is the organization's own decision, so a reviewer or an owner of the organization has to make it.". **Decline** is refused with "Support access cannot decline an edition for an organization." and the same second sentence. | | |
| 6 | Back on **Organizations**, click **End access**. | The organization leaves the administrator's list. | | |
| 7 | As Ama, open **Settings** and read **History**. | "Support access assumed" and "Support access ended", each with Admin B's email, the moment and the reason. | | |

### C4. The reviewer answers the question and accepts

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Kofi, open the drawer and click **Accept** without answering. | **Accept** is disabled until **How does chapter 5 treat this adoption?** is answered. The three answers are a vintage progression, a retrospective adoption and an erratum. | | |
| 2 | Answer "Vintage progression: the edition applies to the next reporting year forward" and accept. | "Adopted ghana-2027-gov: 1 version cut, 0 lineages added.". The row reads Accepted with Kofi's email and the badge is gone. | | |
| 3 | On **Emission factors**, find `GHANA:grid:GHA:2024`. | It offers "2 versions of this factor": the old version until 2025-12-31 at 0.468809, the live one from 2026-01-01 at 0.44. Nothing rewrote a past value. | | |
| 4 | As Ama (Settings is the owner's), open **Settings** and read **History**. | The adoption is listed as "Factor pack adopted", with Kofi's email, the edition and the answer "as a vintage progression". **Overview** carries no event list; History is the organization's record. | | |
| 5 | Open **Base year**. | No base year is designated yet, so no candidate was raised. The answer lives on the notice. | | |

## D. The next run cites the new vintage

### D1. FY2026

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Ama, import `fixtures/adansi-2026.csv`. | "2 records imported." The two rows removed in procedure 3 do not count as duplicates. | | |
| 2 | Create "FY2026": 2026-01-01 to 2026-12-31, operational control, AR5, pre-populated. Click **Review activity data**. | Three records are included: the two January rows and ACT-0006, the year-end LPG, whose 2025-12-15 to 2026-01-15 period reaches 15 days into 2026. Every 2025 record is excluded as outside the period. **Activity data completeness** warns that 15 of 32 days of ACT-0006 fall inside the period and the run pro-rates it to 46.88%. | | |
| 3 | Classify both LPG records with **Gaseous fuels: LPG** per litre and the electricity with the suggested grid factor. | The picker offers the `defra-2026` LPG version, the one live in 2026. The grid preview reads "110 MWh → 110,000 kWh × 0.44 kg CO₂e/kWh": the suggestion is the version live in the period. | | |
| 4 | State that no residual mix is available, freeze, and launch a run. | 52,253.90 kg CO₂e: 48,400 for the electricity, 3,269.97 for the January LPG (2,100 litre × 1.55713) and 583.92 for the 15 pro-rated days of the year-end LPG (375 litre × 1.55713). | | |
| 5 | Open the PDF and read the factor table. | The grid row cites `ghana-2027-gov` from 2026-01-01; the LPG row cites `defra-2026` from 2026-01-01. | | |
| 6 | Open the FY2025 correction's run. | Still 56,725.89 kg on the grid line at 0.468809. The reported year kept its factors. | | |

## E. An edition inside a reported period

### E1. Accepting is refused, declining stays open

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Admin B, clone `ghana-2027-gov` into `ghana-2027-gov.r2`, change `GHANA:grid:GHA:2024` to 0.45, and attach the source document. As Admin A, publish it with applies from 2025-06-01. | PUBLISHED, and `ghana-2027-gov` stays PUBLISHED: an edition that applies from an earlier date than the one standing is not its successor, so it supersedes nothing (spec 02.5). Admin A is the approver this time: the roles swap with the curator. | | |
| 2 | As Kofi, open **Updates**. | The badge reads 1. The drawer names the block above what moves: "2025-06-01 falls inside FY2025 (2025-01-01 → 2025-12-31), which is published. A reported period keeps the factors it reported with, so this edition cannot be accepted until that inventory is reopened. Declining stays available.". | | |
| 3 | Answer "Erratum: the edition corrects a wrong value in a year already reported" and accept. | Refused with the sentence of step 2 again: "2025-06-01 falls inside FY2025 (2025-01-01 → 2025-12-31), which is published. A reported period keeps the factors it reported with, so this edition cannot be accepted until that inventory is reopened. Declining stays available.". | | |
| 4 | Read the factors. | `GHANA:grid:GHA:2024` still has two versions. The refusal wrote nothing. | | |

## F. Withdrawal

### F1. A withdrawal closes the notice and moves no factor

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Admin A, open `ghana-2027-gov.r2`, click **Withdraw**, type "short" and confirm. | Refused: "Say why the edition is withdrawn, in at least 10 characters.". | | |
| 2 | Give "Published against the wrong period; retracted" and confirm. | "ghana-2027-gov.r2 was withdrawn.". The edition reads WITHDRAWN. The reason reaches the organizations, on the Updates row of case F1.4; the edition page itself prints the status, not the reason. | | |
| 3 | Try to withdraw a draft: clone `ghana` into `ghana-scratch` and look for **Withdraw**. | A draft offers no **Withdraw**: no organization can see it, so there is nothing to retract. **Delete draft** is what it offers; delete it. | | |
| 4 | As Kofi, reload **Updates**. | The row reads "Withdrawn by the publisher" with the reason; the badge is gone. Opening it says there is nothing to decide. | | |
| 5 | Read `GHANA:grid:GHA:2024` and Run 005's total once more. | Two versions, 120,373.32 kg. A withdrawal is the publisher's act. | | |

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals:** a family created from scratch, a template row and
the gas-split reconciliation (the mining pack, procedure 10); an accepted
edition that raises a base-year candidate above the threshold (the
movement here is 2.87% against a 5% threshold, and procedure 8 raises its
candidate by hand); support access expiring by time.
