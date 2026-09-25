---
owner: miketak
last_reviewed: 2026-09-24
---

# Record facilities and source streams

**Role needed:** Preparer, Reviewer or Owner.

A facility is a site. Every activity record names one, and the site's
legal entity, country, grid region and lease are facts that every
inventory reads. A source stream is one source of emissions at the
site; a record names its stream, and the stream decides which scope and
category the record defaults to.

<!-- sources: FacilitiesPage.tsx; FacilityFormModal.tsx; StreamsModal.tsx; specs 03, 04.1, 04.7; verified 2026-09-24 -->

## Add a facility

1. Open **Facilities** and click **Add facility**.
2. Fill **Name** and **Location**.
3. Fill **Country (optional)** with the ISO 3166-1 alpha-2 code, "for
   the report's country breakdown".
4. Fill **Grid region (optional)**, for example `GHA`: "The grid the
   site draws from; its location-based factor is suggested. Blank
   follows the country." With `GH` as the country and no grid region,
   the row still reads "grid GHA".
5. Choose **Facility type (optional)**: Office, Mine, Processing plant,
   Warehouse, Port or loadout, Camp, Fleet depot, Construction site,
   Well site, or Other.
6. Choose **Lease (optional)**: "Owned, not leased", "Finance lease
   (leased in)", "Operating lease (leased in)", "Finance lease (leased
   out)" or "Operating lease (leased out)". The form explains why it
   matters: "Records at a leased site inherit the lease; Appendix F sets
   their scope under each approach." A lease can carry **Lease from**
   and **Lease until** dates.
7. Choose **Legal entity**. Ownership and control facts live on the
   entity, so add it under **Legal entities** first.
8. Click **Add facility**.

What you see: "*Name* added." The counters read how many facilities
there are, how many legal entities they represent, and how many sit
under subsidiaries. The row shows the type, the grid, the lease and the
entity.

## Add source streams

1. On the facility's row click **Source streams**.
2. Fill **Stream name**, for example the boiler, the grid meter, the
   fleet.
3. Choose **Kind**: Stationary combustion, Mobile combustion, Process,
   Fugitive, Purchased electricity, Purchased heat, steam or cooling,
   Waste, Transport, Business travel, Employee commuting, Purchased
   goods and services, or Other. The kind fixes which categories a
   record of this stream can be classified into.
4. Fill **Fuel or material (optional)** and **Meter or supplier
   (optional)** as they appear on the invoices; the reviewer sees them
   beside each record.
5. Tick **Operated by a contractor (its emissions default to scope 3)**
   if a contractor operates the source. The dialog cites the rule: "a
   contractor's source is scope 3, Corporate Standard chapter 4".
6. Click **Add stream**, and **Close** when the list is complete.

What you see: "*Stream* added to *facility*." and a line for the stream
with the default it gives its records, for example "Stationary
combustion · LPG · owned or controlled · defaults to Scope 1, Stationary
combustion" or "Mobile combustion · Diesel · contractor-operated ·
defaults to Scope 3, 1. Purchased goods and services".

## What changed elsewhere

- The facility and its streams are offered when a record is entered or
  imported; the import matches the `facility` and `stream` columns by
  name.
- A record classified under the default the stream gives needs no
  justification; a record classified in another scope does.
- **Edit** on a facility changes its facts for every future review.
  Records already classified in a frozen inventory keep the treatment
  that inventory recorded.
