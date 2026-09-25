---
owner: miketak
last_reviewed: 2026-09-24
---

# Create an inventory, set the boundary and declare scope 3

**Role needed:** Preparer, Reviewer or Owner.

An inventory is one accounting view over the organization's facts: a
period, a consolidation approach, a boundary, and the decisions this
view makes about each record. Several inventories can cover the same
period under different approaches.

<!-- sources: InventoryFormModal.tsx; BoundarySection.tsx; OperationalBoundaryCard.tsx; InventoryService.java boundary findings (isDisclosure); specs 03, 03.3, 04.2, 04.4, 05; verified 2026-09-24 -->

## Create the inventory

1. Open **Inventories** and click **New inventory**.
2. Fill **Name**, **Period start** and **Period end**.
3. Choose how **Records that straddle the period or a membership
   window** are treated: "Pro-rate by days (default)" counts the days
   inside, with the split printed on the line; "Block the run until the
   record is split" makes such a record an error until it is split or
   excluded.
4. Fill **Purpose (optional)**.
5. Choose **Consolidation approach**: "Equity share", "Financial
   control" or "Operational control". It cannot change afterwards.
6. Choose **GWP set**: "AR5 (default)" or "AR6". A run converts every
   gas with it.
7. Choose **Copy the view from (optional)**: "Start from scratch", or an
   existing inventory, whose "boundary, instruments, declaration and
   every classification and exclusion" become this one's starting
   decisions.
8. Leave **Start with every operation the approach includes in the
   boundary** ticked unless you want to draw the boundary from empty:
   "under a control approach every controlled operation is in by
   definition. Leaving one out is then an exclusion with a reason."
9. Click **Create inventory**, then **Open** on the card.

What you see: "*Name* created." The workbench opens on the **Records**
tab with the header "*Name*, *approach*, DRAFT, GWP *set*", the
**Inventory lifecycle** card, **Pre-flight checks** reading "LAUNCH ON
HOLD" until the inventory is frozen, and the tabs **Records**,
**Boundary**, **Method**, **Runs** and **Report**.

## Set the boundary

Open the **Boundary** tab. Under **Organizational boundary** every
entity is listed with the Table 1 reading of its facts ("group company
or subsidiary under financial control; operational control: 100%
(operator)"), its share, and its facilities. Changes save as you make
them.

- **Leave a facility out**: untick "*Facility* in boundary". Unticking
  an entity's only facility unticks the entity.
- **Leave an entity out**: untick "*Entity* in boundary". A row then
  asks **Why is it left out?**: Non-GHG activity, Duplicate, Not
  applicable, Methodology exclusion, Other documented reason, Record
  removed, or Outside the scopes: Montreal Protocol gas, with a detail
  field. An entity with a share under the approach is excluded cleanly
  only as "Non-GHG activity" or "Not applicable": the Reporting boundary
  gate then warns "*Entity* is excluded as not applicable in the period
  but holds a 100% share under this approach: the report discloses the
  exclusion." Any other reason is an error: "*Entity* is excluded but
  holds a 100% share under this approach. Include it, or record why it
  emits nothing."
- **Override the share for this view**: change **Economic interest %**
  or **Relationship** on the row. The gate warns that the treatment in
  the view differs from the entity record; the entity itself is
  unchanged.
- **Set a membership window**: fill **Member from** and **Member
  until** for an entity acquired or disposed of during the period. They
  are prefilled from the entity's acquisition and disposal dates.

A facility that is neither in the boundary nor excluded with a reason
holds the run: "'*Facility*' (*Entity*) is neither in the boundary nor
excluded with a reason. Tick it in, or record why it is left out."

An entity with a 0% share under the approach is already outside, its
checkbox disabled, and only the reason is asked.

## Declare scope 3

Further down the **Boundary** tab, **Operational boundary declaration**
reads: "Scope 1 and scope 2 are always covered. Declare which scope 3
categories this inventory covers and why the others are excluded; the
report prints this declaration beside each category's total."

1. Tick each category under **Scope 3 categories covered** that this
   inventory quantifies.
2. Fill **Why other categories are excluded**.
3. Click **Save declaration**.

What you see: "Operational boundary declaration saved." The Classification
gate warns when a declared category has no lines: "Scope 3 *category* is
declared as covered but no included record is classified into it: a
reader takes 'covered' to mean quantified. Classify records into it, or
say in the declaration why it is not quantified this year." Declaring
category 3 without an upstream rule warns too: "add a rule or say why
category 3 is not quantified."

## What changed elsewhere

- The boundary and the declaration are fixed by the freeze as a
  boundary version; a later reopen and freeze cuts the next version.
- The report's sections 01 and 02 print the boundary, the exclusions
  with their reasons, and the declaration.
