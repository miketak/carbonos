---
owner: miketak
last_reviewed: 2026-09-09
---

# Decision records

An architecture decision record (ADR) captures one decision that shapes how
the system is built: the options that were considered, the one that was
taken, and what follows from it. Records are short, dated, and never
rewritten. When a decision changes, a new record supersedes the old one.

## When to write one

Write a record when you:

- Choose or replace a tool, framework, or service.
- Change a structure that every module or feature follows.
- Set a rule that a test or a build enforces, such as the module boundaries
  `ModularityTests` checks.

Product behavior belongs in a spec, not in a record. A record explains why
the machinery is the way it is.

## How to write one

1. Copy `docs/adr/TEMPLATE.md` to `docs/adr/NNNN-short-title.md`, where
   `NNNN` is the next number in the table.
2. Fill in the front matter and the three sections. Keep the record under a
   page.
3. Add the record to `nav` in `mkdocs.yml` and to the table on this page.
4. Open a pull request. The record's status is `proposed` until the pull
   request merges, then `accepted`.

Status values: `proposed`, `accepted`, `deprecated`, and
`superseded by ADR-NNNN`. Do not edit the decision in an accepted record;
supersede it.

The template follows [MADR 4.0](https://adr.github.io/madr/), minimal
form.

## Records

| Number | Title | Status | Date |
| --- | --- | --- | --- |
| [0001](0001-use-material-for-mkdocs-with-uv.md) | Use Material for MkDocs, managed by uv, for the engineering docs | accepted | 2026-09-09 |
| [0002](0002-publish-qa-procedures-to-google-docs-with-pandoc.md) | Publish the QA procedures to Google Docs with pandoc and the Drive API | proposed | 2026-09-10 |
| [0003](0003-promote-releases-through-qa-staging-and-production.md) | Promote one tagged commit through qa, staging and production | accepted | 2026-09-11 |
