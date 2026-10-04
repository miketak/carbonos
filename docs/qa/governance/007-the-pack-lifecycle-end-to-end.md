<!-- generated from qa/packs/governance/007-the-pack-lifecycle-end-to-end.yaml by make qa-export; edit the YAML -->
# Procedure 7: The pack lifecycle end to end

**Objective.** Confirm that a platform administrator clones a published edition into a draft, changes one value, reads the validation report, and cannot publish the draft they curated; that a second administrator publishes it with its source document and applies-from date; that the organization sees the notice in its own workspace, reads what a decision would move, refuses the preparer and the administrator under support access, and accepts as a reviewer with the chapter 5 answer; that the next run cites the new vintage while the reported year keeps its figures; that an edition applying inside a published period cannot be adopted while the platform blocks it, and the refusal says so; and that a withdrawal closes the notice it raised without touching a factor.

**Covers** [spec 02.5](../../../specs/02.5-factor-pack-editions.md), [spec 02.6](../../../specs/02.6-versioned-pack-import.md), [spec 02.7](../../../specs/02.7-adopting-a-new-edition.md), [spec 02.3](../../../specs/02.3-factor-identity-across-packs.md), [spec 02.8](../../../specs/02.8-viewing-a-packs-factors.md), [spec 01.3](../../../specs/01.3-organization-confidentiality-and-deletion-safeguards.md) and [spec 01.5](../../../specs/01.5-the-platform-administration-panel.md). Spec 01.3 for support access, spec 01.5 for the administration panel.

**Estimated time:** 40 minutes.

**Procedure version:** 4 (2026-10-02). The change notes are at the foot.

**Run this procedure** after procedure 6. The edition identifiers it publishes are citations and can never be reused: a second pass on the same database needs new ones.

## Prerequisites

- Adansi Foods Ltd holding the `ghana` edition (procedure 2) with FY2025 published and its correction frozen (procedure 6).
- Admin A in the normal window; Admin B, Ama, Esi and Kofi in the private window as the cases name them.
- `fixtures/source-document.txt` and `fixtures/adansi-2026.csv`.

## A. The draft

### A1. A clone starts from the predecessor's rows

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Admin in the normal window, sign in as "Admin". | Admin is signed in. |  |  |
| 2 | Open **Administration**, then **Factor packs**. | `defra-2025` is listed as PUBLISHED held by "1 organization". `defra-2026` is listed as PUBLISHED held by "1 organization". `ghana` is listed as PUBLISHED with 7 rows held by "1 organization": two families, defra with two PUBLISHED editions (2025 and 2026) and ghana with one, each edition with its applies-from date, its row count and how many organizations hold it: all three read "1 organization". |  |  |
| 3 | Look. | Click Clone on the ghana edition: the dialog "Clone ghana" says the draft starts with the 7 rows of ghana, copied, with the name, source, URL, year and GWP basis filled in. |  |  |
| 4 | Click **Clone** on `ghana`, type the identifier `ghana` and click **Create draft**. | Refused: "An edition named 'ghana' already exists. An edition identifier is the citation a report prints, so it is never reused.". |  |  |
| 5 | Click **Clone** on `ghana`, type the identifier `ghana-2027-gov`, applies from 2026-01-01 and click **Create draft**. | `ghana-2027-gov` is listed as DRAFT with 7 rows held by "No organization": a toast reads "ghana-2027-gov was created from ghana with its 7 rows."; the draft is listed under the family reading DRAFT, 7 rows, "No organization". |  |  |
| 6 | On `ghana`, click **Edit** on `GHANA:grid:GHA:2024`, change its kg CO₂e per unit to 0.44 and click **Save row**. | The screen reads "This edition is published, so its rows, metadata and values never change again". Refused: "'ghana' is published. A published edition's rows, metadata and values never change, because reports already rest on them. Clone it into a new draft instead.": reports already rest on them. |  |  |

### A2. One value changes, and the rules are read live

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On `ghana-2027-gov`, click **Edit** on `GHANA:grid:GHA:2024`, change its kg CO₂e per unit to 0.44 and click **Save row**. | On `ghana`, `GHANA:grid:GHA:2024` reads 0.468809: the published ghana still reads 0.468809. |  |  |
| 2 | On `ghana-2027-gov`, click **Edit** on `GHANA:grid:GHA:2024`, change its code to `grid2024`, its unit to `widgets`, its data year to empty and click **Save row**. | **Validation** lists 3 findings on the row: "The code names the publication and the row", "The unit is one the registry knows", "The provenance is complete": three findings on the row: the code needs two or more colon-separated segments, widgets is not a registered unit, and the provenance is missing the data year. |  |  |
| 3 | On `ghana-2027-gov`, click **Edit** on `grid2024`, change its code to `GHANA:grid:GHA:2024`, its unit to `kWh`, its data year to 2024 and click **Save row**. | **Validation** reads "Every rule passes". |  |  |

## B. Publication

### B1. The curator cannot publish

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **Publish** on `ghana-2027-gov`, and click **Publish** in the dialog. | The dialog "Publish ghana-2027-gov" lists the conditions and reads "No source document yet. Upload the publication this edition was transcribed from."; **Publish** stays disabled. **Publish** stays disabled: "The approver must not be the curator. {curator} built this draft, so somebody else checks it against the source document and publishes it.": the dialog lists the conditions; the rules line passes; no source document yet, and the curator is the one asking. |  |  |
| 2 | Click **Publish** on `ghana-2027-gov` and choose `source-document.txt` under **Source document**. | The dialog shows the document's SHA-256 "computed over the bytes stored"; the last condition reads not met, "The approver must not be the curator. You built this draft, so another administrator checks it against the source document and publishes it."; **Publish** stays disabled. `ghana-2027-gov` is listed as DRAFT: the citation is typed by whoever publishes, in case B2; the edition is still a draft. |  |  |

### B2. The second administrator reads the blast radius and publishes

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Admin B in the private window, sign in as "Admin B". | Admin B is signed in. |  |  |
| 2 | Open `ghana-2027-gov` and click **Blast radius**. | A drawer says publishing changes no organization's data. One row changed, `GHANA:grid:GHA:2024` from 0.468809 to 0.44, -6.15%. "1 organization holds one of these lineages". Adansi Foods Ltd's card names the estimated movement, about -3,486 kg CO₂e from its last completed run (Run 001) and lists the lineage inside a locked period (FY2025): the correction's Run 001 priced 121,000 kWh; (0.44 - 0.468809) × 121,000 is about -3,486 kg CO₂e. |  |  |
| 3 | Click **Publish** on `ghana-2027-gov`, clear **Applies from**, and click **Publish** in the dialog. | The screen reads "Give the date the edition applies from. It is the vintage boundary an adoption is run from.". **Publish** stays disabled: "Give the date the edition applies from. It is the vintage boundary an adoption is run from.". |  |  |
| 4 | Click **Publish** on `ghana-2027-gov`, set **Applies from** to 2026-01-01, type "Gas supplier delivery note, March 2025 (test source)" as **Source document as cited**, and click **Publish** in the dialog. | `ghana-2027-gov` is listed as PUBLISHED, applying from 2026-01-01 superseding `ghana`. `ghana` is listed as SUPERSEDED. The **Metadata** tab names Admin as curator and Admin B as approver: "ghana-2027-gov was published."; ghana reads SUPERSEDED because the new edition applies after it; the Metadata tab prints the provenance review and the evidence checksum, not the publication moment, which the edition's events carry. |  |  |
| 5 | As Ama Owusu in the private window, sign in as "Ama Owusu". | Ama Owusu is signed in. |  |  |
| 6 | In Adansi Foods Ltd, open **Emission factors**. | "Grid electricity, Ghana (2024)" is listed with one version, ghana. Run 005 is listed with its total 120,373.32 kg CO₂e: 0.468809 and 120,373.32 kg: publishing moved nothing. |  |  |

## C. The organization decides

### C1. The notice is in the organization's workspace

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In Adansi Foods Ltd, open **Overview**. | **Updates** carries the badge 1, titled "1 factor pack update waiting". |  |  |
| 2 | Open **Updates**. | One row: `ghana-2027-gov`, in place of `ghana`, 1 row affected, 1 moving more than five percent, status "Waiting on you": raised now, with the estimated movement. |  |  |
| 3 | On **Updates**, click **Review** on `ghana-2027-gov`. | The drawer names the edition, the predecessor `ghana` and the date it applies from, 2026-01-01. **What moves (7)** lists every lineage the edition carries: `GHANA:grid:GHA:2024` held 0.468809, edition 0.44, -6.15%, with its estimated movement. **Earlier periods** lists FY2025: the coverage warnings that follow are what a vintage means. The last line prints the diff hash: six lineages at 0% and the grid row; the movement is estimated over the open FY2025 equity view. |  |  |
| 4 | Look. | "The organization has no base year, so no recalculation candidate can be raised.", and no warning above the buttons contradicts it: once a base year is designated (procedure 8), the note says instead that accepting raises a recalculation candidate and, above the significance threshold, holds final designation and publication until it is completed or declined. |  |  |

### C2. A preparer reads and cannot decide

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Esi Boateng in the private window, sign in as "Esi Boateng". | Esi Boateng is signed in. |  |  |
| 2 | Open the drawer of `ghana-2027-gov`, answer "Vintage progression: the edition applies to the next reporting year forward" and click **Accept**. | **Accept** is disabled, with the tooltip "Needs the Reviewer or Owner role.": a preparer's refusals are disabled controls, not dialogs. **Decline** is disabled, with the tooltip "Needs the Reviewer or Owner role.": a preparer's refusals are disabled controls, not dialogs: fully readable. |  |  |

### C3. Support access reads everything and cannot decide

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Admin B in the private window, sign in as "Admin B". | Admin B is signed in. |  |  |
| 2 | Open **GHG accounting**. | Adansi Foods Ltd is not listed under **GHG accounting**: an administrator is an outsider. |  |  |
| 3 | Open **Administration**, **Organizations**, click **Assume access** on Adansi Foods Ltd, type the reason "short" and confirm. | **Assume access** stays disabled: "Give a reason of at least 10 characters.". |  |  |
| 4 | Open **Administration**, **Organizations**, click **Assume access** on Adansi Foods Ltd, type the reason "Ticket 118: the owner asked what the notice means" and confirm. | The row shows the expiry and **End access**. "Support access to Adansi Foods Ltd assumed.". |  |  |
| 5 | Open **Updates**. | The screen reads "under support access until". Every page carries the banner "You are in Adansi Foods Ltd under support access until <time>. Every act is recorded in this organization's history.". Settings opens only on Baseline and targets, with no Organization tab, and the foot of the sidebar reads "Support access" where a member's reads their role. |  |  |
| 6 | Open the drawer of `ghana-2027-gov`, answer "Vintage progression: the edition applies to the next reporting year forward" and click **Accept**. | Refused: "Support access cannot adopt an edition for an organization. That is the organization's own decision, so a reviewer or an owner of the organization has to make it.". |  |  |
| 7 | Open the drawer of `ghana-2027-gov` and click **Decline**. | Refused: "Support access cannot decline an edition for an organization. That is the organization's own decision, so a reviewer or an owner of the organization has to make it.". |  |  |
| 8 | On **Organizations**, click **End access** on Adansi Foods Ltd. | Adansi Foods Ltd is not listed under **GHG accounting**: the organization leaves the administrator's list. |  |  |
| 9 | As Ama Owusu in the private window, sign in as "Ama Owusu". | Ama Owusu is signed in. |  |  |
| 10 | In Adansi Foods Ltd, open **Settings**. | **History** holds an admin access assumed entry reading "Ticket 118: the owner asked what the notice means", with the Admin B alias and the moment. **History** holds an admin access ended entry, with the Admin B alias and the moment: each with Admin B's email, the moment and the reason. |  |  |

### C4. The reviewer answers the question and accepts

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Kofi Mensah in the private window, sign in as "Kofi Mensah". | Kofi Mensah is signed in. |  |  |
| 2 | Open the drawer of `ghana-2027-gov` and click **Accept** without answering. | The three answers under **How does chapter 5 treat this adoption?** are "Vintage progression: the edition applies to the next reporting year forward", "Retrospective adoption: the edition is applied to a year already reported", "Erratum: the edition corrects a wrong value in a year already reported". **Accept** stays disabled: "Say how chapter 5 treats this adoption: VINTAGE_PROGRESSION, RETROSPECTIVE_ADOPTION, or ERRATUM_ON_REPORTED_YEAR.". |  |  |
| 3 | Open the drawer of `ghana-2027-gov`, answer "Vintage progression: the edition applies to the next reporting year forward" and click **Accept**. | One row: `ghana-2027-gov`, status "Accepted", with the Kofi alias's email. The badge on **Updates** is gone: "Adopted ghana-2027-gov: 1 version cut, 0 lineages added.". |  |  |
| 4 | In Adansi Foods Ltd, open **Emission factors**. | "Grid electricity, Ghana (2024)" is listed with 2 versions: ghana and ghana-2027-gov: the old version until 2025-12-31 at 0.468809, the live one from 2026-01-01 at 0.44; nothing rewrote a past value. |  |  |
| 5 | As Ama Owusu in the private window, sign in as "Ama Owusu". | Ama Owusu is signed in. |  |  |
| 6 | In Adansi Foods Ltd, open **Settings**. | **History** holds a factor pack adopted entry reading "as a vintage progression", with the Kofi alias and the moment: Settings is the owner's; Overview carries no event list, History is the organization's record. |  |  |
| 7 | Look. | Open Settings and the Baseline and targets tab: no base year is designated yet, so no candidate was raised. The answer lives on the notice. |  |  |

## D. The next run cites the new vintage

### D1. FY2026

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **Import CSV**, choose `adansi-2026.csv` and click **Add records**. | ACT-0014 is on the register with the quantity 2100 litre. ACT-0015 is on the register with the quantity 110 MWh: "2 records imported."; the two rows removed in procedure 3 do not count as duplicates. |  |  |
| 2 | Open **Inventories** and click **New inventory**. Name "FY2026", period 2026-01-01 to 2026-12-31, consolidation approach operational control, GWP set AR5, straddling records **Pro-rate by days (default)**, and **Start with every operation the approach includes in the boundary** ticked. Click **Create inventory**. The inventory opens on its workbench. | The header reads DRAFT. |  |  |
| 3 | Click **Review activity data**. | ACT-0014 is still unclassified. ACT-0015 is still unclassified. ACT-0006 is still unclassified. ACT-0001 reads "Excluded · Outside reporting period". A warning on the **Activity data completeness** gate: "15 of 32 days": three records are included: the two January rows and ACT-0006, the year-end LPG, whose 2025-12-15 to 2026-01-15 period reaches 15 days into 2026; every 2025 record is excluded as outside the period; the run pro-rates ACT-0006 to 46.88%. |  |  |
| 4 | Open ACT-0014 and choose **Gaseous fuels: LPG (/litre)**. | ACT-0014 reads included, uses **Gaseous fuels: LPG**. |  |  |
| 5 | Open ACT-0006 and choose **Gaseous fuels: LPG (/litre)**. | ACT-0006 reads included, uses **Gaseous fuels: LPG**. |  |  |
| 6 | Open ACT-0015 and click the suggestion "Suggested for this facility's grid". | The picker offers the defra-2026 LPG version, the one live in 2026. The grid preview reads "110 MWh → 110,000 kWh × 0.44 kg CO₂e/kWh": the suggestion is the version live in the period. |  |  |
| 7 | Choose **No residual mix is available** and save. | The inventory records that no residual mix is available. |  |  |
| 8 | Click **Freeze inventory**. |  |  |  |
| 9 | On **Runs**, click **Launch calculation run**. | Run 001 is listed with its total 52,253.90 kg CO₂e. The line of ACT-0015 reads 48,400.00 kg CO₂e. The line of ACT-0014 reads 3,269.97 kg CO₂e. The line of ACT-0006 reads 583.92 kg CO₂e and 15 covered days of 32: 48,400 for the electricity, 3,269.97 for the January LPG (2,100 litre × 1.55713) and 583.92 for the 15 pro-rated days of the year-end LPG (375 litre × 1.55713). |  |  |
| 10 | Look. | The factor table cites `ghana-2027-gov` from 2026-01-01 on the "Grid electricity, Ghana (2024)" row. The factor table cites `defra-2026` from 2026-01-01 on the "Gaseous fuels: LPG" row: open the PDF and read the factor table: the grid row cites ghana-2027-gov from 2026-01-01; the LPG row cites defra-2026 from 2026-01-01. |  |  |
| 11 | Open Run 001 of "FY2025 (correction)". | The line of ACT-0002 reads 56,725.89 kg CO₂e: still 56,725.89 kg on the grid line at 0.468809: the reported year kept its factors. |  |  |

## E. An edition inside a reported period

### E1. Accepting is refused, declining stays open

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Admin B in the private window, sign in as "Admin B". | Admin B is signed in. |  |  |
| 2 | Click **Clone** on `ghana-2027-gov`, type the identifier `ghana-2027-gov.r2` and click **Create draft**. | `ghana-2027-gov.r2` is listed as DRAFT. |  |  |
| 3 | On `ghana-2027-gov.r2`, click **Edit** on `GHANA:grid:GHA:2024`, change its kg CO₂e per unit to 0.45 and click **Save row**. | On `ghana-2027-gov.r2`, `GHANA:grid:GHA:2024` reads 0.45. |  |  |
| 4 | Click **Publish** on `ghana-2027-gov.r2` and choose `source-document.txt` under **Source document**. | `ghana-2027-gov.r2` is listed with its source document on file. |  |  |
| 5 | As Admin in the normal window, sign in as "Admin". | Admin is signed in. |  |  |
| 6 | Click **Publish** on `ghana-2027-gov.r2`, set **Applies from** to 2025-06-01, type "Gas supplier delivery note, March 2025 (test source)" as **Source document as cited**, and click **Publish** in the dialog. | `ghana-2027-gov.r2` is listed as PUBLISHED, applying from 2025-06-01. `ghana-2027-gov` is listed as PUBLISHED. The **Metadata** tab names Admin B as curator and Admin as approver: an edition that applies from an earlier date than the one standing is not its successor, so it supersedes nothing (spec 02.5); the roles swap with the curator. |  |  |
| 7 | As Kofi Mensah in the private window, sign in as "Kofi Mensah". | Kofi Mensah is signed in. |  |  |
| 8 | In Adansi Foods Ltd, open **Overview**. | **Updates** carries the badge 1, titled "1 factor pack update waiting". |  |  |
| 9 | On **Updates**, click **Review** on `ghana-2027-gov.r2`. | The drawer names the block above what moves: "falls inside FY2025" and "Declining stays available.": "2025-06-01 falls inside FY2025 (2025-01-01 → 2025-12-31), which is published. A reported period keeps the factors it reported with, so this edition cannot be accepted while the platform blocks editions inside a published period. Declining stays available.". |  |  |
| 10 | Open the drawer of `ghana-2027-gov.r2`, answer "Erratum: the edition corrects a wrong value in a year already reported" and click **Accept**. | Refused: "'ghana-2027-gov.r2' applies from 2025-06-01, which falls inside 'FY2025' (2025-01-01 to 2025-12-31), which is PUBLISHED. A reported period keeps the factors it reported with. The edition cannot be imported while that period is on record and the platform setting Editions inside a published period is Blocked; choose an edition that applies from a later date, or ask a platform administrator about the setting.": the refusal names the platform setting. |  |  |
| 11 | In Adansi Foods Ltd, open **Emission factors**. | "Grid electricity, Ghana (2024)" is listed with 2 versions: ghana and ghana-2027-gov: still two versions: the refusal wrote nothing. |  |  |

## F. Withdrawal

### F1. A withdrawal closes the notice and moves no factor

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Admin in the normal window, sign in as "Admin". | Admin is signed in. |  |  |
| 2 | Open `ghana-2027-gov.r2`, click **Withdraw**, type "short" and confirm with **Withdraw edition**. | Refused inline: "Say why the edition is withdrawn, in at least 10 characters. It is the record a verifier reads beside the figures that rest on it.". |  |  |
| 3 | Open `ghana-2027-gov.r2`, click **Withdraw**, type "Published against the wrong period; retracted" and confirm with **Withdraw edition**. | `ghana-2027-gov.r2` is listed as WITHDRAWN: "ghana-2027-gov.r2 was withdrawn."; the reason reaches the organizations, on the Updates row of case F1.4; the edition page itself prints the status, not the reason. |  |  |
| 4 | Click **Clone** on `ghana`, type the identifier `ghana-scratch` and click **Create draft**. | `ghana-scratch` is listed as DRAFT. |  |  |
| 5 | Open `ghana-scratch`. | Only **Delete draft** is offered: no **Withdraw**: a draft offers no Withdraw: no organization can see it, so there is nothing to retract. |  |  |
| 6 | On `ghana-scratch`, click **Delete draft** and confirm. | `ghana-scratch` is gone from the list. |  |  |
| 7 | As Kofi Mensah in the private window, sign in as "Kofi Mensah". | Kofi Mensah is signed in. |  |  |
| 8 | Open **Updates**. | One row: `ghana-2027-gov.r2`, status "Withdrawn by the publisher", with the reason "Published against the wrong period; retracted". The badge on **Updates** is gone. |  |  |
| 9 | On **Updates**, click **Review** on `ghana-2027-gov.r2`. | The screen reads "The publisher withdrew this edition, so there is nothing to decide.". |  |  |
| 10 | In Adansi Foods Ltd, open **Emission factors**. | "Grid electricity, Ghana (2024)" is listed with 2 versions: ghana and ghana-2027-gov. Run 005 is listed with its total 120,373.32 kg CO₂e: two versions, 120,373.32 kg: a withdrawal is the publisher's act. |  |  |

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals:** a family created from scratch, a template row and the gas-split reconciliation (the mining pack, procedure 10); an accepted edition that raises a base-year candidate above the threshold (the movement here is 2.87% against a 5% threshold, and procedure 8 raises its candidate by hand); support access expiring by time; accepting under the setting "Allowed: published runs keep their factors", which the FY2025 correction's frozen period would still block here (the mining pack, procedure 10 case E5, covers the setting).

## Change notes

- **Version 2, 2026-09-29.** E1 steps 2 and 3: the drawer and the refusal name the platform setting Editions inside a published period (PR #122). The case that switches the setting to Allowed and back is in the mining pack, procedure 10 case E5, not here: the FY2025 correction is frozen over the same period, and a frozen period blocks under either value. C3 step 4 reads "Support access" at the foot of the sidebar (PR #119).
- **Version 3, 2026-09-29.** B1 and B2: the source citation is typed by the publisher, since the curator's typing is not kept once the dialog closes. C1 step 4: with no base year the drawer no longer also warns that accepting raises a candidate (the walkthrough fix of 2026-09-29).
- **Version 4, 2026-10-02.** Transliterated to the QA scenario DSL. The editions, their rows, the validation report, the blast radius, the notices and their diff, the support grants and the history are read from the API as well as from the screen; the clone dialog's preamble, the banner's wording, the picker's preview and the adoption toast are observed on screen. The refusals carry rule ids (ghg.pack.*, ghg.adoption.*, ghg.support-access.*), and the imported 2026 rows are ACT-0014 and ACT-0015, the two rows procedure 3 removed having kept their numbers.
