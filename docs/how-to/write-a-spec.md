---
owner: miketak
last_reviewed: 2026-09-09
---

# Write a spec

A spec describes what the product must do, before the code exists, in
enough detail that the implementation and the tests can be checked against
it. Every non-trivial feature starts as one. This guide takes a spec from a
blank template to approved.

## Before you begin

- Read [The spec workflow](../explanation/spec-workflow.md) to see where
  a spec sits between the audit backlog, the code and the QA procedures.
- Skim two existing specs of the same size as yours, for example
  [05.2, Run numbering and voiding](../specs/05.2-run-numbering-and-voiding.md)
  and [04.4, Activity data quality, evidence and corrections](../specs/04.4-activity-data-quality-evidence-and-corrections.md).

## Create the file

1. Choose the chapter. Specs are numbered by the chapter of the GHG
   Protocol Corporate Standard they implement: 01 identity, 02
   organization and facts, 03 organizational boundary, 04 operational
   boundary and classification, 05 inventories and calculation, 06 base
   year, 07 reporting, 08 product polish.
2. Copy the template to the next free number in that chapter:

    ```bash
    cp specs/TEMPLATE.md specs/05.4-short-title.md
    ```

3. Fill in the metadata list: **Status** starts as `Draft`; **Protocol**
   names the chapters; **Owner** is who decides; **Created** is today's ISO
   date; **Modules** names the backend module and the frontend feature.

## Write the sections

The template's headings are fixed. Keep every one, even when the answer is
"none".

| Section | What goes there |
| --- | --- |
| Problem | What the Standard requires, what the product does today, and the gap. Quote the Standard's requirement words as they are: *shall*, *should*, *may*. |
| Behavior | The feature from the outside: states, rules, flows. Use Given / When / Then for the cases that matter. Write *must* for a rule the product enforces. |
| API | Endpoints, request and response shapes, and each error as an RFC 9457 problem detail with its status. |
| Data | Tables and columns. Every change is a Flyway migration; name the next number. |
| Events | Domain events published or consumed across module boundaries. |
| Verification | The automated tests that prove it, by class and method name, and the QA procedure that covers it. |
| Non-goals and open questions | What the spec leaves out on purpose, each with a pointer to the spec that covers it. |

Follow the [writing conventions](../specs/README.md#writing-conventions)
in the specs index: present tense, active voice, conditions first, short
sentences, no em-dashes.

## Register the spec

1. In `specs/README.md`, add a row to the index table in reading order.
2. In `mkdocs.yml`, add the file under the chapter's group in `nav`.

    The docs site builds strictly; a spec that is not in the nav fails
    `make docs`.

3. Run `make docs-check`.

## Get it approved

1. Open a pull request with the spec alone. Its title starts with `docs:`.
2. The owner reviews it against the Standard and the existing specs. Answer
   the open questions in the spec itself, not in the pull request thread,
   so the answers survive.
3. When the owner agrees, set **Status** to `Approved` and merge.

Only an approved spec is implemented. When the implementation diverges from
the spec, update the spec in the same pull request, and set **Status** to
`Implemented` when the pull request merges.
