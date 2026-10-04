---
owner: miketak
last_reviewed: 2026-09-28
description: The three ways the GHG Protocol lets a company consolidate its emissions, and how CarbonOS turns each entity's relationship into a share under the approach an inventory uses.
---

# What is a consolidation approach?

A consolidation approach is the rule an inventory uses to decide which of the company's operations count, and at what share. The Corporate Standard offers three; CarbonOS prints the one you chose on the report's first page.

<!-- sources: specs 03, 03.1 to 03.4; old page concepts/boundaries-and-consolidation-approaches.md (verified 2026-09-24); format.ts (relationshipLabels, approachLabels); EntityFormPage.tsx; screen text and figures from the Gye Nyame Gold walkthrough of 2026-09-28 (replay-log.txt): "1 entity dialog", "1 entities after", "5 inventory dialog" -->

## What are the three approaches?

| Approach | An operation counts | Its share is |
| --- | --- | --- |
| Equity share | When the company holds an economic interest in it | The economic interest, as a percentage |
| Financial control | When the company can direct its financial and operating policies | 100% or 0% (a joint venture: its economic interest) |
| Operational control | When the company, or one of its subsidiaries, operates it | 100% or 0% |

You choose the approach when you create an inventory, and it cannot change afterwards; a second inventory over the same period can use another.

## How does a relationship become a share?

Every legal entity carries the facts Table 1 needs: its relationship to the reporting company, its economic interest, whether the company operates or financially controls it, and the parent it is held through; "the relationship and the approach together set the accounting share."

Under equity share, the share is the economic interest. Under financial control, a subsidiary counts at 100%, a joint venture at its economic interest, an associate at 0%. Under operational control, an operated subsidiary, joint venture or franchise counts at 100%, anything else at 0%. An entity held through another takes the parent's share times its own; one at 0% sits outside the boundary.

## What does Gye Nyame Gold look like?

Gye Nyame Gold Ltd operates its mine, and Gye Nyame Camp Services Ltd is a wholly owned, operated subsidiary: both rows read 100% under **Equity share**, **Financial ctrl** and **Operational ctrl**. A 60% stake would count at 60% under equity share, at 100% under financial control if the group controls it, and at 100% under operational control only if the group operates it.

## Where next

- [Record legal entities](record-legal-entities.md).
- [Create an inventory and draw the boundary](../inventories/create-an-inventory-and-draw-the-boundary.md).
