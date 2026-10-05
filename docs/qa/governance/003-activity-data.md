<!-- generated from qa/packs/governance/003-activity-data.yaml by make qa-export; edit the YAML -->
# Procedure 3: Activity data

**Objective.** Confirm that a clean file previews with control totals and imports once, that a file with a bad row imports nothing and names each row by number, and that a record is drafted, entered, corrected, evidenced and removed with the reasons the record keeps.

**Covers** [spec 04](../../../specs/04-operational-boundary-and-classification.md), [spec 04.4](../../../specs/04.4-activity-data-quality-evidence-and-corrections.md), [spec 04.5](../../../specs/04.5-bulk-import-and-activity-register.md), [spec 04.6](../../../specs/04.6-activity-register-drafts-readiness-and-source-documents.md) and [spec 08](../../../specs/08-form-validation-and-ui-polish.md). Spec 08 for the inline rules.

**Estimated time:** 30 minutes.

**Procedure version:** 3 (2026-10-02). The change notes are at the foot.

**Run this procedure** after procedure 2. Procedure 4 onwards works on the ten records it imports.

## Prerequisites

- Adansi Foods Ltd as procedure 2 leaves it: three facilities, three emission sources.
- The fixture files `adansi-2025.csv`, `adansi-2025-rejected.csv`, `adansi-2026.csv`, `source-document.txt` and `not-evidence.zip`.
- Ama in the normal window.
- Accounts in this procedure (replace `you+…@…` with aliases of the mailbox you read):
- Ama Owusu signs in with `you+ama@…` and `Ama-pass-2026`, in the private window.

## A. The clean file

### A1. The template, and the dry run

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Ama Owusu in the private window, sign in as "Ama Owusu" with `you+ama@…` and `Ama-pass-2026`. | Ama Owusu is signed in. |  |  |
| 2 | Look. | **Download CSV template** gives a file whose header is `facility,emission_source,activity_type,quantity,unit,period_start,period_end,data_source,evidence_ref,data_quality,data_quality_tier,uncertainty_percent,note`, the same as the fixture's. |  |  |
| 3 | Click **Import CSV** and choose `adansi-2025.csv`. | The file is checked at once, and nothing is written. **Control totals** groups the rows by facility, emission source and unit: Kumasi Plant, Boiler LPG, 2,400 litre; Kumasi Plant, Plant grid supply, 120 MWh; Tema Depot, Delivery fleet, 5,000 litre. "10 records to add" lists each row with its facility and period. Under **Worth a look before adding**, row 7 is named: "the period is longer than one month (2025-12-15 to 2026-01-15)". Rows 2, 3, 4 read **Ready**. 7 rows read "No emission source" and 2 of them "Needs evidence": "Missing source" appears nowhere, every row names its data source. |  |  |

### A2. The import, and the same file again

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **Import CSV**, choose `adansi-2025.csv` and click **Add records**. | The register holds 10 records. The register lists ACT-0001 to ACT-0010. Sorted by period with the newest first: ACT-0006 at the top, ACT-0001 at the foot. |  |  |
| 2 | Click **Import CSV** and choose `adansi-2025.csv`. | Every row is rejected Row 2: "duplicate: the same facility, activity, quantity, unit and period already exist on file or earlier in this file". **Add records** stays disabled. |  |  |

## B. The rejected file

### B1. Four rows, four reasons, nothing written

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **Import CSV** and choose `adansi-2025-rejected.csv`. | "Nothing will import: 4 rows rejected. Fix them and choose the file again." Row 2: "quantity '1,2O0' is not a number". Row 3: "period_start is in the future". Row 4: "no facility named 'Kumasi Depot'". Row 5: "duplicate: the same facility, activity, quantity, unit and period already exist on file or earlier in this file". **Add records** stays disabled: the header is row 1, so the rows are named 2 to 5; row 3 also reads "period_end is in the future" because an empty end takes the start; row 5 repeats ACT-0001. The register holds 10 records: a file imports whole or not at all. |  |  |

## C. Readiness

### C1. The banner counts what is missing, and a fix clears it

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In Adansi Foods Ltd, open **Activity data**. | The banner above the register counts 7 records that need attention and offers **Resolve 7 items**: ACT-0004 to ACT-0010; the wording is about completeness, not assurance. |  |  |
| 2 | In Adansi Foods Ltd, open **Activity data**. | ACT-0009 is on the register reading "No emission source" and "Needs evidence": its tier is not missing, a blank tier follows the method, ESTIMATED to tier 4. |  |  |
| 3 | Open ACT-0009, type the document reference "WB-2025-11", and give the reason "Weighbridge ticket found". Save. | ACT-0009 is on the register with the reference WB-2025-11 reading "No emission source" and "reference only". The banner above the register counts 7 records that need attention and offers **Resolve 7 items**: "Needs evidence" goes and the drawer reads "Reference WB-2025-11, nothing attached"; the emission source is still missing, and a record leaves the count only when every item on it is resolved. |  |  |

## D. Drafts

### D1. A draft holds a source until its figures arrive

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **+ Add activity**, type the activity type "Generator diesel", the facility Kumasi Plant, nothing else, and click **Save draft**. | Generator diesel is on the register as a draft with no quantity and no period; the banner names it as a draft with data outstanding. |  |  |
| 2 | Open the draft "Generator diesel", type 150 litre and the period 2025-02-01 to 2025-02-28, and save it as a fact. | Generator diesel is on the register as a fact with the quantity 150 litre. Its history reads "Entered from a draft". |  |  |
| 3 | Look. | Open the record again: the drawer offers Save but no Save draft. A saved record is corrected with a reason or removed with a reason; it cannot go back to a draft. |  |  |

## E. Corrections

### E1. A correction needs a reason and keeps the history

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open ACT-0002, change the quantity to 121, and save with the reason "typo". | Refused inline: "A correction needs a reason of at least 5 characters.". |  |  |
| 2 | Open ACT-0002, change the quantity to 121, and save with the reason "Invoice re-read: 121 MWh". | The history lists the corrected with the old value 120, the new value 121, the reason "Invoice re-read: 121 MWh" and the actor's email. |  |  |
| 3 | Open ACT-0002, change the quantity to 120, and save with the reason "Back to the invoice figure for the procedures". | The history lists the corrected with the old value 121, the new value 120, the reason "Back to the invoice figure for the procedures" and the actor's email: the history holds both corrections, nothing is overwritten. |  |  |

## F. Evidence

### F1. A file and a link attach; a wrong type and a bare address are refused

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On ACT-0001, under **Supporting evidence**, attach `not-evidence.zip`. | Refused inline: "Attach a PDF, an image (PNG, JPEG, WebP), a spreadsheet (XLSX, XLS, CSV) or a text file.". |  |  |
| 2 | On ACT-0001, under **Supporting evidence**, attach `source-document.txt`. | source-document.txt is listed with its name, size and who uploaded it. |  |  |
| 3 | On ACT-0001, add a link named "Supplier portal" with the URL `www.example.test/delivery/LPG-2025-03`. | Refused inline: "A link starts with https:// or http://.". |  |  |
| 4 | On ACT-0001, add a link named "Supplier portal" with the URL `https://example.test/delivery/LPG-2025-03`. | "Supplier portal" is listed as a link; the drawer's evidence tab reads "Evidence 2". |  |  |

## G. Removals

### G1. A removal needs a reason, and several are removed with one

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open the "Generator diesel" record, click **Remove**, give "Scratch record for the draft case" and confirm. | The register holds 10 records: the dialog keeps its button disabled until a reason is typed; the record's history is kept. |  |  |
| 2 | Click **Import CSV**, choose `adansi-2026.csv` and click **Add records**. | The register holds 12 records. |  |  |
| 3 | Tick ACT-0012 and ACT-0013, click **Remove 2 selected** and give the reason "Scratch rows for the bulk removal case". | The register holds 10 records: both go under the one reason; procedure 7 imports the same file again for FY2026, and a removed record does not count as a duplicate. |  |  |

### G2. A facility with records is not removed

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In Adansi Foods Ltd, open **Facilities**, then click **Remove** on the row of Takoradi Cold Store. Fill in **Reason** with `walkthrough removal of a site with records`, then click **Remove**. | Refused: "'Takoradi Cold Store' has recorded activity data. Facts are the audit trail: remove or reassign its activity records before deleting the facility.". |  |  |

## H. Source documents

### H1. Every document with its record

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In Adansi Foods Ltd, open **Source documents**. | `source-document.txt` is listed against ACT-0001. `Supplier portal` is listed against ACT-0001. The imported file `adansi-2025.csv` is listed with its digest and the moment it was uploaded. The imported file `adansi-2026.csv` is listed with its digest and the moment it was uploaded. |  |  |
| 2 | Look. | **Download evidence index (CSV)** gives a CSV with the header `record_ref,activity_type,facility,period_start,period_end,evidence_ref,document,kind,url,content_type,size_bytes,uploaded_by,uploaded_at` and one row per document. |  |  |

## I. The register and its URL

### I1. A view is a link

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Look. | Type "diesel" in the search and choose the facility Kumasi Plant: one record, ACT-0004, and the address bar carries the search and the facility. Open ACT-0004, copy the address and open it in a new tab: the same view opens with the same record in the drawer. Press Escape, then use the arrow keys and Enter on the table: the cursor moves down the rows and Enter opens the record under it. |  |  |

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals:** the 20 MB evidence limit and the 10,000-row import limit (no fixture of that size); a record in a custom unit (the mining pack); the register's sorting and paging beyond ten records.

## Change notes

- **Version 2, 2026-09-29.** C1 step 3 quotes the drawer's evidence line, which now names the reference (the walkthrough fix of 2026-09-29).
- **Version 3, 2026-10-02.** Transliterated to the QA scenario DSL. The dialog's title and eyebrow, the readiness pills' wording and the register's keyboard handling are observed by hand (case I1) or described in the drivers' projections; the import outcomes are checked against the server's preview figures.
