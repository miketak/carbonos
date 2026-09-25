---
owner: miketak
last_reviewed: 2026-09-24
---

# Read the report and fill the header

**Role needed:** any member to read; Preparer, Reviewer or Owner to
fill the header. The header is disabled once the inventory is
published.

A run's page is the report. The **Report** tab of the inventory holds
the header printed at its top.

<!-- sources: RunDetailPage.tsx sections; ReportMetadataCard.tsx; specs 07.1 to 07.6; verified 2026-09-24 -->

## Fill the report header

1. Open the inventory's **Report** tab.
2. Fill **Approved by (optional)** with who approved the report.
3. Choose **Assurance**: "Not verified", "Limited assurance" or
   "Reasonable assurance", with **Assurance provider (optional)** and
   **Assurance statement reference (optional)**.
4. Fill **Uncertainty statement (optional)**: "Printed with the
   report's data-quality table (ISO 14064-1 asks for a description of
   uncertainty)."
5. Under **Intensity denominators** fill **Denominator**, **Value** and
   **Unit**, then click **Add denominator**. The button is disabled
   until all three are filled; once added, the denominator is listed
   above the fields with **remove**. "The report divides the total by
   each."
6. Click **Save report header**.

What you see: "Report header saved." The run page's section 00 shows
the approver and assurance, and section 04 prints an **Intensity** line
per denominator, for example "0.000003 t CO₂e per litre of litres
bottled (18,500,000 litre)". CarbonOS divides by whatever value you
give; choose a denominator whose order of magnitude reads well.

## Read the report

| Section | Contents |
| --- | --- |
| 00 Report | Reporting entity and address, contact, period, "Prepared by" (whoever launched the run), "Approved by", "Published", "Report version" (counts corrections), "Final designated" with the note, "Assurance". After publication, **Since publication**. |
| 01 Company and organizational boundary | The approach, the boundary version the run cites, and every entity with its facilities, economic interest, operated flag and accounting share. |
| 02 Operational boundary | The scopes covered, the scope 3 categories declared with their line counts and totals, and the reason the others are excluded. |
| 03 Reporting period | The inventory, its period and state. |
| 04 Emissions by scope | Totals for scope 1, scope 2 location-based and market-based, scope 3 and the total; scope 3 by category; by facility, by legal entity, by country; the intensity lines; the market-based basis in words. |
| 05 Emissions by gas | Each gas in mass and CO₂e, the row "CO₂e from factors without a gas split", and the tie to section 04. |
| 06 Biogenic CO₂ and 6A Gases outside the scopes | Reported separately, outside the scopes. |
| 07 Base year | The base year, its threshold, convention, reason, run and recalculation history, or "No base year designated." |
| 08 Methodology | The sentences a verifier reads, the upstream rules, **Emission factors applied** with value, gases, GWP, pack and source, and the data-quality table with the uncertainty. |
| 09 Exclusions | Every excluded record with its reason, justification and estimate. |
| 10 Snapshot lines | One line per record and per derived line: facility, source, scope, quantity, factor, weight, CO₂e, with the pro-rating, conversion or market-based note where one applies. |

"Figures in metric tonnes to three decimals; each line below keeps its
kilograms. The total uses the location-based scope 2 figure."

## What changed elsewhere

- The header is printed on every run of the inventory, and in the PDF.
- After publication the header cannot change; a correction inventory
  carries its own.
