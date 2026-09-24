---
status: proposed
date: 2026-09-24
decision-makers: miketak
owner: miketak
last_reviewed: 2026-09-24
---

# 0005: Publish end-user help as a second MkDocs site under help/, sharing the uv toolchain

## Context and problem statement

The engineering docs site (ADR 0001) is written for engineers: it links the
specs, the QA procedures and the CI reference, and its tone assumes the
reader can run the system. The people who use CarbonOS, an organization's
owners, preparers, reviewers and verifiers and the platform administrators,
need help that explains the product's concepts, rules and the consequences
of their actions, in the same house style and with the same diagrams and
strict build. Where should that help live, and what should it share with
the engineering site?

## Considered options

- A section of the engineering site: one build and one nav, but the search,
  the tabs and the tone mix two audiences, and an end user lands on specs
  and CI pages.
- A second MkDocs project in `help/` sharing `pyproject.toml`, `uv.lock`,
  `.vale.ini`, the theme configuration and the docs workflow: one
  toolchain, one style, one CI job, and a product change touches the help
  in the same pull request.
- A separate repository: clean separation, but the help drifts from the
  product it describes and loses the same-PR rule.
- In-app help pages: closest to the product, but a frontend feature with
  its own spec, and not reviewable or searchable as prose.

## Decision outcome

Chosen option: "A second MkDocs project in `help/`", because it gives end
users a site that holds only their pages while keeping one toolchain, one
house style, one strict build and one pull request per product change.

The two sites never link into each other's source trees. A help page cites
the specs and the verified QA cases that ground it in an HTML comment
under its front matter, so a reviewer can trace every claim without the
reader being handed a spec.

### Consequences

- Good: `make help-serve` is the whole onboarding for a help author; the
  strict build, Vale and the Mermaid rules apply unchanged; a change to a
  product string is a change to the help page in the same pull request.
- Bad: two `nav` files to maintain; product strings are repeated in prose
  and must be re-verified against `frontend/src` and `backend/src/main/java`
  when the product changes; the Makefile target is `help-site`, not
  `help`, because `make help` lists the targets.
- Open: neither site has a published address yet (`site_url` is the local
  port on both). Hosting is decided when the first site is published.
