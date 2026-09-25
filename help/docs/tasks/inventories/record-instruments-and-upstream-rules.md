---
owner: miketak
last_reviewed: 2026-09-24
---

# Record instruments and upstream rules

**Role needed:** Preparer, Reviewer or Owner. The inventory must be a
draft.

The **Method** tab holds the decisions that are neither a boundary nor
a classification: the residual-mix disclosure, the contractual
instruments the market-based scope 2 figure uses, and the upstream
rules that derive scope 3 category 3 lines from the records already
held.

<!-- sources: MarketFactorsCard.tsx; UpstreamRulesCard.tsx; InventoryService.java instrument and rule findings; specs 04.8, 07.3, 07.6; verified 2026-09-24 -->

## Answer the residual-mix question

Every run reports scope 2 location-based and market-based side by
side, and the Scope 2 Guidance requires the residual-mix disclosure
either way.

1. Under **Market-based scope 2 instruments** choose **Residual mix
   available**: "Yes, an adjusted residual mix is published" with the
   value in **Residual mix, kg CO₂e per kWh**, or "No residual mix is
   available".
2. Click **Save residual mix**.

What you see: "Residual mix recorded." Until it is answered the
Emission factors gate warns: "The inventory does not say whether a
residual mix is available … until it is recorded, uncovered electricity
is priced at the grid average."

## Record an instrument

An instrument applies to the megawatt-hours it covers over its period;
the balance, and every facility without an instrument, takes the
residual mix, or the grid average when none is published.

1. Choose **Facility** and **Instrument**: "Supplier-specific factor",
   "Power purchase contract", "Energy attribute certificate" or
   "Residual mix".
2. Fill **kg CO₂e per kWh** and **Source**.
3. Fill **Covered quantity (MWh)**, and **Covers from** and **Covers
   to** if the instrument does not span the whole period.
4. Fill **Certificate or contract reference**, **Registry**, **Vintage
   (year)** and **Retirement date**: they "are held as evidence".
5. Answer the **Scope 2 Quality Criteria, one at a time**: each of the
   eight is "Not yet answered", "Met" or "Not met". "The instrument is
   applied only when all eight are met; an unanswered criterion counts
   as not met until it is answered." Add **Quality notes** if needed.
6. Click **Add instrument**.

What you see: "Instrument recorded for *facility*." and a row with the
factor, the coverage, the source and "All eight met" or which criteria
are not. **Edit** and **Remove** act on the row.

The Emission factors gate checks the coverage against the facility's
electricity in the view: "The instrument for *facility* covers 30,000
kWh but the facility's scope 2 electricity in its period is 0 kWh: the
excess covers nothing." An instrument that does not meet the criteria
is not applied, and the report says so.

## Add an upstream rule

"Fuel- and energy-related activities (Scope 3 Standard, category 3)
ride on the records this inventory already holds: the well-to-tank
emissions of every litre in scope 1 and the transmission and
distribution losses of every kilowatt-hour in scope 2. A rule derives
those lines; nothing is entered twice."

1. Under **Upstream rules**, type in **Narrow the primary factors** and
   choose **Primary factor**: the factor the records already use, for
   example the grid factor.
2. Type in **Narrow the upstream factors** and choose **Upstream
   factor**: the well-to-tank or loss factor. "Its unit must convert
   from the primary factor's." Only approved factors are offered; an
   unapproved one has to be approved under **Emission factors** first.
3. Choose **Kind**: "Well-to-tank (upstream emissions of the fuel)" or
   "Transmission and distribution losses".
4. Click **Add rule**.

What you see: "Upstream rule added." and a row with the two factors,
the kind, and **Records**, which counts the lines a run derived from
it. The Classification gate lists the rule for information. The run
prints each derived line with its origin: "transmission and
distribution losses of ACT-0002 Plant grid electricity", and the
methodology section names the rule.

## What changed elsewhere

- Instruments, the residual-mix answer and the rules are part of the
  view: the freeze fixes them, a copy of the view carries them, and the
  frozen-inputs export lists them.
