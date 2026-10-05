---
status: accepted
date: 2026-10-05
decision-makers: miketak
owner: miketak
last_reviewed: 2026-10-05
---

# 0010: The verdict workbook is the only export of the QA procedures

## Context and problem statement

ADR 0002 exported each QA procedure as a Google Doc, with pandoc, beside a
verdict workbook the testers filled in. In practice the testers worked in
the sheet and used the documents only to look up what the sheet did not
carry: the accounts, their addresses and passwords, and the fixture files.
Once the workbook carried those itself (an Accounts sheet that derives every
alias address from the mailbox the tester types once, and the account lines
at the head of each procedure), the documents had no reader left, while the
pipeline that made them kept a binary (pandoc), two Lua filters and a
post-processing step alive.

## Considered options

- Keep both exports; two artefacts to upload and keep in step, one of them
  unread.
- The workbook alone, built from the same Markdown; one artefact, no pandoc,
  the Markdown and the docs site still the readable form.
- The documents alone, with the verdicts typed into them; rejected when the
  workbook was introduced, because a table cell is a poor place to tally.

## Decision outcome

Chosen option: "the workbook alone". `make qa-workbook` builds it and copies
the fixture files beside it; `make qa-sheets-check` guards that the Markdown
keeps the shape the builder reads. The Markdown under `docs/qa` remains the
source and the engineering docs site renders it for anyone who wants to read
a procedure rather than run it. This supersedes ADR 0002.

### Consequences

- Good: one artefact per round; no pandoc or Lua on a maintainer's machine;
  the workbook stands on its own, so a tester never leaves it.
- Bad: a reader who prefers prose reads the docs site, not a document in
  Drive; the Drive upload is still by hand (a round is rare enough).
