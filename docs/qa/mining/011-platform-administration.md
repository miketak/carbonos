# Procedure 11: Platform administration

**Objective.** Confirm that a platform administrator lands in an
administration area that tells them what is waiting, that the panel carries
no client inventory data, and that the two deployment settings do what they
say: the support-access window governs new grants without moving grants
already in force, and reserving organization creation to administrators seats
the client as owner rather than the administrator.

**Covers** [spec 01.5](../../../specs/01.5-the-platform-administration-panel.md)
whole, the administration half of
[spec 01.6](../../../specs/01.6-landing-the-account-menu-and-retiring-the-resume-upload.md),
and the parts of
[spec 01.3](../../../specs/01.3-organization-confidentiality-and-deletion-safeguards.md),
[spec 01.8](../../../specs/01.8-account-numbers-and-shared-organization-names.md)
and [spec 02.7](../../../specs/02.7-adopting-a-new-edition.md) that the settings
change.

**Estimated time:** 50 minutes.

**Run this procedure** before a release, and after any change to the
administration shell, the platform settings, support access or the
organization-creation rule.

## Prerequisites

- An **ADMIN** account whose password you hold, and a second **ADMIN**
  account (procedure 1 creates an account; make it an administrator the same
  way). The dashboard's draft-edition row and the lone-administrator warning
  both depend on how many administrators exist.
- A **member** account that owns at least one organization, as procedure 2
  leaves **Sankofa Gold plc**.
- The normal window for the administrator, a private window for the member.

Restore both settings at the end (case E1). They are deployment-wide, so
leaving the window at 1 hour affects everybody who tests after you.

## A. The administration area

### A1. An administrator lands in the panel

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Sign in as the administrator. | You land on **Platform overview** directly, with no welcome card in between. | | |
| 2 | Read the sidebar. | Six entries in order: Dashboard, Access requests, Users, Organizations, Factor packs, Platform settings, and **GHG accounting** at the foot. | | |
| 3 | Check that **GHG accounting** is there while the administrator is a member of nothing and holds no grant, then follow it. | It is always present, never appearing and disappearing with memberships or grants, and it opens the GHG accounting list. With organization creation reserved to administrators this is the only route to **New organization**. | | |
| 4 | Click the CarbonOS wordmark in the top bar. | You come back to the platform dashboard: for an administrator the wordmark means their own home. | | |
| 5 | Collapse the sidebar with the chevron, then reload the page. | It is still collapsed. Expand it again. | | |
| 6 | Open `/admin/nothing-here` in the address bar. | You land on the dashboard, not a blank page. | | |
| 7 | In the private window, sign in as the member and open `/admin`. | "Access denied", with no sidebar and no administration content behind it. | | |

### A2. The panel carries no client inventory data

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As the administrator, read the whole dashboard. | Counts of users, organizations, editions and open adoption notices. No facility count, no inventory name, no run, and no figure in tCO2e anywhere. | | |
| 2 | Read the **Open adoption notices** tile. | A single number. It does not name which organization has an undecided notice, and it is not a link. | | |
| 3 | Open **Organizations**. | Each row shows the name with its account number (ORG-*NNNN*), owner emails and member count only, as procedure 1 case B8 also checks. | | |

## B. The work queue

### B1. A pending request appears, and clears when it is decided

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In the private window, signed out, click **Request access** and submit a request with a fresh email alias. | A confirmation state. | | |
| 2 | As the administrator, reload the dashboard. | **Needs your attention** shows "1 access request waiting", and the sidebar shows a 1 on **Access requests**. | | |
| 3 | Click the row. | You land on the access-requests page with the request in **Waiting for a decision**. | | |
| 4 | Approve it. | A toast confirms. The request moves to **Already decided** with its outcome and date. | | |
| 5 | Open the dashboard again. | The row is gone and the sidebar badge is gone. | | |

### B2. The draft-edition row respects the separation of duties

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As the administrator, create a pack family and a draft edition (procedure 10 case A1 does this). | The draft is created. | | |
| 2 | Open the dashboard. | A row says a draft edition is unpublished, and that you curated it, so somebody else has to publish it. | | |
| 3 | Sign in as the **second** administrator and open the dashboard. | The same row says you may approve 1 of them. | | |
| 4 | Click the row. | You land on the factor packs list, not on a one-click approval: spec 02.5 wants the approver to read the evidence first. | | |
| 5 | Delete the draft. | The row disappears from both dashboards. | | |

### B3. A lone administrator is warned

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Disable the second administrator on **Users**, then open the dashboard. | A row says you are the only active administrator, and explains that nobody can publish an edition you curated. | | |
| 2 | Re-enable the second administrator. | The row disappears. | | |

## C. The support-access window

### C1. A new grant takes the window in force

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On **Organizations**, assume access to Sankofa Gold plc with the reason `ticket 4512, preparer cannot open the run`. | Granted: "Support access to Sankofa Gold plc (ORG-*NNNN*) assumed." Note the expiry shown; it is 24 hours out. Open the organization: the banner reads "You are in Sankofa Gold plc (ORG-*NNNN*) under support access until …". | | |
| 2 | Open **Platform settings**, set the window to `1`, give the reason `tightening for the QA walkthrough`, and save. | A toast confirms. **Every change** lists the change from 24 to 1, with your email, the time and the reason. | | |
| 3 | Open the dashboard. | The strip at the foot says support access lasts 1 hour. | | |
| 4 | Open **Organizations** and read the grant you took in step 1. | Its expiry has **not** moved. A grant keeps the window it was taken under. | | |
| 5 | End that access, then assume it again with the reason `ticket 4512, second look at the run`. | The new grant expires one hour from now, not 24. | | |

### C2. The organization's own history states what applied to it

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Wait for the new grant to expire (an hour), or ask the development team to age it. Then, as the member, open the organization overview and read **Support access**. | The history lists "Support access expired" with the duration that actually elapsed: **1 hour**, not 24. A window changed afterwards must never restate an old grant wrongly. | | |
| 2 | Read the "Support access assumed" line. | It carries the reason you typed, and nothing appended to it. | | |

### C3. A refused window

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On **Platform settings**, set the window to `168` with a reason and save. | Refused under the field: support access lasts between 1 and 72 hours. A week of owner-equivalent access is standing access, not break-glass. | | |
| 2 | Set it to `2` and clear the reason, then save. | Refused under the reason field: at least 10 characters. | | |
| 3 | Check **Every change**. | Neither refusal was recorded. The history holds changes, not attempts. | | |

## D. Who may create an organization

### D1. Reserved to administrators

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On **Platform settings**, set **Who may create an organization** to **Administrators only** with the reason `hosted deployment, we onboard clients`, and save. | Saved, and listed in **Every change**. | | |
| 2 | In the private window as the member, open the GHG home. | **New organization** is gone. | | |
| 3 | Ask the development team to `POST /api/ghg/organizations` as that member. | Refused with 403, "This action needs a platform administrator." The screen is not the only guard. | | |

### D2. The client owns what the administrator creates

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As the administrator, open the GHG home and click **New organization**. | The form asks for the **owner's email**, explaining that naming somebody else means you are not a member. | | |
| 2 | Create **QA Onboarding Ltd** naming the member's email as owner. | "QA Onboarding Ltd (ORG-*NNNN*) created." The dashboard's privileged-access register and the **Organizations** table carry the number beside the name. | | |
| 3 | Stay as the administrator and open the GHG home. | QA Onboarding Ltd is **not** listed. Paste its URL: not found. An administrator does not own a client's organization. | | |
| 4 | In the private window as the member, open the GHG home. | QA Onboarding Ltd is listed, and the members card shows the member as **OWNER** and nobody else. | | |
| 5 | As the member, read the organization history. | It records that a platform administrator created it, naming them and the owner they seated. | | |
| 6 | Try creating one naming an email with no account. | Refused: no account with that email. | | |

## E. Leave the environment as you found it

### E1. Restore the defaults

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On **Platform settings**, set the window back to `24` and creation back to **Everyone signed in**, with the reason `restoring defaults after QA`. | Saved. | | |
| 2 | Read **Every change**. | Every change you made during this procedure is listed, newest first, each with its reason and your email. This is the record a verifier asks for. | | |
| 3 | Delete QA Onboarding Ltd as its owner, and end any support access you still hold. | Removed. | | |
