# Procedure 3: Activity data

**Objective.** Confirm that a clean file previews with control totals and
imports once, that a file with a bad row imports nothing and names each
row by number, and that a record is drafted, entered, corrected, evidenced
and removed with the reasons the record keeps.

**Covers** [spec 04](../../../specs/04-operational-boundary-and-classification.md),
[spec 04.4](../../../specs/04.4-activity-data-quality-evidence-and-corrections.md),
[spec 04.5](../../../specs/04.5-bulk-import-and-activity-register.md),
[spec 04.6](../../../specs/04.6-activity-register-drafts-readiness-and-source-documents.md) and the
inline rules of [spec 08](../../../specs/08-form-validation-and-ui-polish.md).

**Estimated time:** 30 minutes.

**Run this procedure** after procedure 2. Procedure 4 onwards works on the
ten records it imports.

## Prerequisites

- Adansi Foods Ltd as procedure 2 leaves it: three facilities, three
  streams.
- The fixture files `adansi-2025.csv`, `adansi-2025-rejected.csv`,
  `source-document.txt` and `not-evidence.zip`.
- Ama in the normal window.

## A. The clean file

### A1. The template, and the dry run

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open **Activity data** and click **Import CSV**, then **Download CSV template**. | The dialog is titled "Import activity data" under the eyebrow "BULK ENTRY". The template's header is `facility,stream,activity_type,quantity,unit,period_start,period_end,data_source,evidence_ref,data_quality,data_quality_tier,uncertainty_percent,note`, the same as the fixture's. | | |
| 2 | Choose `adansi-2025.csv`. | The file is checked at once, and nothing is written. **Control totals** groups the rows by facility, stream and unit: Kumasi Plant, Boiler LPG, 2,400 litre; Kumasi Plant, Plant grid supply, 120 MWh; Tema Depot, Delivery fleet, 5,000 litre; and the rows with no stream by unit. "10 records to add" lists each row with its facility and period. | | |
| 3 | Read **Worth a look before adding**. | Row 7 (the year-end LPG) is named: "the period is longer than one month (2025-12-15 to 2026-01-15); monthly rows make the coverage matrix and cut-off checks precise". | | |
| 4 | Read the readiness pill on each listed row. | Rows 2 to 4 read **Ready**. Rows 5 to 11 read "No stream"; rows 9 and 10, which carry no document reference, read "No stream +1", the second item being "Needs evidence", and the summary lines above the list count "7 rows: no stream" and "2 rows: needs evidence". "Missing source" appears nowhere: every row names its data source. The line under the totals counts the eight rows that are "reference only, nothing attached". | | |

### A2. The import, and the same file again

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **Add records**. | "10 records imported." The register lists ten records, ACT-0001 to ACT-0010, sorted by period with the newest first: the year-end LPG (ACT-0006) at the top, the March LPG (ACT-0001) at the foot. | | |
| 2 | Choose `adansi-2025.csv` again. | Every row is rejected: "duplicate: the same facility, activity, quantity, unit and period already exist on file or earlier in this file". **Add records** stays disabled. Cancel. | | |

## B. The rejected file

### B1. Four rows, four reasons, nothing written

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **Import CSV** and choose `adansi-2025-rejected.csv`. | "Nothing will import: 4 rows rejected. Fix them and choose the file again.". The header is row 1, so the rows are named 2 to 5. | | |
| 2 | Read the four reasons. | Row 2: "quantity '1,2O0' is not a number". Row 3: "period_start is in the future; period_end is in the future" (an empty end takes the start). Row 4: "no facility named 'Kumasi Depot'". Row 5: "duplicate: the same facility, activity, quantity, unit and period already exist on file or earlier in this file", because it repeats ACT-0001. | | |
| 3 | Read the buttons and the register. | **Add records** is disabled. Cancel: the register still holds ten records. A file imports whole or not at all. | | |

## C. Readiness

### C1. The banner counts what is missing, and a fix clears it

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Read the banner above the register. | It counts 7 records that need attention (ACT-0004 to ACT-0010) and offers **Resolve 7 items**. The wording is about completeness, not assurance. | | |
| 2 | Click **Resolve 7 items**. | The register narrows to the seven. ACT-0009 (canteen waste) reads "No stream" and "Needs evidence". Its tier is not missing: a blank tier follows the method, ESTIMATED to tier 4. | | |
| 3 | Open ACT-0009, type the document reference "WB-2025-11", and give the reason "Weighbridge ticket found". Save. | "Needs evidence" goes; the drawer notes the reference as "Reference only, nothing attached". The banner still counts 7: the stream is still missing, and a record leaves the count only when every item on it is resolved. | | |

## D. Drafts

### D1. A draft holds a source until its figures arrive

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **+ Add activity**, type the activity type "Generator diesel", the facility Kumasi Plant, nothing else, and click **Save draft**. | The record is saved as a draft with no quantity and no period. The banner names it as a draft with data outstanding. | | |
| 2 | Open the draft, type 150 litre and the period 2025-02-01 to 2025-02-28, and save it as a fact. | The record is a fact. Its history reads "Entered from a draft". | | |
| 3 | Open it again and look for a way back to a draft. | There is none: the drawer offers **Save** but no **Save draft**. A saved record is corrected with a reason or removed with a reason; it cannot go back to a draft. | | |

## E. Corrections

### E1. A correction needs a reason and keeps the history

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open ACT-0002 (plant grid electricity), change the quantity to 121, and save with the reason "typo". | Refused: the reason needs at least 5 characters. | | |
| 2 | Give the reason "Invoice re-read: 121 MWh". Save. | Saved. The history lists the correction with the old value 120, the new value 121, Ama's email and the reason. | | |
| 3 | Correct it back to 120 with the reason "Back to the invoice figure for the procedures". | The history now holds both corrections. Nothing is overwritten. | | |

## F. Evidence

### F1. A file and a link attach; a wrong type and a bare address are refused

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On ACT-0001, under **Supporting evidence**, attach `not-evidence.zip`. | Refused: "Attach a PDF, an image (PNG, JPEG, WebP), a spreadsheet (XLSX, XLS, CSV) or a text file.". | | |
| 2 | Attach `source-document.txt`. | Listed with its name, size and who uploaded it. | | |
| 3 | Add a link named "Supplier portal" with the URL `www.example.test/delivery/LPG-2025-03`. | Refused: "A link starts with https:// or http://.". | | |
| 4 | Change it to `https://example.test/delivery/LPG-2025-03`. | Listed as a link. The drawer's evidence tab now reads "Evidence 2". | | |

## G. Removals

### G1. A removal needs a reason, and several are removed with one

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open the "Generator diesel" record of case D1 and click **Remove**. | The dialog asks for a reason and keeps its button disabled until one is typed. | | |
| 2 | Give "Scratch record for the draft case" and confirm. | The record leaves the register and the register reads ten again. Its history is kept. | | |
| 3 | Import `adansi-2026.csv` to have two throwaway rows, tick both, and read the footer. | "2 selected" with **Remove 2 selected**. | | |
| 4 | Click **Remove 2 selected** and give the reason "Scratch rows for the bulk removal case". | Both go under the one reason. Procedure 7 imports the same file again for FY2026; a removed record does not count as a duplicate. | | |

### G2. A facility with records is not removed

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On **Facilities**, remove Takoradi Cold Store with a reason. | Refused: the message names the facility, says it has recorded activity data, and ends "remove or reassign its activity records before deleting the facility.". | | |

## H. Source documents

### H1. Every document with its record

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open **Source documents**. | `source-document.txt` and the link are listed against ACT-0001. The imported file `adansi-2025.csv` is listed with its digest and the moment it was uploaded; `adansi-2026.csv` as well. | | |
| 2 | Click **Download evidence index (CSV)**. | A CSV with the header `record_ref,activity_type,facility,period_start,period_end,evidence_ref,document,kind,url,content_type,size_bytes,uploaded_by,uploaded_at` and one row per document. | | |

## I. The register and its URL

### I1. A view is a link

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Type "diesel" in the search and choose the facility Kumasi Plant. | One record: ACT-0004. The address bar carries the search and the facility. | | |
| 2 | Open ACT-0004, copy the address, open it in a new tab. | The same view opens with the same record in the drawer. | | |
| 3 | Press Escape, then use the arrow keys and Enter on the table. | The cursor moves down the rows and Enter opens the record under it. | | |

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals:** the 20 MB evidence limit and the 10,000-row import
limit (no fixture of that size); a record in a custom unit (the mining
pack); the register's sorting and paging beyond ten records.
