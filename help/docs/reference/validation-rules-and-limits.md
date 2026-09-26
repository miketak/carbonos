---
owner: miketak
last_reviewed: 2026-09-26
---

# Validation rules and limits

The lengths, sizes and ranges CarbonOS enforces, and the message it
answers with where one is printed.

<!-- sources: backend request records under com.carbonos.ghg.internal.web.dto and com.carbonos.user (Size, Min, Max annotations); PasswordPolicy.java; PlatformSettingsService.java; ActivityImportService.java; EvidencePanel.tsx; verified 2026-09-24; spec 01.8 (account numbers, verified 2026-09-26) -->

## Accounts and access

| Rule | Value |
| --- | --- |
| Password | "At least 12 characters, with a letter and a digit." At most 72. |
| Access link | Valid for 7 days, usable once: "This link is invalid or has expired. Access links are valid for 7 days; you can always request access again." |
| Support access window | Between 1 and 72 hours; 24 by default. A grant keeps the window it was taken under. |
| Support access reason | At least 10 characters, at most 500: "Give a reason of at least 10 characters." |
| Platform setting change reason | At least 10 characters. |

## Organization

| Rule | Value |
| --- | --- |
| Name | Required, up to 120 characters. Need not be unique: when another organization carries it, the form says so once and proceeds on **Create anyway** or **Save anyway**. |
| Account number | Assigned when the organization is created, shown as ORG-*NNNN*, never edited, never reused. |
| Address | Up to 255 characters. Contact: up to 160. |
| Deleting the organization | Type the name exactly ("Type the organization's name exactly to confirm.") and give a reason of at least 10 characters, up to 500. An organization with a published inventory cannot be deleted. |
| Custom unit | Code up to 30 characters, label up to 120, base unit a registered code. |

## Activity data

| Rule | Value |
| --- | --- |
| CSV import | 5 MB and 10,000 rows per file; column limits in [CSV import template](csv-import-template.md). |
| Evidence file | "PDF, image, spreadsheet or text, up to 20 MB." (`.pdf`, `.png`, `.jpg`, `.jpeg`, `.webp`, `.csv`, `.xlsx`, `.xls`, `.txt`, `.docx`). |
| Evidence link | URL required, up to 1,000 characters; name up to 255. |
| Removal reason | Required. |
| Correction reason | Required when a saved value changes; kept in the record's history. |

## Emission factors

| Rule | Value |
| --- | --- |
| Name | Required, up to 120 characters. Unit: up to 30. Source: required, up to 500. Source URL: up to 500. Note: up to 500. |
| Years | Publication year and data year between 1990 and 2100. |
| Blend composition | Up to 255 characters, as `HFC-32:0.5,HFC-125:0.5`; mass fractions must add up to 1. |
| Approval | By a reviewer or owner other than the person who entered it: "A factor is checked by someone other than the person who typed it (Corporate Standard chapter 7)". Self-approval only when nobody else could check it. |
| Deletion | Only a factor no run has applied; otherwise "Set its validity end to retire it instead of deleting it." |

## Inventories

| Rule | Value |
| --- | --- |
| Scope justification | At least 10 characters when the scope departs from the stream's default. |
| Exclusion justification | At least 10 characters, up to 500. Gas name for a Montreal Protocol exclusion: up to 60. |
| Proxy justification | Required before the classification is saved. |
| Declaration | "Why other categories are excluded" up to 1,000 characters; a per-category reason up to 500. |
| Reopen, withdraw and void reasons | Required, up to 500 characters. |
| Final-designation review note | Up to 500 characters ("0/500 characters"). |
| Correction reason | Up to 1,000 characters; name up to 120. |
| GWP set | One per inventory, AR5 or AR6; a factor published under another set needs a composition to be re-derived, or a final run is held. |
| Report header | Approved by up to 160 characters; assurance provider up to 160; assurance statement up to 255; uncertainty statement up to 1,000; denominator name up to 120 and unit up to 30. |
| Instrument | Source required, up to 120 characters; certificate and registry up to 120; vintage between 1990 and 2100; quality notes up to 500. Applied only when all eight quality criteria are Met. |

## Base year and updates

| Rule | Value |
| --- | --- |
| Base-year reason | Required, up to 500 characters. Threshold: a percentage of base-year emissions. |
| Candidate raised by hand | Reason required, up to 400 characters; an affected share or a comparison run. |
| Candidate decision note | Up to 500 characters. |
| Edition notice | The chapter 5 answer is required on acceptance; the note is required for a vintage progression at or above the threshold, up to 2,000 characters. |

## Factor pack editions (administration)

| Rule | Value |
| --- | --- |
| Row code | Required, up to 200 characters, "Two or more colon-separated segments". Name up to 120; unit up to 30 and registered. |
| Gas split | Where any component is stated, the sum under the edition's GWP basis must come to the CO2e within one percent. |
| Publication | Every rule passes; a source document on file with its SHA-256; an applies-from date; an approver who is not the curator. Source document citation up to 500 characters. |
