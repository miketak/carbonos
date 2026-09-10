---
status: proposed
date: 2026-09-10
decision-makers: miketak
owner: miketak
last_reviewed: 2026-09-10
---

# 0002: Export the QA procedures to Google Docs with pandoc, by hand

## Context and problem statement

The QA team runs the procedures in `docs/qa` by hand and records verdicts in
Google Docs, one copy per tester and run. Getting the Markdown there was a
manual export, upload, conversion and formatting pass on every change, and
the documents lost their links to the specs. The question was how to produce
editable Google Docs from the repository with little effort, without changing
how the testers work.

## Considered options

- Keep the manual export; no tooling, but formatting by hand every time and
  documents that drift from the repository.
- pandoc to DOCX from a Makefile target, uploaded to Drive by hand before a
  round of testing; one binary, no credentials, links and outline fixed by a
  filter and a post-processing step.
- The same conversion in a GitHub Actions workflow that uploads through the
  Drive API on every merge and tag; hands-free, but a service account and a
  Google Cloud project to keep alive, and a publication on every push when a
  round happens far less often.
- Build the documents through the Google Docs API; full control over
  formatting, far more code.
- Publish the MkDocs site or a PDF; rejected because testers need an editable
  copy to fill in.

## Decision outcome

Chosen option: "pandoc to DOCX from a Makefile target, uploaded by hand",
because a round of testing is rare enough that the upload is a minute's work,
and it needs no credentials in CI. The workflow variant is a later step if
rounds become frequent.

### Consequences

- Good: the formatting pass disappears; the title, version subtitle, spec
  links and table outlines come out right every time; the export is tied to
  a git ref, so a round tests a named version.
- Bad: one more binary to install locally (pandoc); the upload and the
  folder naming are still a manual step; the documents are not refreshed
  until someone exports again.
