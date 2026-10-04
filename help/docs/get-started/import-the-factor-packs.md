---
owner: miketak
last_reviewed: 2026-10-04
description: Import the DESNZ 2025 and Ghana factor pack editions to give the organization its 1,935 emission factors, and find the one derived factor that arrives unapproved.
role: Preparer
minutes: 5
screens: [step-3-factor-packs.png]
---

# Import the factor packs

This third step of the Get started series gives Gye Nyame Gold its baseline of emission factors: two published pack editions, imported in two clicks, and one derived factor that you find but leave unapproved until step 6.

<!-- sources: spec 10 (the factor packs table); specs 02.5, 02.6, 02.9 (factor packs, editions and approval); the old tutorial get-started/your-first-inventory.md (verified 2026-09-24); screen text and figures from the Gye Nyame Gold walkthrough of 2026-09-28 (replay-log.txt) -->

## Before you start

- The organization and its two facilities exist, from [Record the facilities and source streams](record-the-facilities-and-source-streams.md).
- Nothing else. An organization starts with no factors: **Emission factors** reads "0 factors" and "None yet. Import a pack or add a supplier-specific factor."

## Import the two editions

1. Open **Emission factors**. The **Factor packs** table lists the editions the platform publishes, each with its row count, source and retrieval date: "UK Government (DESNZ) GHG conversion factors 2025" with "1928 factors", the 2026 edition of the same table, and "Ghana: grid electricity and transmission losses" with "7 factors".
2. On "UK Government (DESNZ) GHG conversion factors 2025" click **Import pack**. Wait for the message "defra-2025, applying from 2025-01-01: 1928 added, 0 versioned, 0 tagged, 0 unchanged."
3. On "Ghana: grid electricity and transmission losses" click **Import pack**. The message reads "ghana, applying from 2025-01-01: 7 added, 0 versioned, 0 tagged, 0 unchanged."

![The Emission factors page after both imports, with the two import messages and the count 1,935 factors](../assets/screens/step-3-factor-packs.png)

What you see: **This organization's factors** now reads "1,935 factors", and the **Published category** and **Published activity** filters list the DESNZ taxonomy. Leave the 2026 edition alone: the series reports 2025, and the panel explains what a later edition would do: "A later edition never overwrites a figure: it closes the version you hold and cuts a new one from the edition's applies-from date, so a period you have already reported keeps the factors it reported with." Importing the same edition a second time is harmless: every factor is reported as unchanged and nothing is added.

The DESNZ rows also say "UK factors apply to Ghanaian activity by analogy; say so in the report." The Ghana pack supplies the two factors that are not an analogy: the grid intensity and the losses upstream of it.

## Find the unapproved factor

Only approved factors can be run. One of the seven Ghana rows is different from the rest: it is derived rather than published, and CarbonOS leaves its approval to you.

1. Tick **Show unapproved**.
2. In **Search factors** type `losses`.

What you see: one row, "Grid electricity T&D losses, Ghana (derived)", with the suggested scope "Scope 3" and category "3. Fuel- and energy-related activities", the value "0.117202 kg CO₂e/kWh", the status **Not approved**, and an **Approve** button. The row explains why: "Derived, not published: approve it after checking the year's loss rate with the Energy Commission statistics, or replace it with the utility's figure." Its source line shows the arithmetic: the 2024 Ember grid intensity of 0.468809 kg CO2e/kWh times the share of generation lost in transmission and distribution, 20% by the Energy Commission's statistics. Leave it as it is. Step 6 approves it before adding the upstream rule that needs it.

## What you have

- 1,935 factors in the organization: 1,928 from the DESNZ 2025 edition and 7 from the Ghana pack, each carrying its citation, vintage and validity.
- One factor, the derived Ghana loss factor, still **Not approved**.
- No factor applied to anything yet: a factor suggests a scope, and the classification in step 6 decides.
