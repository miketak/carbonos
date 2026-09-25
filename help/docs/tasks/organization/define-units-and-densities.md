---
owner: miketak
last_reviewed: 2026-09-24
---

# Define units and densities

**Role needed:** Preparer, Reviewer or Owner.

Records are kept in the unit they arrive in. CarbonOS converts a
quantity into the factor's unit only within one physical dimension:
litres to cubic metres, kilowatt hours to megawatt hours. A custom unit
lets a record arrive in drums or bags; a density lets a quantity
invoiced by mass meet a factor published per litre.

<!-- sources: UnitsPage.tsx; units.ts; spec 02.2; verified 2026-09-24 -->

## Define a custom unit

1. Open **Units**.
2. Under **Custom units** fill **Code** (what the CSV column and the
   record's unit picker use, for example `drum`), **Label** (for
   example `200-litre drum`), **One unit equals** (for example `200`)
   and **Of** (a registered unit, for example "Litre (litre)").
3. Click **Define unit**.

What you see: "1 drum = 200 litre defined." and the unit in the table.
A record in drums now converts like any other litre record, and the run
line prints the conversion it applied. **Delete** removes the unit from the
list.

## Record a density

The **Densities** card ships typical values for common fuels, each
marked "Typical value" with its range and the note "A planning value.
Replace it with the density on the supplier's certificate of analysis
before a final run; the gate warns while a typical value is in use."

1. Under **Densities** fill **Material** with the name the records use,
   for example `Diesel`.
2. Fill **kg per litre** from the supplier's certificate of analysis,
   for example `0.8325`, and **Source** (the certificate and its batch).
   **Note (optional)** is for context.
3. Click **Record density**.

What you see: "Density of Diesel recorded." and a row for your value
beside the typical one, with **Delete**.

## What changed elsewhere

- When a record's unit is a mass and the chosen factor is per litre, the
  classification drawer asks for the density that converts between
  them and previews the arithmetic: "3 tonne → 3,603.6036 litre (density
  of Diesel (supplier CoA), 0.8325 kg/litre) × 2.66155 kg CO₂e/litre".
- A run may use a typical value; a final run may not. The Emission
  factors gate warns while a typical value is in use, and clears once
  a recorded density or a proxy justification stands in.
- The run line and the lines export print the density and its source.
