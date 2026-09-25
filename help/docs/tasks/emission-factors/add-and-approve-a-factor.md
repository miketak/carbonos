---
owner: miketak
last_reviewed: 2026-09-24
---

# Add and approve a factor

**Role needed:** Preparer, Reviewer or Owner to add a factor; Reviewer
or Owner to approve one, and never the person who entered it.

A factor entered by hand is a supplier's figure, a national publication
the packs do not carry, or a proxy. It arrives unapproved, and only an
approved factor can be applied by a run.

<!-- sources: EmissionFactorsPage.tsx (add dialog, approval row, refusal); GhgService approval rule; spec 02.11; verified 2026-09-24 -->

## Add a factor

1. Open **Emission factors** and click **Add factor**.
2. Fill **Name**. Choose **Suggested scope** and **Category**; the
   categories offered follow the scope. A factor only suggests a scope:
   "the classification decides".
3. Fill **Unit** (what the factor is per: `tonne`, `litre`, `kWh`, `kg`)
   and **kg CO₂e per unit**.
4. Fill the gas masses where the source publishes them: **CO₂**,
   **CH₄** (with **Methane is of fossil origin** ticked unless it is
   biogenic), **N₂O**, **HFCs**, **PFCs**, **SF₆**, **NF₃**, each in kg
   per unit. For a refrigerant blend, fill **Blend composition** with the
   mass fractions per species; "With a composition the run re-derives
   the figure under the inventory's GWP set." A source that publishes
   CO₂e only leaves the gases empty, and the report lists the factor's
   emissions on the row "CO2e from factors without a gas split".
5. Choose **GWP basis of the published figure** if the source states
   it; it is "printed when the figure cannot be re-derived".
6. Fill **Source (publication, table, data year)**, **Source URL
   (optional)**, **Publication year** and **Data year**. Set **Valid
   from** and **Valid to** if the source limits them.
7. Leave **Reporting basis** as "Counted in the scopes" unless the
   factor is for a Montreal Protocol gas, which is "Outside the scopes"
   and reported separately.
8. Leave **Approved for use in runs** unticked unless you are entering
   a factor someone else has already checked. Click **Add factor**.

What you see: "*Name* added." With **Show unapproved** ticked, the row
reads "entered by hand" and **Not approved**, with **Approve** and
**Delete**.

## Approve a factor

1. A reviewer or owner other than the person who entered it opens
   **Emission factors**, ticks **Show unapproved**, finds the row and
   clicks **Approve**.

What you see: the row reads **Approved** "by *email* on *date*", and the
button becomes **Unapprove**.

If the person who entered the factor clicks **Approve**, CarbonOS
refuses: "You entered '*name*'. A factor is checked by someone other
than the person who typed it (Corporate Standard chapter 7): ask *name*
to approve it." When the organization has no other member who could
check it, the approval is accepted and recorded as "(self-approved:
nobody else could check it)", and the report says so.

A derived row a pack ships unapproved, such as the Ghana loss factor,
was typed by nobody in the organization, so any reviewer or owner can
approve it after the check its row describes.

## Delete or retire a factor

**Delete** removes a hand-entered factor no run has applied, at once
and without a dialog: "*Name* deleted." A factor a run has applied
cannot be deleted; CarbonOS answers "was applied by a calculation run.
Set its validity end to retire it instead of deleting it." A retired
factor stays in every run that used it and is no longer offered for
new classifications after its validity end.

## What changed elsewhere

- An unapproved factor can be chosen in the classification picker
  under **Show unapproved**, but the Emission factors gate errors until
  it is approved, and the run stays on hold.
- The upstream-rule pickers on an inventory's **Method** tab offer
  approved factors only.
