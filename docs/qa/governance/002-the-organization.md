<!-- generated from qa/packs/governance/002-the-organization.yaml by make qa-export; edit the YAML -->
# Procedure 2: The organization

**Objective.** Confirm that an owner records the organization's members, legal entities, sites, source streams, units, densities and emission factors; that each wrong structure is refused with the rule that refuses it; that a verifier reads everything and changes nothing; and that a hand-entered factor is checked by someone other than the person who typed it, or, where nobody else could, records that it was self-approved.

**Covers** [spec 01.2](../../../specs/01.2-organization-membership-and-roles.md), [spec 01.4](../../../specs/01.4-role-aware-ui-and-visible-refusals.md), [spec 01.7](../../../specs/01.7-the-organization-settings-area.md), [spec 01.8](../../../specs/01.8-account-numbers-and-shared-organization-names.md), [spec 03.1](../../../specs/03.1-legal-entities-and-table-1.md), [spec 03.3](../../../specs/03.3-table-1-completeness.md), [spec 03.4](../../../specs/03.4-entity-dates-facility-attributes-and-boundary-prefill.md), [spec 04.3](../../../specs/04.3-source-streams-and-scope-choice.md), [spec 02.2](../../../specs/02.2-units-densities-and-custom-units.md), [spec 02.1](../../../specs/02.1-emission-factor-library.md), [spec 02.4](../../../specs/02.4-sector-pack-completeness.md), [spec 02.9](../../../specs/02.9-narrowing-the-catalogue-to-defra-and-ghana.md), [spec 02.10](../../../specs/02.10-retiring-the-shared-factor-library.md) and [spec 02.11](../../../specs/02.11-approval-as-a-control.md).

**Estimated time:** 55 minutes.

**Procedure version:** 5 (2026-10-07). The change notes are at the foot.

**Run this procedure** after procedure 1. Procedures 3 to 8 rest on the organization it builds.

## Prerequisites

- The six accounts of procedure 1.
- Ama in the normal window; the private window for Kofi and Yaw.
- Accounts in this procedure (replace `you+…@…` with aliases of the mailbox you read):
- Ama Owusu signs in with `you+ama@…` (the Ama alias) and `Ama-pass-2026`, in the private window.
- Kofi Mensah signs in with `you+kofi@…` (the Kofi alias) and `Kofi-pass-2026`, in the private window.
- Esi Boateng signs in with `you+esi@…` (the Esi alias) and `Esi-pass-2026`, in the private window.
- Yaw Darko signs in with `you+yaw@…` (the Yaw alias) and `Yaw-pass-2026`, in the private window.

## A. The organization and its members

### A1. The creator is the owner, and members are added by email

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Ama Owusu in the private window, sign in as "Ama Owusu" with `you+ama@…` (the Ama alias) and `Ama-pass-2026`. | Ama Owusu is signed in. |  |  |
| 2 | Open **GHG accounting**, then click **New organization**. Fill in **Name** with `Adansi Foods Ltd`, then click **Create organization**. | "Adansi Foods Ltd (ORG-<NNNN>) created." The list shows the organization with its account number. Note the account number, case A3 uses it. |  |  |
| 3 | Open Adansi Foods Ltd. | The **Overview** opens, and the foot of the sidebar reads "Your role: Owner". |  |  |
| 4 | Under **Members**, add `you+kofi@…` (the Kofi alias) as **Reviewer (approves and publishes)**. | Kofi Mensah appears with the role **Reviewer (approves and publishes)**. |  |  |
| 5 | Under **Members**, add `you+esi@…` (the Esi alias) as **Preparer (records, classifies, runs)**. | Esi Boateng appears with the role **Preparer (records, classifies, runs)**. |  |  |
| 6 | Under **Members**, add `you+yaw@…` (the Yaw alias) as **Verifier (read-only)**. | Yaw Darko appears with the role **Verifier (read-only)**. The card says reviewers also designate final runs, publish and create corrections, and verifiers read only. |  |  |
| 7 | Under **Members**, add `nobody@example.test` as **Preparer (records, classifies, runs)**. | Refused: "No account with that email.": membership is granted to an existing account, a newcomer requests access first. |  |  |
| 8 | Under **Members**, add `you+kofi@…` (the Kofi alias) as **Reviewer (approves and publishes)**. | Refused: "`you+kofi@…` (the Kofi alias) is already a member of 'Adansi Foods Ltd'.". |  |  |
| 9 | Change the role of "Ama Owusu" to **Preparer (records, classifies, runs)**. | Refused: "'Adansi Foods Ltd' needs at least one owner.". |  |  |
| 10 | Click **Remove** on the row of "Ama Owusu". | Refused: "'Adansi Foods Ltd' needs at least one owner.". |  |  |
| 11 | Look. | **History** holds 3 member added entries. **History** holds a member added entry reading "`you+kofi@…` (the Kofi alias) added as REVIEWER", with `you+ama@…` (the Ama alias) and the moment: it updated as you added them, without a reload; structure changes join the same card from section B on. |  |  |

### A2. A verifier reads everything and changes nothing

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Yaw Darko in the private window, sign in as "Yaw Darko" with `you+yaw@…` (the Yaw alias) and `Yaw-pass-2026`. | Yaw Darko is signed in. |  |  |
| 2 | Open Adansi Foods Ltd. | Adansi Foods Ltd opens for Yaw Darko. Every page carries the banner "Your role in this organization is Verifier (read-only).", and the foot of the sidebar reads "Your role: Verifier". |  |  |
| 3 | In Adansi Foods Ltd, open **Legal entities**. | On **Legal entities**, **Facilities** and **Emission factors** every button that would write is disabled, with the tooltip "Needs the Preparer, Reviewer or Owner role.". Nothing is hidden: a verifier sees the record, not a blank page. |  |  |
| 4 | Sign out. | Yaw Darko's session has ended: the sign-in page. |  |  |

### A3. Two organizations may share a name

Spec 01.8: a name is refused once when another organization carries it, and accepted on confirmation; the account number is what tells the two apart, and it never changes.

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Ama Owusu in the private window, open **GHG accounting**, then click **New organization**. Fill in **Name** with `adansi foods ltd`, then click **Create organization**. | Refused: "An organization named 'adansi foods ltd' already exists: <duplicates>. Confirm to use the name anyway.": refused once, in the form, naming the organization of A1 with its number; names are compared without regard to case, and the button now reads Create anyway. |  |  |
| 2 | Open **GHG accounting**, then click **New organization**. Fill in **Name** with `adansi foods ltd`, then click **Create organization**. Click **Create anyway**. | "adansi foods ltd (ORG-<NNNN>) created." The list shows the organization with its account number. |  |  |
| 3 | Open **GHG accounting**. | Ama Owusu sees 2 organizations: both organizations are listed in the switcher, each with its number. |  |  |
| 4 | In adansi foods ltd, open **Settings**, fill in **Name** with `Adansi Foods Ltd`, then click **Save details**. | Refused: "An organization named 'Adansi Foods Ltd' already exists: <duplicates>. Confirm to use the name anyway.": the same sentence, naming the first organization; the button reads Save anyway. |  |  |
| 5 | In adansi foods ltd, open **Settings**, fill in **Name** with `Adansi Foods Ltd`, then click **Save details**. Click **Save anyway**. | **History** holds an organization renamed entry reading "renamed from 'adansi foods ltd' to 'Adansi Foods Ltd'". |  |  |
| 6 | In Adansi Foods Ltd, open **Settings**, then click **Delete organization**. Fill in **Type Adansi Foods Ltd to confirm** with `Adansi Foods Ltd`, fill in **Reason** with `duplicate created for the walkthrough, no client data`, then click **Delete**. | Ama Owusu sees 1 organization. |  |  |
| 7 | Open **GHG accounting**, then click **New organization**. Fill in **Name** with `Adansi Foods Ltd`, then click **Create organization**. | Refused: "An organization named 'Adansi Foods Ltd' already exists: <duplicates>. Confirm to use the name anyway.": still refused once, naming only the live organization; the removed one does not count. |  |  |

## B. Legal entities

### B1. The reporting company is there by definition

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In Adansi Foods Ltd, open **Legal entities**. | Adansi Foods Ltd is listed as the reporting company with 100% under equity share, 100% under financial control, 100% under operational control: its row has no Remove, and in its edit form the relationship, the percentages, Operated by the company, Financial control and Held through show their fixed values and are disabled. |  |  |

### B2. A subsidiary with dates, and an associate

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In Adansi Foods Ltd, open **Legal entities**, then click **Add entity**. Fill in **Name** with `Adansi Logistics Ltd`, set **Relationship** to **Group company or subsidiary (financial control)**, fill in **Economic interest (%)** with `100`, fill in **Legal ownership (%)** with `100`, tick **Operated by the company**, fill in **Acquired on (optional)** with `2025-07-01`, fill in **Disposed of on (optional)** with `2025-01-01`, fill in **Jurisdiction (optional)** with `GH`, then click **Add entity**. | Refused inline: "The disposal date is before the acquisition date.". |  |  |
| 2 | In Adansi Foods Ltd, open **Legal entities**, then click **Add entity**. Fill in **Name** with `Adansi Logistics Ltd`, set **Relationship** to **Group company or subsidiary (financial control)**, fill in **Economic interest (%)** with `100`, fill in **Legal ownership (%)** with `100`, tick **Operated by the company**, fill in **Acquired on (optional)** with `2025-07-01`, fill in **Jurisdiction (optional)** with `GH`, then click **Add entity**. | Adansi Logistics Ltd is listed with 100% under equity share, 100% under financial control, 100% under operational control and "from 2025-07-01" under its relationship. |  |  |
| 3 | In Adansi Foods Ltd, open **Legal entities**, then click **Add entity**. Fill in **Name** with `Coldstore Ghana Ltd`, set **Relationship** to **Associate or affiliate (significant influence, no control)**, fill in **Economic interest (%)** with `150`, untick **Operated by the company**, then click **Add entity**. | Refused inline: "Economic interest must be between 0 and 100.". |  |  |
| 4 | In Adansi Foods Ltd, open **Legal entities**, then click **Add entity**. Fill in **Name** with `Coldstore Ghana Ltd`, set **Relationship** to **Associate or affiliate (significant influence, no control)**, fill in **Economic interest (%)** with `30`, fill in **Legal ownership (%)** with `30`, untick **Operated by the company**, fill in **Jurisdiction (optional)** with `GH`, then click **Add entity**. | Coldstore Ghana Ltd is listed with 30% under equity share, 0% under financial control, 0% under operational control. |  |  |
| 5 | In Adansi Foods Ltd, open **Legal entities**, then click **Add entity**. Fill in **Name** with `adansi logistics ltd`, set **Relationship** to **Group company or subsidiary (financial control)**, fill in **Economic interest (%)** with `100`, untick **Operated by the company**, then click **Add entity**. | Refused: "An entity named 'adansi logistics ltd' already exists.": names are compared without regard to case. |  |  |

### B3. A parent chain cannot loop

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Edit Coldstore Ghana Ltd and set **Held through** to Adansi Logistics Ltd. Save. | Coldstore Ghana Ltd is listed held through Adansi Logistics Ltd. |  |  |
| 2 | Edit Adansi Logistics Ltd and set **Held through** to Coldstore Ghana Ltd. Save. | Refused: "'Coldstore Ghana Ltd' is held through 'Adansi Logistics Ltd': a parent chain cannot loop.". |  |  |
| 3 | Edit Coldstore Ghana Ltd and set **Held through** to **Held directly by the reporting company**. Save. | Adansi Logistics Ltd is listed held directly by the reporting company. |  |  |

## C. Facilities

### C1. Three sites, one of them leased

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In Adansi Foods Ltd, open **Facilities**, then click **Add facility**. Fill in **Name** with `Kumasi Plant`, fill in **Location** with `Kumasi`, fill in **Country (optional)** with `GH`, fill in **Grid region (optional)** with `GHA`, set **Legal entity** to Adansi Foods Ltd, then click **Add facility**. | Kumasi Plant is listed under Adansi Foods Ltd, with "grid GHA": the Legal entity list names the reporting company as such; a blank grid region follows the country. |  |  |
| 2 | In Adansi Foods Ltd, open **Facilities**, then click **Add facility**. Fill in **Name** with `Tema Depot`, fill in **Location** with `Tema`, fill in **Country (optional)** with `GH`, set **Lease (optional)** to **Operating lease (leased in)**, fill in **Lease from (optional)** with `2025-07-01`, fill in **Lease until (optional)** with `2025-06-30`, set **Legal entity** to Adansi Logistics Ltd, then click **Add facility**. | Refused inline: "The lease ends before it starts.". |  |  |
| 3 | In Adansi Foods Ltd, open **Facilities**, then click **Add facility**. Fill in **Name** with `Tema Depot`, fill in **Location** with `Tema`, fill in **Country (optional)** with `GH`, set **Lease (optional)** to **Operating lease (leased in)**, fill in **Lease from (optional)** with `2025-07-01`, set **Legal entity** to Adansi Logistics Ltd, then click **Add facility**. | Tema Depot is listed under Adansi Logistics Ltd, with its lease. |  |  |
| 4 | In Adansi Foods Ltd, open **Facilities**, then click **Add facility**. Fill in **Name** with `Takoradi Cold Store`, fill in **Location** with `Takoradi`, fill in **Country (optional)** with `GH`, set **Legal entity** to Coldstore Ghana Ltd, then click **Add facility**. | Takoradi Cold Store is listed under Coldstore Ghana Ltd. |  |  |

### C2. An entity with facilities is not deleted

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In Adansi Foods Ltd, open **Legal entities**, then click **Remove** on the row of Coldstore Ghana Ltd. Fill in **Reason** with `walkthrough: trying to remove an entity with a site`, then click **Remove**. | Refused: "'Coldstore Ghana Ltd' still has facilities. Move them to another entity before deleting it.". |  |  |

## D. Emission sources

### D1. An emission source sets the default classification

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In Adansi Foods Ltd, open **Facilities**, then click **Emission sources** on the row of Kumasi Plant. Fill in **Source name** with `Boiler LPG`, set **Kind** to **Stationary combustion**, fill in **Fuel or material (optional)** with `LPG`, then click **Add emission source**. | Boiler LPG is listed at Kumasi Plant as "owned or controlled" with its kind, Stationary combustion. |  |  |
| 2 | In Adansi Foods Ltd, open **Facilities**, then click **Emission sources** on the row of Kumasi Plant. Fill in **Source name** with `Plant grid supply`, set **Kind** to **Purchased electricity**, fill in **Meter or supplier (optional)** with `ECG-KSI-01`, then click **Add emission source**. | Plant grid supply is listed at Kumasi Plant. |  |  |
| 3 | In Adansi Foods Ltd, open **Facilities**, then click **Emission sources** on the row of Tema Depot. Fill in **Source name** with `Delivery fleet`, set **Kind** to **Mobile combustion**, fill in **Fuel or material (optional)** with `Diesel`, tick **Operated by a contractor (its emissions default to scope 3)**, then click **Add emission source**. | Delivery fleet is listed at Tema Depot as "contractor-operated": the form says a contractor's source is scope 3 under chapter 4. |  |  |

### D2. Names are unique per facility

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In Adansi Foods Ltd, open **Facilities**, then click **Emission sources** on the row of Kumasi Plant. Fill in **Source name** with `Boiler LPG`, set **Kind** to **Stationary combustion**, then click **Add emission source**. | Refused: "'Kumasi Plant' already has an emission source named 'Boiler LPG'.". |  |  |

### D3. The history records the structure, and only real changes

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open the edit form of Adansi Logistics Ltd and save without changing anything. |  |  |  |
| 2 | In Adansi Foods Ltd, open **Settings**. | **History** holds an entity added entry reading "Adansi Logistics Ltd added", with `you+ama@…` (the Ama alias) and the moment. **History** holds an entity added entry reading "Coldstore Ghana Ltd added", with `you+ama@…` (the Ama alias) and the moment. **History** holds an entity updated entry reading "Coldstore Ghana Ltd", with `you+ama@…` (the Ama alias) and the moment. **History** holds a facility added entry reading "Kumasi Plant added under Adansi Foods Ltd", with `you+ama@…` (the Ama alias) and the moment. **History** holds a stream added entry reading "Boiler LPG added at Kumasi Plant", with `you+ama@…` (the Ama alias) and the moment. |  |  |
| 3 | Look. | **History** holds 2 entity updated entries. **History** holds 2 entity added entries. **History** holds 3 facility added entries. **History** holds 3 stream added entries: a save that changes nothing writes no row, and a refused act is not an act. |  |  |

### D4. A source described on a record is reconciled against the register

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Add the record "Boiler LPG top-up" at Kumasi Plant: 400 kg, 2025-03-01 to 2025-03-31, with **Emission source** set to **New emission source…**, **Source name *** "Boiler LPG 2" and **Kind** Stationary combustion, **Fuel or material (optional)** LPG. | Refused: "'Kumasi Plant' has an emission source with a similar name: 'Boiler LPG'. Use it, or give a reason to create 'Boiler LPG 2' as a separate source.": a near name is a prompt, never a silent match; the record is not saved and no number is used. |  |  |
| 2 | Add the record "Boiler LPG top-up" at Kumasi Plant: 400 kg, 2025-03-01 to 2025-03-31, with **Emission source** set to **New emission source…**, **Source name *** "boiler lpg" and **Kind** Stationary combustion. | Refused: "'Kumasi Plant' already has an emission source named 'boiler lpg'.": the exact name is taken, so the notice offers "Use Boiler LPG" and no "anyway". |  |  |
| 3 | Look. | **History** holds 3 stream added entries: a refused source creates nothing, and the record it came with is not written either. |  |  |

### D5. An edit keeps the source and writes what changed

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In Adansi Foods Ltd, open **Facilities**, then click **Emission sources** on the row of Tema Depot. Fill in **Source name** with `Yard genset`, set **Kind** to **Stationary combustion**, fill in **Fuel or material (optional)** with `Diesel`, then click **Add emission source**. | Yard genset is listed at Tema Depot. |  |  |
| 2 | On Tema Depot's **Emission sources** page, click **Edit** beside Yard genset, set **Source name** to Yard standby genset, **Meter or supplier (optional)** to Yard tank dip. Click **Save**. | Yard standby genset is listed at Tema Depot with its kind, Stationary combustion. **History** holds a stream edited entry reading "Yard standby genset at Tema Depot: name Yard genset → Yard standby genset, meter or supplier none → Yard tank dip", with `you+ama@…` (the Ama alias) and the moment: the source is what the evidence pack keys on, so a rename or a changed meter is written with the old and new values. |  |  |
| 3 | On Tema Depot's **Emission sources** page, click **Edit** beside Yard standby genset and change nothing. Click **Save**. | **History** holds 1 stream edited entry: a save that changes nothing is not an act. |  |  |
| 4 | On Tema Depot's **Emission sources** page, click **Edit** beside Yard standby genset, set **Kind** to **Mobile combustion**. Click **Save**. | Yard standby genset is listed at Tema Depot with its kind, Mobile combustion. **History** holds a stream edited entry reading "Yard standby genset at Tema Depot: kind stationary combustion → mobile combustion": no record names the source yet, so the kind changes without a reason; procedure 3 case L1 asks for one once records exist. |  |  |
| 5 | On Tema Depot's **Emission sources** page, click **Edit** beside Yard standby genset, set **Source name** to delivery fleet. Click **Save**. | Refused: "'Tema Depot' already has an emission source named 'delivery fleet'.": the check skips the source itself but not its neighbours, and ignores case. |  |  |
| 6 | On Tema Depot's **Emission sources** page, click **Remove** beside Yard standby genset and confirm. | Yard standby genset is no longer listed at Tema Depot: the depot goes into procedure 3 with the one source it had. |  |  |

## E. Units and densities

### E1. A custom unit is a multiple of a registered one

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In Adansi Foods Ltd, open **Units**, fill in **Code** with `litre`, fill in **Label** with `A litre again`, fill in **One unit equals** with `1`, set **Of** to **litre**, then click **Define unit**. | Refused inline: "'litre' is already a registered unit.". |  |  |
| 2 | In Adansi Foods Ltd, open **Units**, fill in **Code** with `crate`, fill in **Label** with `Crate of 24 bottles`, fill in **One unit equals** with `12`, set **Of** to **litre**, then click **Define unit**. | crate is listed as 1 crate = 12 litre. |  |  |
| 3 | In Adansi Foods Ltd, open **Units**, fill in **Code** with `crate`, fill in **Label** with `Crate of 24 bottles`, fill in **One unit equals** with `12`, set **Of** to **litre**, then click **Define unit**. | Refused inline: "A custom unit named 'crate' already exists.". |  |  |

### E2. A typical density is shared; a supplier's is the organization's own

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In Adansi Foods Ltd, open **Units**. | Diesel at 0.84 kg per litre is listed as a **Typical value** and offers no **Delete**: typical values are for planning and the gate says so. |  |  |
| 2 | In Adansi Foods Ltd, open **Units**, fill in **Material** with `Diesel (Adansi CoA)`, fill in **kg per litre** with `0.8325`, fill in **Source** with `Supplier certificate of analysis, May 2025`, then click **Record density**. | Diesel (Adansi CoA) is listed without the typical flag, with a **Delete** button. |  |  |
| 3 | In Adansi Foods Ltd, open **Units**, fill in **Material** with `Diesel (Adansi CoA)`, fill in **kg per litre** with `0.8325`, fill in **Source** with `Supplier certificate of analysis, May 2025`, then click **Record density**. | Refused inline: "A density for 'Diesel (Adansi CoA)' already exists.". |  |  |

## F. Emission factors

### F1. Two packs are imported

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In Adansi Foods Ltd, open **Emission factors**. | **This organization's factors** is empty: the Factor packs card lists the three shipped editions by their display names, each with View factors and Import pack. |  |  |
| 2 | Click **Import pack** on "Ghana: grid electricity and transmission losses". | The import reports "7 added, 0 versioned". "Grid electricity T&D losses, Ghana (derived)" is listed as **Not approved**: the row reads "Caveat: Derived, not published: approve it after checking the year's loss rate with the Energy Commission statistics, or replace it with the utility's figure." under Not approved; the six grid rows carry a note, not a caveat, and arrive approved. |  |  |
| 3 | Click **Approve** on "Grid electricity T&D losses, Ghana (derived)", leave **Check note** empty and click **Approve factor**. | The screen reads "Say what you checked before approving this factor.": Approve opens the dialog "Approve Grid electricity T&D losses, Ghana (derived)" with the caveat and a Check note field; the empty note is refused by the page before any request (the API refuses it too, rule ghg.factor.caveat-note-required on the note field). |  |  |
| 4 | Click **Approve** on "Grid electricity T&D losses, Ghana (derived)", type "Loss rate checked against the Energy Commission's 2024 statistics (20%)." in **Check note** and click **Approve factor**. | "Grid electricity T&D losses, Ghana (derived)" is listed as **Approved**: the row reads Approved by the approver with the moment, then "Checked: Loss rate checked against the Energy Commission's 2024 statistics (20%)."; the caveat stays on the row and both print in the report's factor table. |  |  |
| 5 | Open **Emission factors** and click **Unapprove** on "Grid electricity T&D losses, Ghana (derived)". | "Grid electricity T&D losses, Ghana (derived)" is listed as **Not approved**: leave it unapproved for the procedures that follow; unapproving clears the check note. |  |  |
| 6 | Click **Import pack** on "UK Government (DESNZ) GHG conversion factors 2025". | The import reports "1928 added, 0 versioned": the table pages at 50 and the search narrows it. |  |  |
| 7 | Click **Import pack** on "UK Government (DESNZ) GHG conversion factors 2026". | The import reports "385 added, 1483 versioned" and that 445 lineages this edition drops were retired by nobody. "Gaseous fuels: LPG" is listed with 2 versions: defra-2025 and defra-2026: a row both years carry now shows two versions, defra-2025 to 2025-12-31 and defra-2026 from 2026-01-01; a pack-derived row offers Retire… and never Delete. |  |  |

### F2. A blend's fractions add up to 1

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In Adansi Foods Ltd, open **Emission factors**, then click **Add factor**. Fill in **Name** with `R-410A (composition)`, set **Suggested scope** to **SCOPE_1**, set **Category** to **FUGITIVE_EMISSIONS**, fill in **Unit** with `kg`, fill in **kg CO₂e per unit** with `1923.5`, fill in **HFCs kg per unit (optional)** with `1`, fill in **Blend composition (optional)** with `HFC-32:0.5,HFC-125:0.6`, set **GWP basis of the published figure** to **AR5**, fill in **Source (publication, table, data year)** with `Supplier safety data sheet, 2025`, fill in **Publication year** with `2025`, fill in **Data year** with `2025`, then click **Add factor**. | Refused inline: "The mass fractions of a blend must add up to 1 (for example HFC-32:0.5,HFC-125:0.5).". |  |  |
| 2 | In Adansi Foods Ltd, open **Emission factors**, then click **Add factor**. Fill in **Name** with `R-410A (composition)`, set **Suggested scope** to **SCOPE_1**, set **Category** to **FUGITIVE_EMISSIONS**, fill in **Unit** with `kg`, fill in **kg CO₂e per unit** with `1923.5`, fill in **HFCs kg per unit (optional)** with `1`, fill in **Blend composition (optional)** with `HFC-32:0.5,HFC-125:0.5`, set **GWP basis of the published figure** to **AR5**, fill in **Source (publication, table, data year)** with `Supplier safety data sheet, 2025`, fill in **Publication year** with `2025`, fill in **Data year** with `2025`, then click **Add factor**. | "R-410A (composition)" is listed as **Not approved**. An approval is a separate act by a separate person; the form does not tick it for you. |  |  |
| 3 | In Adansi Foods Ltd, open **Emission factors**, then click **Add factor**. Fill in **Name** with `Long-haul flights (supplier)`, set **Suggested scope** to **SCOPE_3**, set **Category** to **BUSINESS_TRAVEL**, fill in **Unit** with `passenger-km`, fill in **kg CO₂e per unit** with `0.195`, fill in **Source (publication, table, data year)** with `Travel agent's emissions statement, 2025`, fill in **Publication year** with `2025`, fill in **Data year** with `2025`, then click **Add factor**. | "Long-haul flights (supplier)" is listed as **Not approved**. |  |  |

### F3. A factor retires by its validity end

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **Retire…** on "R-410A (composition)" and click **Retire factor** with **Valid to** empty. | Refused inline: "Choose the last day the factor applies.": nothing is saved. |  |  |
| 2 | Click **Retire…** on "R-410A (composition)", enter 2025-12-31 in **Valid to** and click **Retire factor**. | "R-410A (composition)" is listed with its validity ending 2025-12-31. The row stays listed with its validity ending 2025-12-31, it still covers FY2025 where procedure 5 uses it, and nothing after. |  |  |

### F4. The author cannot approve; the reviewer does

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **Approve** on "Long-haul flights (supplier)". | Refused: "You entered 'Long-haul flights (supplier)'. A factor is checked by someone other than the person who typed it (Corporate Standard chapter 7): ask Kofi Mensah to approve it.". |  |  |
| 2 | As Kofi Mensah in the private window, sign in as "Kofi Mensah" with `you+kofi@…` (the Kofi alias) and `Kofi-pass-2026`. | Kofi Mensah is signed in. |  |  |
| 3 | Click **Approve** on "Long-haul flights (supplier)". | "Long-haul flights (supplier)" is listed as **Approved** "by `you+kofi@…` (the Kofi alias)" with the date. |  |  |
| 4 | In Adansi Foods Ltd, open **Emission factors**. | "R-410A (composition)" is listed as **Not approved**: leave it unapproved, procedure 5 reads the gate refusing it. |  |  |

## G. A self-approval is recorded where nobody else could check

### G1. Solo Ltd

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Yaw Darko in the private window, sign in as "Yaw Darko" with `you+yaw@…` (the Yaw alias) and `Yaw-pass-2026`. | Yaw Darko is signed in. |  |  |
| 2 | Open **GHG accounting**, then click **New organization**. Fill in **Name** with `Solo Ltd`, then click **Create organization**. | The **Overview** opens, and the foot of the sidebar reads "Your role: Owner": a verifier elsewhere is an owner here, roles are per organization. |  |  |
| 3 | In Solo Ltd, open **Emission factors**, then click **Add factor**. Fill in **Name** with `Diesel (Solo)`, set **Suggested scope** to **SCOPE_1**, set **Category** to **STATIONARY_COMBUSTION**, fill in **Unit** with `litre`, fill in **kg CO₂e per unit** with `2.66`, fill in **Source (publication, table, data year)** with `Own transcription of DESNZ 2025`, then click **Add factor**. | "Diesel (Solo)" is listed as **Not approved**. |  |  |
| 4 | Click **Approve** on "Diesel (Solo)". | "Diesel (Solo)" is listed as **Approved** "by `you+yaw@…` (the Yaw alias)" with the date and "(self-approved: nobody else could check it)": nobody else is a member, so the refusal of case F4 does not apply, and the record says so; procedure 6 reads the sentence on a report. |  |  |
| 5 | Sign out. | Yaw Darko's session has ended: the sign-in page. |  |  |

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals:** a joint venture and a franchise (the mining pack records them); a facility deleted with records, which procedure 3 covers; a facility inside a frozen boundary, which procedure 4 covers; reading a pack without importing it, which the mining pack covers in detail; a change of kind or operator on a source with records, which procedure 3 covers; the switcher in the header and the way back to a changed name while it is typed (A3).

## Change notes

- **Version 2, 2026-09-29.** The sidebar's "Your role" line (A1, A2) and "Reporting company" on **Legal entities** and in the facility form (B1, C1; PR #119). A1 step 7 no longer assumes the History card holds only member rows. New case D3 reads the structure rows of the history and checks that a save with no change writes none (PR #121). "Retire, not delete" is gone: F1 step 5 reads **Retire…**, and new case F2b retires a factor by setting **Valid to** (PR #119).
- **Version 3, 2026-09-29.** Case A3 sat under the heading of section B; the heading now opens B1. B1 step 2 reads the reporting company's structure fields as disabled rather than absent (PR #126). B2 step 2 quotes the list as it reads ("from 2025-07-01"). C1 step 1: the **Facilities** list names the reporting company as such, and its counter reads "Under the company or a subsidiary" (the walkthrough fix of 2026-09-29).
- **Version 4, 2026-10-02.** Transliterated to the QA scenario DSL. Cases F2b and F3 are now F3 and F4. The percentage range of an entity's shares is refused by the service with a named rule rather than by form validation. The rows of the history are checked by kind and count; the switcher, the typed name's notice and the disabled fields of the reporting company's form are described in the drivers' projections or listed under the non-goals.
- **Version 5, 2026-10-07.** New case D5: **Edit** on a source's row opens the Edit emission source page (spec 04.3 amended, spec 04.10); a rename and a changed meter write an "Emission source edited" row with the old and new values, an unchanged save writes none, a kind change on a source without records needs no reason, and the duplicate check skips the source itself. The reason a reclassification needs once records exist is procedure 3's case L1.
