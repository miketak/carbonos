---
owner: miketak
last_reviewed: 2026-09-29
description: Add the mine's two sites, Nyame Pit and Plant and Obuasi Camp, and register the five source streams whose kind and operator fix each record's default scope.
role: Preparer
minutes: 10
screens: [step-2-facilities.png]
---

# Record the facilities and source streams

This second step of the Get started series records the two sites of Gye Nyame Gold and the five source streams that its activity records name. The facilities draw the boundary; the streams fix the default scope and category of every record that cites them.

<!-- sources: specs 03, 04.1, 04.7 (facilities, source streams and their defaults); the old tutorial get-started/your-first-inventory.md (verified 2026-09-24); screen text and figures from the Gye Nyame Gold walkthrough of 2026-09-28 (replay-log.txt) -->

## Before you start

- The organization Gye Nyame Gold Ltd and its subsidiary Gye Nyame Camp Services Ltd exist, from [Create the organization and its legal entity](create-the-organization-and-its-legal-entity.md).
- You are its owner, which includes everything a preparer may do.

## Add the two facilities

1. Open **Facilities**. The page reads "No facilities yet". Click **Add facility**.
2. Fill **Name** `Nyame Pit and Plant`, **Location** `Obuasi, Ghana`, **Country (optional)** `GH` and **Grid region (optional)** `GHA`.
3. Choose **Facility type (optional)** "Mine" and leave **Lease (optional)** as "Owned, not leased" and **Legal entity** as "Gye Nyame Gold Ltd (Reporting company)". Click **Add facility**.
4. Click **Add facility** again. Fill **Name** `Obuasi Camp`, **Location** `Obuasi, Ghana`, **Country (optional)** `GH`, and leave **Grid region (optional)** empty.
5. Choose **Facility type (optional)** "Camp", **Lease (optional)** "Operating lease (leased in)", and **Legal entity** "Gye Nyame Camp Services Ltd (Subsidiary)". Click **Add facility**.

![The Facilities page with Nyame Pit and Plant and Obuasi Camp, both on grid GHA, and the counters Facilities 2 and Legal entities represented 2 of 2](../assets/screens/step-2-facilities.png)

What you see: "Nyame Pit and Plant added." then "Obuasi Camp added." The counters read "Facilities 2", "Legal entities represented 2 of 2" and "Under subsidiaries 2 of 2". Both rows show "grid GHA": you left the camp's grid region blank, and, as the field says, "Blank follows the country." The camp's row also shows "Operating lease (leased in)". Records at a leased site inherit the lease, and Appendix F of the Corporate Standard sets their scope under each approach, so the lease is recorded once, here.

## Register the source streams

A source stream is one source of emissions at a site. A record names its stream; the stream's kind fixes which categories the record can be classified into, and whether a contractor operates it fixes the default scope.

1. On the row for Nyame Pit and Plant click **Source streams**. The dialog "Source streams: Nyame Pit and Plant" reads "No streams registered yet."
2. Fill **Stream name** `Haul fleet`, choose **Kind** "Mobile combustion", fill **Fuel or material (optional)** `Diesel`, and click **Add stream**.
3. Fill **Stream name** `Contract ore haulage`, **Kind** "Mobile combustion", **Fuel or material (optional)** `Diesel`, tick **Operated by a contractor (its emissions default to scope 3)**, and click **Add stream**.
4. Untick **Operated by a contractor (its emissions default to scope 3)**: the box keeps its state between additions. Fill **Stream name** `Plant grid supply`, **Kind** "Purchased electricity", **Meter or supplier (optional)** `ECG-OBU-01`, click **Add stream**, then **Close**.
5. On the row for Obuasi Camp click **Source streams**. Add `Camp gensets`, kind "Stationary combustion", fuel `Diesel`; then `Camp kitchens`, kind "Stationary combustion", fuel `LPG`. Click **Close**.

What you see: a message for each stream, from "Haul fleet added to Nyame Pit and Plant." to "Camp kitchens added to Obuasi Camp." The dialog lists a site's streams alphabetically, each with the default it gives its records: under "Contract ore haulage", "Mobile combustion · Diesel · contractor-operated · defaults to Scope 3, 1. Purchased goods and services"; under "Haul fleet", "Mobile combustion · Diesel · owned or controlled · defaults to Scope 1, Mobile combustion"; and under "Plant grid supply", "Purchased electricity · ECG-OBU-01 · owned or controlled · defaults to Scope 2, Purchased electricity". At the camp, both streams default to "Scope 1, Stationary combustion". The contractor's default is the Corporate Standard's rule (chapter 4) that a contractor's combustion belongs in the customer's scope 3, and CarbonOS applies it without asking you to justify it.

## What you have

- Two facilities, Nyame Pit and Plant under Gye Nyame Gold Ltd and Obuasi Camp under Gye Nyame Camp Services Ltd, both on grid GHA, the camp under an operating lease.
- Five source streams: three at the pit, one of them contractor-operated, and two at the camp, each with a default scope and category.
- Nothing recorded against them yet; steps 3 and 4 bring in the factors and the records.
