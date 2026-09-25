---
owner: miketak
last_reviewed: 2026-09-24
---

# Record legal entities

**Role needed:** Preparer, Reviewer or Owner.

A legal entity is a structure the company consolidates: a subsidiary, a
joint venture, an associate. Each facility belongs to one, and the
entity's relationship to the reporting company is what Table 1 of the
GHG Protocol Corporate Standard turns into an accounting share under
each consolidation approach.

<!-- sources: EntitiesPage.tsx; EntityFormModal.tsx; specs 03.1 to 03.4; verified 2026-09-24 -->

## What is already there

The reporting company itself is listed as "Reporting company", at 100%
under every approach. It cannot be removed or given a relationship.

## Steps

1. Open **Legal entities** and click **Add entity**.
2. Fill **Name**.
3. Choose **Relationship**, one of the five rows of Table 1: "Group
   company or subsidiary (financial control)", "Joint venture,
   partnership or operation (joint financial control)", "Associate or
   affiliate (significant influence, no control)", "Fixed-asset
   investment (no significant influence)" or "Franchise (consolidated
   only with equity rights or control)".
4. Fill **Economic interest (%)**: "The share of risks and rewards; what
   equity share accounts for." Fill **Legal ownership (%)** for
   disclosure; equity share follows economic interest where the two
   differ.
5. Leave **Operated by the company** ticked if the company or one of
   its subsidiaries operates the entity; untick it otherwise. This is
   what the operational control approach reads.
6. Leave **Financial control** as "Follows the Table 1 row" unless the
   company's control differs from what the relationship implies. The
   two overrides, "Consolidated under financial control (IFRS 10),
   whatever the holding" and "Not financially controlled, whatever the
   holding", ask for a **Basis of the decision**.
7. Choose **Held through**: "Held directly by the reporting company" or
   the parent entity. The share is this row's times the parent's,
   because the Standard applies the consolidation policy at every level.
   A chain cannot loop.
8. Fill **Acquired on (optional)** and **Disposed of on (optional)** if
   the entity joined or left during a year: "Every inventory's
   membership window starts here." Fill **Jurisdiction (optional)** with
   the ISO 3166-1 alpha-2 country code.
9. Click **Add entity**.

## What you see

"*Name* added." and a row whose last three columns, **Equity share**,
**Financial ctrl** and **Operational ctrl**, show the share the entity
would carry under each approach. A wholly owned, operated subsidiary
reads 100% in all three; an associate at 30% reads 30%, 0%, 0%.

## What changed elsewhere

- The entity can now be chosen as a facility's **Legal entity**.
- An inventory created with **Start with every operation the approach
  includes in the boundary** places the entity in or out according to
  its share under that inventory's approach. Existing inventories are
  not changed: the boundary is a view, and a frozen one is fixed.
- **Edit** changes the entity's facts for every future boundary.
  **Remove** is refused while a facility belongs to the entity: "still has
  facilities. Move them to another entity before deleting it."

See [Which operations belong in my inventory?](../../concepts/boundaries-and-consolidation-approaches.md)
for how the shares are computed.
