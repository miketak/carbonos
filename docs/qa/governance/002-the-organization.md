# Procedure 2: The organization

**Objective.** Confirm that an owner records the organization's members,
legal entities, sites, source streams, units, densities and emission
factors; that each wrong structure is refused with the rule that refuses
it; that a verifier reads everything and changes nothing; and that a
hand-entered factor is checked by someone other than the person who typed
it, or, where nobody else could, records that it was self-approved.

**Covers** [spec 01.2](../../../specs/01.2-organization-membership-and-roles.md),
[spec 01.4](../../../specs/01.4-role-aware-ui-and-visible-refusals.md),
[spec 01.7](../../../specs/01.7-the-organization-settings-area.md),
[spec 03.1](../../../specs/03.1-legal-entities-and-table-1.md),
[spec 03.3](../../../specs/03.3-table-1-completeness.md),
[spec 03.4](../../../specs/03.4-entity-dates-facility-attributes-and-boundary-prefill.md),
[spec 04.3](../../../specs/04.3-source-streams-and-scope-choice.md),
[spec 02.2](../../../specs/02.2-units-densities-and-custom-units.md),
[spec 02.1](../../../specs/02.1-emission-factor-library.md),
[spec 02.4](../../../specs/02.4-sector-pack-completeness.md),
[spec 02.9](../../../specs/02.9-narrowing-the-catalogue-to-defra-and-ghana.md),
[spec 02.10](../../../specs/02.10-retiring-the-shared-factor-library.md) and
[spec 02.11](../../../specs/02.11-approval-as-a-control.md).

**Estimated time:** 45 minutes.

**Run this procedure** after procedure 1. Procedures 3 to 8 rest on the
organization it builds.

## Prerequisites

- The six accounts of procedure 1.
- Ama in the normal window; the private window for Kofi and Yaw.

## A. The organization and its members

### A1. The creator is the owner, and members are added by email

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Ama, click **New organization**, type the name "Adansi Foods Ltd", leave the rest empty, and create. | The organization opens on its **Overview**. Ama is its owner. | | |
| 2 | Open **Settings**. Under **Members**, add the Kofi alias as **Reviewer**, the Esi alias as **Preparer** and the Yaw alias as **Verifier (read-only)**. | Each appears with the role chosen. The card says reviewers also designate final runs, publish and create corrections, and verifiers read only. | | |
| 3 | Add `nobody@example.test`. | Refused: there is no account with that address. Membership is granted to an existing account; a newcomer requests access first. | | |
| 4 | Add the Kofi alias again. | Refused: "<the Kofi alias> is already a member of 'Adansi Foods Ltd'.". | | |
| 5 | Change Ama's own role to **Preparer**. | Refused: "'Adansi Foods Ltd' needs at least one owner.". | | |
| 6 | Click **Remove** on Ama's row. | The same refusal. | | |
| 7 | Read **History** at the foot of the page. | Three entries record the members added, each with Ama's email and the moment. | | |

### A2. A verifier reads everything and changes nothing

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Yaw in the private window, open Adansi Foods Ltd. | The organization is listed and opens. Every page carries the banner "Your role in this organization is Verifier (read-only).". | | |
| 2 | Open **Legal entities**, **Facilities** and **Emission factors**. | Every button that would write is disabled, with a tooltip saying the role is read-only. Nothing is hidden: a verifier sees the record, not a blank page. | | |
| 3 | Sign out of the private window. | | | |

## B. Legal entities

### B1. The reporting company is there by definition

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Ama, open **Legal entities**. | Adansi Foods Ltd is listed as the reporting company: 100% under every approach, operated. Its row has no **Remove**. | | |
| 2 | Open its edit form. | The form takes a name, the dates and a jurisdiction. It offers no relationship and no percentages: the reporting company is the group's own wholly owned operation by definition. Close it. | | |

### B2. A subsidiary with dates, and an associate

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Add an entity: name "Adansi Logistics Ltd", relationship **Group company or subsidiary (financial control)**, economic interest 100, legal ownership 100, **Operated by the company** ticked, **Acquired on** 2025-07-01, **Disposed of on** 2025-01-01, jurisdiction Ghana. Save. | Refused inline: "The disposal date is before the acquisition date.". | | |
| 2 | Clear the disposal date and save. | E1 is listed with 100% under every approach and "acquired 2025-07-01". | | |
| 3 | Add a second entity: name "Coldstore Ghana Ltd", relationship **Associate or affiliate (significant influence, no control)**, economic interest 150. Save. | Refused inline under the field: the percentage must be between 0 and 100. | | |
| 4 | Set economic interest 30, legal ownership 30, leave **Operated by the company** unticked, jurisdiction Ghana. Save. | E2 is listed. Its Table 1 row reads 30% under equity share and 0% under financial and operational control. | | |
| 5 | Add an entity named "adansi logistics ltd". | Refused: "An entity named 'adansi logistics ltd' already exists.". Names are compared without regard to case. | | |

### B3. A parent chain cannot loop

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Edit E2 and set **Held through** to Adansi Logistics Ltd. Save. | Saved: E2 is held through E1. | | |
| 2 | Edit E1 and set **Held through** to Coldstore Ghana Ltd. Save. | Refused: the message ends "a parent chain cannot loop.". | | |
| 3 | Cancel, then edit E2 back to **Held directly by the reporting company**. | Both entities are held directly. | | |

## C. Facilities

### C1. Three sites, one of them leased

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open **Facilities** and add "Kumasi Plant": location "Kumasi", country Ghana, the Ghana grid region, legal entity Adansi Foods Ltd. | S1 is listed under E0. | | |
| 2 | Add "Tema Depot": location "Tema", country Ghana, legal entity Adansi Logistics Ltd, lease **operating lease (leased in)**, **Lease from** 2025-07-01, **Lease until** 2025-06-30. Save. | Refused inline: "The lease ends before it starts.". | | |
| 3 | Clear **Lease until** and save. | S2 is listed under E1 with its lease. | | |
| 4 | Add "Takoradi Cold Store": location "Takoradi", country Ghana, legal entity Coldstore Ghana Ltd. | S3 is listed under E2. | | |

### C2. An entity with facilities is not deleted

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On **Legal entities**, click **Remove** on Coldstore Ghana Ltd and confirm with a reason. | Refused: "'Coldstore Ghana Ltd' still has facilities. Move them to another entity before deleting it.". | | |

## D. Source streams

### D1. A stream sets the default classification

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On Kumasi Plant, open its streams and add "Boiler LPG": kind stationary combustion, fuel "LPG". | Listed as "owned or controlled" with its kind. | | |
| 2 | Add "Plant grid supply": kind purchased electricity, meter or supplier "ECG-KSI-01". | Listed. | | |
| 3 | On Tema Depot, add "Delivery fleet": kind mobile combustion, fuel "Diesel", and tick **Operated by a contractor (its emissions default to scope 3)**. | Listed as "contractor-operated". The form says a contractor's source is scope 3 under chapter 4. | | |

### D2. Names are unique per facility

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On Kumasi Plant, add another stream named "Boiler LPG". | Refused: "'Kumasi Plant' already has a stream named 'Boiler LPG'.". | | |

## E. Units and densities

### E1. A custom unit is a multiple of a registered one

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open **Units** and add a custom unit with the code `litre`, any label, one unit equals 1, of litre. | Refused inline: "'litre' is already a registered unit.". | | |
| 2 | Change the code to `crate`, label "Crate of 24 bottles", one unit equals 12, of litre. Save. | Listed as 12 litre. | | |
| 3 | Add `crate` again. | Refused: "A custom unit named 'crate' already exists.". | | |

### E2. A typical density is shared; a supplier's is the organization's own

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Read the **Densities** list. | The shipped rows (Diesel at 0.84 kg per litre among them) are marked **Typical value** and offer no **Delete**. The text says typical values are for planning and the gate says so. | | |
| 2 | Record a density: material "Diesel (Adansi CoA)", 0.8325 kg per litre, source "Supplier certificate of analysis, May 2025". | Listed without the typical flag, with a **Delete** button. | | |
| 3 | Record the same material again. | Refused: "A density for 'Diesel (Adansi CoA)' already exists.". | | |

## F. Emission factors

### F1. Two packs are imported

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open **Emission factors**. | **Our factors** is empty. The **Factor packs** card lists the two shipped editions, `defra-2026` and `ghana`, each with **View factors** and **Import pack**. | | |
| 2 | Click **Import pack** on the Ghana pack. | The import reports "ghana, applying from 2025-01-01: 7 added, 0 versioned, 0 tagged, 0 unchanged.". Seven rows arrive; "Grid electricity T&D losses, Ghana (derived)" reads **Not approved** with an **Approve** button. Leave it. | | |
| 3 | Click **Import pack** on the DESNZ 2026 pack. | The import reports 1,868 added, 0 versioned. The table pages at 50 and the search narrows it. | | |
| 4 | Read the action column of any imported row. | Where a hand-entered factor would offer **Delete**, a pack-derived row reads "Retire, not delete": its versions are the record of what was calculated with. | | |

### F2. A blend's fractions add up to 1

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **Add an emission factor**: name "R-410A (composition)", suggested scope 1, category fugitive emissions, unit `kg`, kg CO₂e per unit 1923.5, HFCs kg per unit 1, **Blend composition** `HFC-32:0.5,HFC-125:0.6`, **GWP basis of the published figure** AR5, source "Supplier safety data sheet, 2025", publication year 2025, data year 2025. Add. | Refused: "The mass fractions of a blend must add up to 1 (for example HFC-32:0.5,HFC-125:0.5).". | | |
| 2 | Change the composition to `HFC-32:0.5,HFC-125:0.5` and add. | The row is listed as **Not approved**. An approval is a separate act by a separate person; the form does not tick it for you. | | |
| 3 | Add "Long-haul flights (supplier)": suggested scope 3, category business travel, unit `passenger-km`, kg CO₂e per unit 0.195, source "Travel agent's emissions statement, 2025", publication year 2025, data year 2025. | Listed as **Not approved**. | | |

### F3. The author cannot approve; the reviewer does

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Ama, click **Approve** on "Long-haul flights (supplier)". | Refused: "You entered 'Long-haul flights (supplier)'. A factor is checked by someone other than the person who typed it (Corporate Standard chapter 7): ask <a name> to approve it.". The name is another member who can approve. | | |
| 2 | As Kofi in the private window, open **Emission factors** and click **Approve** on the same row. | The row reads approved "by <the Kofi alias>" with the date. | | |
| 3 | Leave "R-410A (composition)" unapproved. | Procedure 5 reads the gate refusing it. | | |

## G. A self-approval is recorded where nobody else could check

### G1. Solo Ltd

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Yaw in the private window, click **New organization** and create "Solo Ltd". | Yaw is its owner. A verifier elsewhere is an owner here: roles are per organization. | | |
| 2 | Under **Emission factors**, add "Diesel (Solo)": scope 1, stationary combustion, unit `litre`, 2.66 kg CO₂e per unit, source "Own transcription of DESNZ 2026". | Listed as **Not approved**. | | |
| 3 | Click **Approve**. | Approved. The row reads "by <the Yaw alias>" and "(self-approved: nobody else could check it)". Nobody else is a member, so the refusal of case F3 does not apply, and the record says so. Procedure 6 reads the sentence on a report. | | |
| 4 | Sign out of the private window. | | | |

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals:** a joint venture and a franchise (the mining pack
records them); a facility deleted with records, which procedure 3 covers;
a facility inside a frozen boundary, which procedure 4 covers; reading a
pack without importing it, which the mining pack covers in detail.
