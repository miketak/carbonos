---
owner: miketak
last_reviewed: 2026-09-26
---

# Glossary

One stable name for each thing in CarbonOS, with the GHG Protocol term it
stands for where there is one. The concept pages explain how these things
relate; this page only says what each word means.

<!-- sources: spec 00 (glossary table and invariants); format.ts label maps; roles.ts; verified in the browser on 2026-09-24. The spec's "seeded emission-factor library" row is retired (spec 02.10): factors now come from packs an organization imports or enters by hand.; spec 01.8 (account numbers, verified 2026-09-26) -->

| Term | Meaning in CarbonOS | GHG Protocol term |
| --- | --- | --- |
| Account number | The number CarbonOS assigns to an organization when it is created, shown beside the name as ORG-0042. Two organizations may share a name; the account number never changes and is never reused. | |
| Activity record | One fact about what an organization did: an activity type, a quantity in a unit, a period, a facility, a source, and the evidence behind it. A record carries no scope, category or factor; each inventory decides those separately. | Activity data |
| Assignment | An inventory's decision about one record: included and classified with a factor, scope and category, or excluded with a reason. Assignments belong to the inventory, never to the record. | Operational boundary applied to one activity |
| Base year | The year an organization compares later years against, with a significance threshold and a policy for mid-year structural changes. Designated on **Base year** from a published inventory's final run. | Base year |
| Boundary version | The organizational boundary of one inventory as it stood when it was frozen: every entity and facility in the boundary, their shares, membership windows, and the exclusions with reasons. Each freeze cuts a new version; runs cite the version they used. | Organizational boundary |
| Calculation run | An immutable, numbered snapshot of an inventory's view calculated: one line per included record, the derived lines, and the exclusions. A run is never edited or deleted; a wrong run is voided with a reason. | GHG inventory results |
| Consolidation approach | Equity share, financial control or operational control: the rule an inventory uses to turn each entity's Table 1 relationship into an accounting share. | Consolidation approach |
| Correction | A new draft inventory over the same period and approach that inherits a published inventory's decisions, carries a reason, and supersedes the published report when it is published in turn. | Recalculation of a reported year |
| Declaration | The scope 3 categories an inventory declares as covered, with a reason for each declared category it does not quantify and for the categories it leaves out. The report prints it beside each category's total. | Operational boundary (scope 3) |
| Draft (record) | An activity record saved before its figures arrive. A draft holds a source until it becomes a fact; a fact never goes back to a draft. | |
| Edition | One dated release of a factor pack, named by an identifier a report cites (`defra-2025`). Once published, an edition's rows and values never change; a correction is a new edition. | Emission factor source, vintage |
| Emission factor | A published rate of kilograms of CO₂e per unit of activity, with its source, year, unit, gas split and validity. It reaches an organization by importing a pack or by hand entry, and it can be applied only once approved. | Emission factor |
| Evidence | A file or a link attached to an activity record, or a document reference typed on it. Evidence supports a fact; it is not an approval of it. | Documentation |
| Exclusion | A record left out of an inventory with a reason. The report still counts what was excluded, per reason, and never prints a false zero for it. | Justified exclusion |
| Facility | A site under one legal entity: a plant, an office, a depot. Its lease type and grid region shape how its records are classified and which grid factor is suggested. | Operation, facility, business unit |
| Factor pack | A family of editions of one publication, such as the UK Government (DESNZ) conversion factors or the Ghana grid factors. An organization imports an edition to hold its factors. | Emission factor source |
| Final run | The calculation run a reviewer or owner designates as the inventory's result, with an optional review note. The report and the base year attach to it. | Approved inventory results |
| Freeze | The act that makes an inventory's boundary and view read-only and cuts a boundary version, so that runs can be launched. Reopening as a draft undoes it, with a reason. | |
| Gate | One of the five pre-flight checks (Reporting boundary, Activity data completeness, Classification, Emission factors, Base year) that CarbonOS runs live over a draft or frozen inventory. An error holds the launch; a warning does not. | |
| Inventory | An accounting view over the organization's facts for one reporting period under one consolidation approach and one GWP set. Two inventories over the same facts may report different totals. | Inventory for a reporting period |
| Legal entity | A company the organization consolidates: the reporting company itself, or a subsidiary, joint venture, associate, investment or franchise with its Table 1 facts. Every facility belongs to one. | Legal entity (Table 1) |
| Lineage | One factor across editions: the same code in `defra-2025` and `defra-2026` is one lineage with two versions, each valid for its own dates. | |
| Membership window | The dates between which an entity counts in an inventory's boundary, prefilled from its acquisition and disposal dates. Records outside the window are excluded on review. | Mid-year acquisition or divestment |
| Notice | An organization's copy of a factor pack update: one per published edition it holds a predecessor of, listed under **Updates**, waiting for a reviewer or owner to accept or decline it. | |
| Organization | The reporting company as CarbonOS holds it: its members, entities, facilities, records, factors and inventories, private to its members. | Reporting company |
| Platform administrator | A person whose account has the Admin role: creates and approves accounts, runs the factor pack catalogue and the platform settings, and can take support access to an organization. Not a member of any organization by right. | |
| Proxy factor | A factor flagged as standing in for one that is not published or not yet approved, with a justification that says what it stands for. | Proxy data |
| Recalculation candidate | A record on **Base year** that a change may require the base year to be recalculated: raised by a freeze that moves the boundary, or by hand for a methodology change or a corrected error, and decided as recalculated or declined. | Base year recalculation trigger |
| Report version | Counts the inventories of one period: 1 for the first, one more for each correction. Distinct from the boundary version, which counts freezes of one inventory. | |
| Residual mix | The emission factor for electricity that no contractual instrument claims. An inventory states whether one is available for its markets; when none is, the grid average stands in and the report says so. | Residual mix (Scope 2 Guidance) |
| Run line | One row of a calculation run: the record, the factor and its version, the converted quantity, the accounting share, the period share, and the result in kilograms of CO₂e and per gas. | |
| Scope | Scope 1, 2 or 3, chosen on each assignment. The record's stream suggests a default; a departure from it needs a justification. | Scope 1, 2, 3 |
| Scope 2 instrument | A supplier-specific factor, power purchase contract or energy attribute certificate recorded on the **Method** tab with the megawatt-hours it covers and the eight Scope 2 Quality Criteria. It is applied only when every criterion is met. | Contractual instrument |
| Source stream | A named source of emissions at a facility, with a kind (stationary combustion, purchased electricity, and so on), a fuel or meter, and whether a contractor operates it. A record names its stream, and the stream sets the record's default scope and category. | Emission source |
| Support access | A platform administrator's time-limited grant to act as an owner inside an organization, taken with a reason and recorded in the organization's history. It never carries deleting the organization, changing its members, or deciding a factor pack notice. | |
| Table 1 | The GHG Protocol's table that turns a legal entity's relationship and economic interest into an accounting share under each consolidation approach. CarbonOS derives the share from the entity's facts. | Table 1 |
| Upstream rule | A rule on the **Method** tab that derives a scope 3 category 3 line (well-to-tank, or transmission and distribution losses) from every included record priced with a given primary factor. | Fuel- and energy-related activities |
| Vintage | The dates a factor version is valid for, set by the edition it came from. An inventory offers the versions live in its period; a reported year keeps the factors it reported with. | |
