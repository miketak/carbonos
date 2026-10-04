# The inventory and facility forms become pages

**Status:** approved 2026-10-03, implemented in the same PR. Supersedes [the list editors of the ghg feature become drawers](2026-10-02-ghg-form-drawers.md), which was approved and never implemented.

## Context

The drawers plan turned seven modals into right-docked drawers. After a second look the owner narrowed it to the inventory and facility forms and changed the surface: these forms create or edit a heavyweight part of the inventory, so each gets the whole canvas as a page under the list it belongs to, with a breadcrumb (`Inventories › New inventory`), not a drawer and not a modal. The point is one consistent rule across the app, so the rule is written into spec 08 and the forms this change does not touch are listed there as the follow-up.

Before: `InventoryFormModal` ("New inventory" / "Edit inventory") and `FacilityFormModal` ("Add facility" / "Edit facility") were centred modals opened by a `useState` flag from `InventoriesPage`, `InventoryDetailPage` and `FacilitiesPage`. No `/new` or `/edit` route existed. `Breadcrumb` already existed and the workbench used it. The router is `BrowserRouter` with `<Routes>`, not a data router, so `useBlocker` is unavailable.

## Decisions

1. **The rule, in spec 08 ("Form surfaces").** A form that creates or edits a record with an identity of its own is a page at `<list>/new` or `<list>/:id/edit` with a breadcrumb back to the list. A row editor of a list-shaped register is a drawer keyed off the URL (spec 04.6). A one-shot form, a batch operation and a confirmation are modals. Follow-up under the same rule: New organization, Add/Edit legal entity, Source streams, Add an emission factor, Evidence.
2. **Four routes** under `/app/ghg/:organizationId`: `inventories/new`, `inventories/:inventoryId/edit`, `facilities/new`, `facilities/:facilityId/edit`.
3. **Product strings stay verbatim** (titles, buttons), so the QA vocabulary, the help and the specs keep naming the same things. Renaming "Add facility" to "New facility" is a separate decision.
4. **Breadcrumbs.** `Inventories › New inventory`; `Inventories › <name> › Edit inventory` (the name links to the workbench); `Facilities › Add facility`; `Facilities › Edit facility` with the facility's name as the subtitle.
5. **Where a save lands.** Create or edit an inventory: its workbench. Add or edit a facility: the Facilities list. Cancel: the same place, by an explicit path, never `navigate(-1)`.
6. **Opening the pages.** The `RoleButton`s stay and navigate; a verifier meets the disabled control, not a page that refuses.
7. **Edit page data.** The inventory through `useInventoryQuery`; the facility found in `useFacilitiesQuery` (no single-facility endpoint). A record that is gone gets the "not found" card with the way back.
8. **No dirty-form guard**, as on the other full-page forms; a guard needs a data-router migration.
9. **Layout.** Breadcrumb, `h1`, one muted sentence, the form in a `GlassCard` of `max-w-2xl`, Cancel and the primary button in a footer row.

## Changes

- Frontend: `InventoryFormPage.tsx` and `FacilityFormPage.tsx` replace the two modal components; `App.tsx` gains the routes; the three callers navigate. The form carries the page title as `aria-label`, so tests and the QA driver address it as they addressed the dialog. Tests: `InventoryFormPage.test.tsx`, `FacilityFormPage.test.tsx`; the list and detail tests check the navigation.
- QA: `dialog()` in `qa/src/runtime/ui/execute.ts` falls back to a named `form`; the `createInventory` verb's postcondition becomes `inventoryStatus` and its narration says the inventory opens; procedure 4 A1 makes the same swap. `docs/qa` and `qa/generated` regenerated.
- Spec 08: the "Form surfaces" section. Help: the four pages that said "dialog" or "then **Open**", and the source comments. `docs/reference/frontend-structure.md`: a "Form surfaces" paragraph.

## Verification

```
cd frontend && npm run lint && npm run format:check && npm test && npm run build
cd frontend && npm run help:check
make qa-lint qa-export-check qa-compile-check
make docs-check
make qa-reset && make qa-run-ui QA_PROC=2 && make qa-run-ui QA_PROC=4
```
