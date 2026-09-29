---
owner: miketak
last_reviewed: 2026-09-28
description: Start a new inventory from an existing one's decisions, to view the same period under another approach or to carry this year's boundary, declaration, rules and instruments into next year.
role: Preparer
minutes: 5
---

# Copy a view to another approach or the next year

The same period can be accounted for under different consolidation approaches, and next year's inventory starts best from this year's decisions. **Copy the view from** on the **New inventory** dialog carries them across.

<!-- sources: specs 03, 04.4 and 05.4 (Appendix F under each approach); the old page tasks/inventories/copy-a-view-to-another-approach.md (verified 2026-09-24 with an equity-share copy); InventoryFormModal.tsx; InventoryDetailPage.tsx ("Where this inventory came from", dropped exclusions); InventoryService.java instrument findings; screen text from the Gye Nyame Gold walkthrough of 2026-09-28 (replay-log.txt): "5 inventory dialog", "6 classified Genset diesel" -->

## Before you start

- The source inventory exists, and you are Preparer, Reviewer or Owner.
- For a copy into next year, next year's records are entered or imported.

## Copy the view

1. Open **Inventories** and click **New inventory**.
2. Fill **Name**, **Period start** and **Period end**, and choose the **Consolidation approach** this view uses.
3. Under **Copy the view from (optional)**, choose the source inventory.
4. Click **Create inventory**, then **Open**.

What you see: the dialog says what comes across: "The boundary, instruments, declaration and every classification and exclusion of that inventory, so a second inventory or next year's starts from its decisions." In the new inventory, **Where this inventory came from** reads "View copied from *source*" with the number of "decisions inherited" and, when the period differs, how many "records of this period the source never decided on". Under another approach it adds "Boundary rebuilt from Table 1 under *approach*".

Click **Review activity data** to bring in records added since the source's freeze, then classify, freeze and run as usual.

## What changes under another approach

- **Shares.** A partly owned entity counts at its economic interest under equity share and at 100% or 0% under a control approach; an entity at 0% is placed outside, and the report discloses the exclusion.
- **Dropped exclusions.** An operation the source excluded may hold a share under the new approach. The card then warns that the exclusion "was dropped: the operation holds a share under this approach and joins the boundary. Record a reason again if it should stay out."
- **Leases.** Gye Nyame Gold's camp, leased in under an operating lease, reports its fuel in scope 1 under operational control; under equity share or financial control, Appendix F puts the same line in scope 3, "8. Upstream leased assets".
- **The report** names the approach, and section 01 prints the shares the run used.

!!! note "Copying into next year"
    A classification is inherited only for a record the source view had decided; the new period's records arrive unclassified through **Review activity data**. The **Emission factors** gate warns where a copied instrument "reaches outside the reporting period; only the part inside it applies".

## What happens next

The copy is an inventory of its own, with its own lifecycle and report. To draw its boundary afresh, see [Create an inventory and draw the boundary](create-an-inventory-and-draw-the-boundary.md).
