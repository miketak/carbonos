---
status: proposed
date: 2026-10-02
decision-makers: miketak
owner: miketak
last_reviewed: 2026-10-02
---

# 0007: Write QA procedures as pure domain scenarios and generate their projections

## Context and problem statement

The QA packs under `docs/qa/` were hand-written Markdown. Each governance
procedure had been walked by hand-rolled Playwright scripts several times;
those scripts lived in session scratchpads and are gone. Every walkthrough
re-derived locators and expectations from the prose, every product change
had to be propagated into the prose by hand, and nothing checked that a
quoted product string still existed or that the procedure and the thing
that drove it agreed. The plan `plans/2026-10-02-qa-scenario-dsl.md` asked
for one representation from which the tester document, an API driver, a UI
driver and a run record are all generated.

## Considered options

- Hand-written Markdown plus separate Playwright specs: two sources that
  drift, and no check between them.
- Gherkin with step definitions: a third language, free text in the steps,
  and the step definitions become the real spec.
- Scenario data with UI vocabulary (buttons, dialogs, toasts): drives the
  browser well but cannot drive the API, and a renamed button changes every
  procedure.
- Pure domain scenarios (an actor, a domain action, domain outcomes) in YAML,
  validated by a closed TypeScript vocabulary whose every verb and outcome
  carries an API projection, a UI projection and its narration.

## Decision outcome

Chosen option: pure domain scenarios with a closed vocabulary, because the
scenario then says what the product must do, and the three ways of
performing or observing it live beside each other in one registry entry.
A step is `{ as, do, expect, capture, why }`; a verb declares the outcomes
that hold after it (its postconditions) and both drivers verify them on
every step without the scenario saying so. Refusals are named by a rule id
the backend reports (ADR 0008), never by a message, so the exported
document quotes the product's wording from the catalogue.

### Consequences

- Good: one YAML file per procedure; the Markdown, both Playwright specs and
  the run records are projections of it, committed and checked current by
  `make qa-export-check` and `make qa-compile-check`. A renamed screen
  string fails `make qa-lint` (`surface.ts` is the only place one may be
  written). A reworded refusal changes the catalogue and the pack in the
  same PR.
- Good: N/A (an outcome a driver cannot observe) and MANUAL (`observe`) are
  visible annotations, never passes; the run record refuses a FAIL or a
  SKIP; the UI driver's cross-check tells "UI stale" from "backend".
- Bad: presentational sentences of the old packs (dialog titles, the options
  of a select, hints) are no longer in the procedure text; they live in the
  verbs' UI projections or were dropped with a change note. Adding a verb
  or an outcome means a registry entry, both projections, narration,
  postconditions and a test, in one PR.
- Bad: generated files are committed, so a YAML change touches several
  files; the `--check` targets keep them honest.
