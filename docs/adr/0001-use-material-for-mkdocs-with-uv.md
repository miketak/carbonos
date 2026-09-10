---
status: accepted
date: 2026-09-09
decision-makers: miketak
owner: miketak
last_reviewed: 2026-09-09
---

# 0001: Use Material for MkDocs, managed by uv, for the engineering docs

## Context and problem statement

CarbonOS had 34 specs and 9 QA procedures on GitHub, an agent contract in
`CLAUDE.md`, and a README, but no onboarding path for engineers, no
diagrams beyond ASCII art, and nothing served in a browser. The owner asked
for documentation organized by Diátaxis, written in the Google developer
documentation style the specs already use, with Mermaid diagrams, and a
`make` target that builds the site from source and serves it locally.
Which generator, and which toolchain, should carry that?

## Considered options

- **Material for MkDocs in a uv-managed Python environment.** Mermaid is a
  three-line configuration that renders in the browser and follows the
  light and dark palettes. `mkdocs build --strict` turns a broken link or a
  page missing from the nav into a build failure. Live reload is one
  command. The repository gains a Python toolchain, isolated behind `make`.
  Material is in maintenance mode; its authors are moving feature work to
  Zensical, which reads the same configuration.
- **Zensical now.** Same team and configuration shape, but its plugin
  ecosystem was still filling in at the time of writing.
- **Docusaurus 3.** Node-based, matching the frontend toolchain, with Mermaid
  through a theme plugin. It brings a React application and its own
  `node_modules` into the repository, and reaching `specs/` and `docs/qa/`
  outside the docs root needs extra plugin instances.
- **Antora.** Spring Modulith emits AsciiDoc, which Antora renders natively,
  but every existing document is Markdown and Antora's structure is heavier
  than the project needs.
- **Plain Markdown on GitHub.** No build, no search, no Mermaid in the
  places the project needs it, and no navigation across the four
  quadrants.

## Decision outcome

Chosen option: "Material for MkDocs in a uv-managed Python environment",
because it gives Mermaid, strict link checking, search, dark mode, and
live reload with the least configuration, and because that configuration
stays portable to Zensical when its plugins catch up. `specs/` and
`docs/qa/` stay where the development workflow expects them; the site
reaches them through symbolic links rather than a plugin, so the generator
can change without moving a file. Vale with the Google package runs on
changed files as an advisory check, with the no-em-dash rule as the one
error. The site is built and served locally; publishing can be added later
as one workflow job.

### Consequences

- Good: `make docs-serve` is the whole onboarding for writing docs. A page
  missing from the nav or a broken link fails the build before review.
  Diagrams are text, reviewed in pull requests, and render in both color
  schemes.
- Good: nothing couples the docs to the frontend's Node dependencies or to
  Maven. The Python environment lives in `.venv/` and is ignored by git.
- Bad: the repository now has a third toolchain. `uv` must be installed to
  build the docs, and `uv.lock` must be kept in step with `pyproject.toml`.
- Bad: Material for MkDocs is in maintenance mode and MkDocs 2.0 is
  incompatible with it. The dependency pins `mkdocs<2`; the planned move is
  to Zensical, which is a dependency change and a configuration
  translation, not a rewrite.
- Bad: the symbolic links need `core.symlinks` enabled on Windows
  checkouts. CI runs on Ubuntu.
- Bad: Spring Modulith's generated module documentation is PlantUML and
  AsciiDoc, which the site does not render. The module diagram is drawn by
  hand in Mermaid, and the generated output under
  `backend/target/spring-modulith-docs/` is the drift check.
