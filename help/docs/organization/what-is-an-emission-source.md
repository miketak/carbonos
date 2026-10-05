---
owner: miketak
last_reviewed: 2026-10-04
description: What CarbonOS calls an emission source, how it differs from the data source on a record, what its kind and operator decide, and why it carries no emission factor.
---

# What is an emission source?

An emission source is the thing at a facility that activity records are about. It belongs to one facility, has a kind, and says whether the company or a contractor operates it.

<!-- sources: spec 04.10 (the definition, agreed with the GHG officer on 2026-10-04); specs 04.3 and 04.1; Corporate Standard chapter 4; EmissionSourcesPage.tsx, EmissionSourceField.tsx -->

## Two kinds of thing

Sometimes a source is a physical unit or process the company owns or controls and that releases greenhouse gases: a generator, a boiler, a haul truck, a kiln. That is the Corporate Standard's own word, "source", in chapter 4. Such a unit may carry a serial number; **Meter or supplier (optional)** holds it for now.

Sometimes a source is intangible: purchased grid electricity, bought steam, a contractor's haulage. The emissions happen somewhere else, at the power station or in the contractor's trucks, but the company consumes or pays for them. The meter, the supplier account or the contract is the practical handle, and that is what the source names.

## Not the data source

A record also has a **Data source**: where the figure came from, an invoice, a meter reading, a dispensing log. The emission source says what emitted; the data source says how you know the figure. Readiness asks for both: "Ready means the figures, an emission source, a data source and evidence are present".

## What the source decides

Its **Kind** fixes the categories its records can be classified into, and whether a contractor operates it fixes the default scope: own combustion and process to scope 1, purchased energy to scope 2, a contractor-operated source to scope 3. The default is only a default. Each inventory confirms the scope when the record is classified, and a departure needs a justification; see [What is scope classification?](../inventories/what-is-scope-classification.md).

## Why it carries no emission factor

A factor belongs to a period, an edition and a region, and a Scope 2 record needs two. A factor pinned to the source would drift across years. So the source stays stable while editions change, and the factor is chosen in each inventory's review. The source does carry a fuel or material, which narrows the factors offered.

## Where it is created

On the facility's **Emission sources** page, several at a time, or on the activity form itself under **New emission source…** when the invoice is in hand; see [Record facilities and emission sources](record-facilities-and-emission-sources.md) and [Enter a record](../activity-data/enter-a-record.md). Either way the organization's history records it, and a source born on the activity form is marked "added during data entry".
