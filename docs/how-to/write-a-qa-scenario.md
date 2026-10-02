---
owner: miketak
last_reviewed: 2026-10-02
---

# Write a QA scenario

A QA procedure is a YAML file under `qa/packs/<persona>/`, written as
domain steps: who acts, what they do, and what must hold afterwards. The
tester Markdown under `docs/qa/<persona>/`, the API and UI specs under
`qa/generated/` and the run records under `qa/runs/` are generated from it
(ADR 0007). Never edit the generated files; edit the YAML and regenerate.

## Before you begin

- `cd qa && npm ci` once; the `make qa-*` targets run the CLI from there.
- Read the pack: `qa/packs/<persona>/pack.yaml` names the actors (their
  display names, aliases, passwords, platform roles and windows). A step
  names an actor by its key (`ama`, `adminA`); the drivers resolve the
  address and the current password.

## Write the steps

1. Copy the shape of an existing procedure. A step is:

    ```yaml
    - as: adminA                       # persists until changed
      do: { createUser: { user: kofi } }
      expect:
        - userCount: { since: usersAtStart, added: 4 }
          why: a sentence the tester reads after the outcome
    ```

    `do` names one verb with domain arguments: actors, values, enum values
    that are the API's truth. Never an id, never a screen element. `expect`
    lists outcome kinds; a step with `expect` and no `do` is an observation.
    `capture: { usersAtStart: userCount }` keeps a measured value for later.

2. Leave out what the verb implies. Every verb declares its postconditions
   (`createUser` implies `userListed`); the drivers verify them on every
   step and the narrator writes them into the Expected result when the
   step lists nothing else. List only what is interesting beyond them.

3. Name refusals by rule, never by message:
   `refused: { rule: user.email.duplicate, with: { email: "{email:kofi}" } }`.
   The rule ids are the backend's (`qa/src/vocabulary/rules/catalogue.json`,
   pulled by `make qa-rules`); the document quotes the catalogue's message.
   A refusal the page makes on its own is in `rules/frontend.json` and is
   N/A for the API driver.

4. Typed tokens: a password left out is the pack's; `"{wrong}"` is one that
   is not the account's; `{email:kofi}` in `with` resolves to the address.

5. Fill the `docs` block: version, estimated time, objective, prerequisites,
   known non-goals, rationale per case, change notes. A rendered change
   without a version bump fails lint; the last change note's version equals
   `docs.version`.

## Add a verb or an outcome

When the pack needs an action or a statement the vocabulary lacks, add it
in `qa/src/vocabulary/verbs/` or `outcomes/` with `defineVerb` or
`defineOutcome`: the zod `args`, the `api` projection (calls or queries),
the `ui` projection (a plan of `UiOp`s, or a list of `UiCheck`s), the
`narrate` text for outcomes, the `postconditions` for verbs, and register
it in `vocabulary/index.ts`. Every screen string comes from
`vocabulary/ui/surface.ts`; lint checks each one appears verbatim in
`frontend/src`. Add a unit test beside it.

## Check and regenerate

```bash
make qa-lint        # schema, ids, rules, specs under covers, surface strings, em-dashes
make qa-export      # docs/qa/<persona>/NNN-*.md
make qa-compile     # qa/generated/<persona>/{api,ui}/NNN-*.spec.ts and the JSON schema
```

Then run both drivers ([Run a QA procedure](run-a-qa-procedure.md)) and
commit the YAML, the Markdown, both specs and both records in one PR.
