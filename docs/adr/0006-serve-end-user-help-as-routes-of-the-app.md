---
status: accepted
date: 2026-09-28
decision-makers: miketak
owner: miketak
last_reviewed: 2026-09-28
---

# 0006: Serve end-user help as routes of the React app, compiled from help/docs at build time

## Context and problem statement

ADR 0005 put the end-user help in a second MkDocs site under `help/`,
served as static files at `/help/` beside the app. It did what it set out to
do, but the owner's review on 2026-09-28 found the result too far from the
product: a different look, page-type navigation (concepts, tasks, reference)
rather than the reader's jobs, thousand-word concept essays, and no way to
tell whether a reader found what they came for. The model to follow is
Confluence Cloud's support site, and the outcome to measure is a reader
reaching the answering section within two minutes. Where should the help
live so that it can share the product's components and tokens, carry a
feedback loop, and still be written and reviewed as prose?

## Considered options

- Restyle the MkDocs site with custom CSS and template overrides: cheapest,
  but a second implementation of the product's look that drifts from it,
  and a feedback widget that has to reach the backend from a static page.
- Routes inside the React app, with the Markdown under `help/docs` compiled
  at build time into HTML, a manifest and a search index: the exact
  components and tokens, one bundle, one origin, the feedback widget is an
  ordinary API call, and the authoring workflow is unchanged.
- A different static site generator: full control, but a third toolchain
  and the same drift as the first option.

## Decision outcome

Chosen option: "Routes inside the React app", because it is the only option
where the help is the product rather than a site next to it, while the
prose stays in `help/docs` with the same front matter, sources comment,
Vale rules and same-PR rule that ADR 0005 established.

What this supersedes in ADR 0005: the separate MkDocs project and its
static hosting at `/help/`. What it keeps: the authoring location, the house
style, the sources comment under each page's front matter, and the rule that
a product change updates the help in the same pull request. The engineering
docs site (ADR 0001) is not affected.

### Consequences

- Good: the help looks like the product because it is built from the
  product's components; "Was this helpful?" and zero-result searches reach
  the backend like any other call and appear on the administration console;
  the app can deep-link into an article from the screen where a reader is
  stuck; every page is one lazy chunk, so the help costs the main bundle
  nothing.
- Good: `npm run help:check` replaces `mkdocs build --strict` and checks
  more (word budgets, anchors in the question bank, stale diagrams).
- Bad: a compiler to maintain (`frontend/scripts/compile-help.mjs`) and a
  Markdown dialect narrower than MkDocs Material's; Mermaid diagrams are
  rendered to SVG on the author's machine and committed, never in the
  browser; the Railway frontend service builds from `frontend/` alone, so CI
  compiles the help before `railway up`, as it copied the MkDocs output
  before.
- The takeover shipped on 2026-09-28: the MkDocs project, the `/help/` file
  serving and the release steps went, and every URL the old site served is
  in the `legacy` map of `help/tree.yaml`, which the help redirects to the
  article that replaced the page.
- Watch for: the help route must stay public and must never call an
  organization endpoint for a visitor; the feedback endpoints are new
  unauthenticated write surface and carry their own rate limit and PII
  refusal (spec 09).
