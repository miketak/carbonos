---
owner: miketak
last_reviewed: 2026-10-04
description: Define a custom unit as a multiple of a registered one, and record a fuel's density from the supplier's certificate so a mass quantity can meet a factor per litre.
role: Preparer
minutes: 3
---

# Define units and densities

Records are kept in the unit they arrive in, and CarbonOS converts within one physical dimension only. You define a custom unit when records arrive in drums or bags, and record a density when fuel is invoiced by mass and its factor is published per litre.

<!-- sources: specs 02.2 and 10 (the split register); old page tasks/organization/define-units-and-densities.md (verified 2026-09-24); UnitsPage.tsx, units.ts, OrganizationLayout.tsx, GhgService.java (createCustomUnit, createDensity), InventoryService.java (the density gate message) -->

## Before you start

- You are a preparer, reviewer or owner.
- For a density, the supplier's certificate of analysis for the batch, with its figure in kilograms per litre.

## Define a custom unit

1. Open **Units** in the organization's sidebar. The page is titled **Units and densities**.
2. Under **Custom units**, fill **Code**, the name the CSV column and the record's unit picker use, for example `drum`.
3. Fill **Label**, for example `Drum (200 L)`.
4. Fill **One unit equals**, for example `200`, and choose **Of**, a registered unit listed by dimension, for example "Litre (litre)".
5. Click **Define unit**.

What you see: "1 drum = 200 litre defined." and the unit in the table. A record in drums now converts like any other litre record, and the run line prints the conversion it applied. A code already in use is refused: "A custom unit named '*code*' already exists." **Delete** removes the unit and confirms "drum deleted."

## Record a density

The **Densities** card explains itself: "Fuel is often invoiced by mass and its factor published per litre. A density converts between them; the line prints the arithmetic. Typical values are for planning: the gate warns until the supplier's certificate of analysis replaces them." The densities CarbonOS ships for common fuels carry the badge **Typical value**.

1. Under **Densities**, fill **Material** with the name the records use, for example `Diesel`.
2. Fill **kg per litre** from the certificate, for example `0.8325`.
3. Fill **Source** with the certificate and its batch, for example `Supplier certificate of analysis, batch 2025-03`, and **Note (optional)** for context.
4. Click **Record density**.

What you see: "Density of Diesel recorded." and a row for your value, with its source, beside the typical one, with **Delete**. A second density for the same material is refused: "A density for '*material*' already exists."

## What happens next

When a record's unit is a mass and the chosen factor is per litre, the record's **Classify** tab in the inventory asks for the density that converts between them and previews the arithmetic with the density and its source named. A run may use a typical value; a final run may not: the Emission factors gate warns while a typical value is in use, and clears once a recorded density stands in. The run line and the lines export print the density and its source.
