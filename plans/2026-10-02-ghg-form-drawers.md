# The list editors of the ghg feature become drawers

**Status:** approved 2026-10-02, not yet implemented.

## Context

The user noticed that editing an organization and its boundaries opens a centred modal. The check found: **Edit organization** is already inline on the Settings page (only **New organization** is a modal); **New/Edit inventory** (period, consolidation approach, GWP set, straddle treatment, boundary pre-population, copy a view) is a modal; the boundary tab itself is inline; the organization's structure editors (**Add/Edit legal entity**, **Add/Edit facility**, **Source streams**) are modals. The product already has the drawer pattern (`frontend/src/components/Drawer.tsx`: docked right, no scrim, the page stays readable) for the activity register, classification, adoption diff and blast radius.

After a UX review the user narrowed the scope to **the list editors**: forms that create or edit a thing the adjacent list shows. The CSV import (a two-step batch operation with wide preview tables), the one-field forms (Retire a factor, Create a correction, Raise a candidate, Record the recalculated base) and every confirmation stay modals. The user also asked for a **dirty-form guard**, since a drawer has no scrim and a click on the page can abandon typed input. The one-drawer-at-a-time rule was declined; nesting is handled by an Esc stack guard only.

## Decisions

1. **The rule, written into spec 08**: a form that creates or edits an item of the list beside it is a drawer; a one-shot form, a batch operation and a confirmation are modals.
2. **Scope: seven forms.** `OrganizationFormModal` (New organization), `InventoryFormModal` (New/Edit inventory), `EntityFormModal` (Add/Edit legal entity), `FacilityFormModal` (Add/Edit facility), `StreamsModal` (Source streams: …), the "Add an emission factor" form in `EmissionFactorsPage.tsx`, and `EvidenceModal` (the instrument evidence panel, which saves on upload so it needs no guard). Everything else keeps `Modal`.
3. **Titles stay verbatim.** The QA UI driver locates a panel with `getByRole('dialog', {name: title, exact: true})`, and `qa lint` requires every surface string to exist in the frontend; the Drawer renders `role="dialog" aria-label={title}`, so no YAML, narration or `surface.ts` change is needed. The `eyebrow` carries context the title lacks (the organization's label, the facility's name, the inventory's period), never a repeat of the title.
4. **Drawer gains the guard and a stack, no new component.**
   - `confirmClose?: boolean`: when true, Close, Esc and the footer Cancel open a small `Modal` inside the Drawer, "Discard the changes?", with **Keep editing** and **Discard**; Discard calls `onClose`. The modal is `aria-modal`, so the Drawer's own Esc handler and the page shortcuts stand down while it is up. Each converted form passes `confirmClose={dirty}`, with `dirty` computed from its initial values (a small `useDirty(initial, current)` helper in `src/lib/`, or an inline comparison where the form is short).
   - An Esc stack: the Drawer registers itself in a module-level list on mount; Esc closes only the topmost drawer. This covers the evidence drawer opened while an assignment drawer is open on the inventory page.
   - `width` is not added: none of the seven forms needs more than `max-w-xl`.
5. **Buttons go in the footer** with the existing pattern (`<form id>` in the body, `<Button type="submit" form={id}>` and Cancel in `footer`), as `ActivityDrawer` and `AdoptionDiffDrawer` do, so Save stays visible while the entity form scrolls. `StreamsModal` keeps its list and add form in the body and gets a **Done** footer; `EvidenceModal` gets a **Close** footer.
6. **File names follow the component**: `OrganizationFormDrawer`, `InventoryFormDrawer`, `EntityFormDrawer`, `FacilityFormDrawer`, `StreamsDrawer`, `EvidenceDrawer`, tests renamed with them; the add-factor form changes in place. Help pages cite these files in their source comments, so those comments are updated too.

## Changes

- `frontend/src/components/Drawer.tsx` (+ `Drawer.test.tsx`): `confirmClose` with the discard modal; the Esc stack; tests: a dirty drawer asks before closing and Keep editing keeps it; Esc with two drawers closes only the top one; a clean drawer closes at once.
- `frontend/src/lib/useDirty.ts` (+ test): `useDirty(initial, current)` by shallow comparison of the field values.
- The six component files renamed and converted; the add-factor form in `EmissionFactorsPage.tsx` converted in place. Each: `Modal` → `Drawer`, title unchanged, eyebrow added, buttons moved to `footer` with `form=`, `confirmClose={dirty}` on the five typed forms.
- Callers updated for the renames: `OrganizationsPage.tsx`, `InventoriesPage.tsx`, `InventoryDetailPage.tsx`, `EntitiesPage.tsx`, `FacilitiesPage.tsx`, `components/MarketFactorsCard.tsx`.
- Tests: name-based `getByRole('dialog', {name})` keeps passing. Expect and fix: tests that type into a form and then Cancel or press Esc now meet the discard prompt (`EntitiesPage.test.tsx`, `FacilitiesPage.test.tsx`, `InventoriesPage.test.tsx`, `InventoryDetailPage.test.tsx` Edit inventory, `OrganizationsPage.test.tsx`, `EmissionFactorsPage.test.tsx`); `EmissionFactorsPage.test.tsx:473` uses an unnamed `getByRole('dialog')` and may need the name. Rename the component test files.
- Specs reworded in the same PR, only where the form moved: `specs/08-form-validation-and-ui-polish.md` (lines 14, 55, 81, 103, plus the rule from decision 1 and the discard guard), `01.7` line 65 (New organization). The import, freeze, reopen, publish and exclude wording stays.
- Help pages reworded where the form moved ("drawer", not "dialog"): `get-started/create-the-organization-and-its-legal-entity.md` (26, 37), `get-started/record-the-facilities-and-source-streams.md` (37, 43), `organization/record-facilities-and-source-streams.md` (43, alt text), `inventories/create-an-inventory-and-draw-the-boundary.md` (4), `inventories/copy-a-view.md` (27); plus the `<!-- sources -->` file names. Import, freeze, publish and candidate pages keep "dialog".
- Help figure `step-2-source-streams.png` shows the Source streams modal. Retake it from the product per `docs/how-to/re-derive-the-get-started-series.md` if the local stack comes up (compose + backend), else leave it and say so in the PR.
- QA: no YAML or narration change (the generated pack says "dialog" only for Freeze and the bulk exclusion, both still modals). The QA UI driver's `dismissDialogs` presses Esc then Cancel/Close before every navigation: a dirty converted form would now meet the discard prompt, whose **Discard** button is not in its `/^(Cancel|Close|Done)$/` list. Check the governance scenarios for a step that leaves a typed form open (a refused save is the case: procedure 2 B2 and E1, procedure 4 B4); if one exists, add `Discard` to that regex in `qa/src/runtime/ui/execute.ts` rather than weakening the guard.
- Mining pack, hand-written: `docs/qa/mining/002-organization-setup.md` lines 74 and 75 ("The dialog stays open", "cancel the dialog") concern the entity form → "drawer".
- Browser smoke after the unit tests: `make qa-reset && make qa-run-ui QA_PROC=2` and `QA_PROC=4` on the local stack, since they drive **New organization**, **Add legal entity**, **Add facility**, **Source streams**, **New inventory** and **Edit inventory** through the dialog locator.

## Risks

1. The discard prompt interrupts a tester or driver that abandons a refused form; mitigated by the `dismissDialogs` regex and the UI smoke run.
2. Two drawers of the same width stack exactly (evidence over an assignment drawer); the Esc stack keeps them separately closable, and the lower one reappears when the upper closes.
3. The Source streams help figure goes stale if the stack cannot be brought up; flagged in the PR rather than hidden.
4. Keyboard focus is not trapped in a drawer; accepted, as for the existing drawers.

## Verification

```
cd frontend && npm run lint && npm run format:check && npm test && npm run build
cd frontend && npm run help:check
make qa-lint qa-export-check qa-compile-check
make docs-check
make qa-reset && make qa-run-ui QA_PROC=2 && make qa-run-ui QA_PROC=4
```

One PR, squash-merged on green, branch realigned after.
