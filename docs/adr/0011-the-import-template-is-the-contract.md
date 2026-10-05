---
status: accepted
date: 2026-10-05
decision-makers: miketak
owner: miketak
last_reviewed: 2026-10-05
---

# 0011: The import template is the contract; CarbonOS does not map a company's own spreadsheet

## Context and problem statement

Activity data arrives as a spreadsheet, and every company keeps its own:
different headings, a title block above the header, a tab per month, or a
column per month. CarbonOS's import (specs 04.5, 04.6, 04.11, 04.12) reads
one shape: the first sheet, row 1 as the header, and the template's column
names, of which `facility`, `activity_type`, `quantity`, `unit` and
`period_start` are required. The question raised on 2026-10-05, after the
second round of import work shipped, was whether version 1 should map a
company's layout onto the template or ask the company to use the template.

## Considered options

- The template is the contract: a company fills CarbonOS's template, or
  exports its own sheet into it; the preview names every rejected row.
  Cheapest, and the kept file is exactly what the parser read.
- A mapping step in the preview: a card per CarbonOS column with a select
  over the file's headers, saved per organization and recorded on the import
  batch beside the source decisions; a header-row and sheet choice. A second
  set of decisions to keep, test and explain.
- A mapping step plus wide-to-long unpivoting of month columns. The layout a
  meter-read sheet most often has, and a different parser path.

## Decision outcome

Chosen option: "The template is the contract", because the first release
has one import shape to keep correct, and the template is already served
three ways: the header with an example row, a monthly template per facility
with the sources and period pre-filled, and the help page that lists every
column, limit and rejection message.

### Consequences

- Good: one parser, one set of rejection messages, one help page; the kept
  file with its digest is the evidence without a mapping between it and the
  records; the QA procedures drive one import shape.
- Bad: a company with its own layout exports into the template before every
  import, by hand; a mapping, if it is ever wanted, is a new spec in the
  04.11 line (the preview card, the saved mapping on the batch, the header
  row and sheet choice first; wide-to-long as its own ticket).
