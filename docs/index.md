---
owner: miketak
last_reviewed: 2026-09-09
---

# CarbonOS engineering docs

This site explains how CarbonOS is built, run, verified, and changed. It is
written for engineers joining the project and for the people who review their
work. The product itself, a greenhouse gas (GHG) inventory tool that follows
the GHG Protocol Corporate Standard, is described in the specs.

The site is organized by [Diátaxis](https://diataxis.fr/). Each page answers
one kind of question, so you can tell from the section which page you need.

| Section | Read it when you want to | Example |
| --- | --- | --- |
| Tutorials | Learn by doing, with a guaranteed result at the end | Your first week |
| How-to guides | Get a specific job done, and you already know the basics | Add a Flyway migration |
| Reference | Look up a fact about the machinery | Every `make` target |
| Explanation | Understand why something is the way it is | Why runs are immutable |

## Start here

- New to the project? Start with the first-week tutorial once it lands; until
  then, read [spec 00, Principles and domain model](specs/00-principles-and-domain-model.md)
  and the [QA procedures](reference/qa/README.md), which walk the product the
  way a user meets it.
- Looking for what the product must do? The [specs](specs/README.md) are the
  reference. Every non-trivial feature starts as a spec and stays in step
  with the code.
- Testing a release? The [QA procedures](reference/qa/README.md) are
  objective-led scripts a tester runs on staging.
- Wondering why a tool or structure was chosen? Read the
  [decision records](adr/README.md).

## Build the site

The site builds from the Markdown in this repository. From the repository
root:

```bash
make docs-serve
```

Open http://127.0.0.1:8000. The page reloads when you save a file under
`docs/` or `specs/`. Run `make docs` to build the static site into `site/`,
and `make docs-check` before you open a pull request. See
[Contributing to docs](contributing-to-docs.md) for the house style.
