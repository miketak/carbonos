---
owner: miketak
last_reviewed: 2026-09-29
description: What CarbonOS says when a factor pack import, a factor approval or deletion, or an edition notice does not go as expected, and what to do about it.
---

# Fix a factor or update problem

The messages you meet under **Emission factors**, **Updates** and, for an
administrator, the factor pack editions. Every message is quoted as the
product prints it.

<!-- sources: troubleshooting/index.md (verified 2026-09-24); specs 02.1, 02.6, 02.7; strings checked on 2026-09-28 in EmissionFactorsPage.tsx, GhgService.java (factor deletion and approval), InventoryService.java (CO2e-only finding), FactorPackImportService.java, FactorPackAdoptionService.java, FactorPackUpdatesPage.tsx, AdoptionDiffDrawer.tsx, FactorPackBlastRadius.java, PublishEditionDialog.tsx -->

| You see | It means | Do this |
| --- | --- | --- |
| "0 added, 0 versioned, 0 tagged, 1928 unchanged." | The edition was already imported. | Nothing; importing twice is harmless. |
| "'*edition*' applies from *date*, which falls inside '*inventory*' (…), which is FROZEN. A reported period keeps the factors it reported with. Reopen that inventory, or import the edition into a later period." | **Import pack** for an edition whose applies-from date sits inside a frozen or final period. Nothing was written. | Reopen that inventory as a draft first, or import a later edition. |
| "… which is PUBLISHED. A reported period keeps the factors it reported with. The edition cannot be imported while that period is on record; choose an edition that applies from a later date." | The applies-from date sits inside a published period, which never reopens. | Import an edition that applies from a later date. |
| "'*factor*' publishes CO2e only. Its emissions are counted in the scope totals and appear in the by-gas table on the row 'CO2e from factors without a gas split', not under CO2, CH4 or N2O." | The source publishes no gas split. | Nothing; the report discloses it. A warning does not hold the run. |
| No **Delete** on a factor, only **Retire…** | The factor came from a pack; its versions are the record of what was calculated with. | Click **Retire…** and set **Valid to**. |
| "'*factor*' was applied by a calculation run. Set its validity end to retire it instead of deleting it." | **Delete** on a factor a run used. | Click **Retire…** on the factor and set **Valid to**. |
| "'*factor*' is applied by a classification in *inventory*. Choose another factor there before deleting it." | **Delete** on a factor an inventory's classification still names. | Change the classification on that inventory's **Records** tab, then delete. |
| "A reported period keeps the factors it reported with, so this edition cannot be accepted until that inventory is reopened. Declining stays available." | The edition applies from a date inside a frozen, final or published period. | Decline, or reopen the period through a correction first. |
| The **Updates** table and the drawer show different estimated movements | The table's **Estimated movement** is scaled from the last completed run; the drawer's is "an estimate over" the inventory the edition would apply to, "using the activity data already recorded". | Weigh the decision on the drawer's figure. |
| "Withdrawn by the publisher" | The platform withdrew the edition. | Nothing to decide. |
| The **Publish** button is disabled with "You built this draft, so another administrator checks it against the source document and publishes it." | You are the curator of the draft. | Another administrator publishes it. |
