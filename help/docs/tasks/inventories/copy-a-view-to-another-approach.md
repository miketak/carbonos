---
owner: miketak
last_reviewed: 2026-09-24
---

# Copy a view to another approach or the next year

**Role needed:** Preparer, Reviewer or Owner.

The same period can be accounted for under different consolidation
approaches, and next year's inventory starts best from this year's
decisions. **Copy the view from** on the **New inventory** form carries
"the boundary, instruments, declaration and every classification and
exclusion of that inventory, so a second inventory or next year's
starts from its decisions."

<!-- sources: InventoryFormModal.tsx; InventoryDetailPage.tsx "Where this inventory came from"; verified 2026-09-24 with FY2025 (equity share), a copy of FY2025 -->

## Steps

1. Open **Inventories** and click **New inventory**.
2. Fill **Name** and the period. Choose the **Consolidation approach**
   this view uses.
3. Choose **Copy the view from (optional)**: the inventory whose
   decisions to inherit, listed with its year.
4. Click **Create inventory**, then **Open**.

## What you see

The **Where this inventory came from** card reads "View copied from
FY2025: 5 decisions inherited. Boundary rebuilt from Table 1 under
equity share." The **Records** tab lists every record as **Included**
with the tag "inherited"; the **Boundary** tab shows each entity's
share recomputed under the new approach ("equity share: 100% economic
interest"); the declaration, the residual-mix answer and the upstream
rules are those of the source.

Click **Review activity data** to bring in records added or corrected
since the source's freeze ("1 new record under review."), then freeze
and run as usual.

## What changes under another approach

The facts and the classifications are the same; the approach changes
what Table 1 and Appendix F of the Standard make of them:

- **Shares.** A partly owned entity counts at its economic interest
  under equity share and at 100% or 0% under a control approach; an
  entity at 0% is placed outside with its exclusion disclosed.
- **Leases.** Riverside's Harbour Depot is an operating lease leased
  in. Under operational control its contractor fleet reports in scope
  3, category 1; under equity share the same line reports in "8.
  Upstream leased assets", because Appendix F puts an operating lease
  in category 8 under equity share and financial control. The scope 3
  total is unchanged.
- **The report's first page** names the approach, and section 01
  prints the shares the run used.

For Riverside, whose two entities are wholly owned and operated, the
equity-share copy of FY2025 totals the same 56.647 t CO₂e as the
operational-control correction over the same facts.

## Copying into next year

Copy last year's view into a new period to keep its boundary,
declaration, residual-mix answer, upstream rules and instruments. The
new period's records are brought in by **Review activity data** and
classified as usual; a classification is inherited only for a record
the source view had decided. Check copied instruments against the new
period: an instrument's dates and coverage are printed and the
Emission factors gate warns where they reach outside the period or
cover more electricity than the facility used.
