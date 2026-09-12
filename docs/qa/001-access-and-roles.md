# Procedure 1: Access and roles

**Objective.** Confirm that a newcomer can get an account through the
request flow, that an owner can add them to an organization with a role,
and that each role can do exactly what it allows and nothing more.

**Covers** [spec 01](../../specs/01-identity-and-access.md),
[spec 01.1](../../specs/01.1-access-requests.md),
[spec 01.2](../../specs/01.2-organization-membership-and-roles.md),
[spec 01.3](../../specs/01.3-organization-confidentiality-and-deletion-safeguards.md)
and [spec 01.4](../../specs/01.4-role-aware-ui-and-visible-refusals.md).

**Estimated time:** 75 minutes.

**Run this procedure** before a release, and after any change to the `user`
or `mail` module, the members card, or the role checks in `ghg`.

## Prerequisites

- The ADMIN account and its password.
- Three fresh email aliases you can read: call them **Newcomer**,
  **Analyst** and **Auditor**.
- The normal window for the admin, the private window for the others.

Token expiry (the seven-day limit on set-password links) cannot be tested
on staging. The development team covers it.

## A. Request access

### A1. A visitor requests access

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In the private window, open the app signed out and click **Request access**. | The request form opens. | | |
| 2 | Enter a name, the Newcomer alias and a company. Submit. | A confirmation state. | | |
| 3 | Submit the same request again. | Refused as a duplicate, with the same wording whether the address has a request or an account (no user enumeration). | | |

### A2. The admin approves and the account appears at once

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In the normal window, sign in as the admin and open the access requests. | The Newcomer's request is listed. | | |
| 2 | Approve the Newcomer's request. | A toast confirms the approval and the setup email; the request leaves the queue (the card lists pending requests only, so it reads "No pending requests"). | | |
| 3 | Open the Users list. | The Newcomer is already listed with the state **Pending activation**. | | |

### A3. A pending account cannot sign in

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In the private window, try to sign in with the Newcomer alias and any password. | Sign-in is refused. | | |

### A4. The password rule is shown and enforced

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open the link from the approval email in the private window. | The page states the rule before you type: at least 12 characters, with a letter and a digit. The link is `https://frontend-staging-2e61.up.railway.app/set-password?token=…`, never localhost or production. | | |
| 2 | Try `shortpass1`, then `twelveletterslong`, then `123456789012`. | Each attempt is refused with an inline message. | | |

### A5. Setting the password activates the account

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Enter `Newcomer-pass-2026` twice and submit. | The Newcomer lands in the app signed in. The loader that plays after sign-in shows the wordmark, a progress bar and "Loading your workspace"; it makes no claim about verifying or calibrating anything, and a click skips it. | | |
| 2 | In the normal window, refresh the Users list. | The account now shows **Active**. | | |

### A6. The link is single-use and a bad token looks the same

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open the emailed link again in a fresh tab. | The "This link is invalid or has expired." state, with a way back to the landing page. | | |
| 2 | Open `/set-password?token=` followed by 64 zeros. | The same state as step 1. | | |

### A7. Admin-created accounts follow the same rule

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As the admin, create a user for the Analyst alias with the password `short1`. | Refused with the password rule under the field ("At least 12 characters, with a letter and a digit."). | | |
| 2 | Repeat with `Analyst-pass-2026`. | The account is created. | | |
| 3 | Repeat for the Auditor alias with `Auditor-pass-2026`. | The account is created. | | |

## B. Organizations and members

### B1. The creator is the owner and sees only their own organizations

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In the private window, signed in as the Newcomer, create the organization **Sankofa Gold plc**. | The GHG home lists only this organization. | | |
| 2 | Open its overview. | The overview lists the Newcomer under **Members** with the role OWNER. | | |

### B2. An outsider gets nothing

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Copy the organization's URL from the private window. | | | |
| 2 | In a third context (or the normal window signed in as the Analyst), open that URL. | A not-found state. The Analyst's GHG home says there are no organizations yet. | | |

### B3. Adding members by email

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As the Newcomer, on the members card, add the Analyst's email with the role **PREPARER** and the Auditor's email with the role **VERIFIER**. | The two members appear with their roles. | | |
| 2 | Add `nobody@example.test`. | Refused under the field with "No account with that email. Add the user under Manage users first. Ask a platform administrator to add them." The typed address stays in the field. | | |
| 3 | Add the Analyst a second time. | Refused as already a member. | | |

### B4. A preparer works but cannot publish

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In the normal window, sign in as the Analyst. Open Sankofa Gold plc. | The organization opens. | | |
| 2 | Add the facility **QA scratch site**, record one activity on it ("QA scratch diesel", 100 litre, any date in 2025), create the inventory **QA scratch** (2025, operational control) and freeze it. | Every write succeeds. | | |
| 3 | Launch a run (allowed for a preparer). | The run launches. | | |
| 4 | Look at **Mark as final** on the run. | The button is disabled with the tooltip "Needs the Reviewer or Owner role." (spec 05.5; a direct request is refused with "This action needs the REVIEWER or OWNER role in the organization."). **Publish** stays disabled ("Designate a final run first") until a run is final, so a preparer never reaches it. | | |
| 5 | Open the organization overview. | The members card has no form and no role selects: a preparer does not manage membership. | | |

Procedure 2 removes these three scratch objects before it builds the
scenario, so keep the names.

### B5. A verifier reads everything and changes nothing

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Sign in as the Auditor in another context and open the organization. | The organization opens. | | |
| 2 | Open the facility, the activity data and the inventory, including the run page of B4. | Every page opens, and each carries the banner "Your role in this organization is Verifier (read-only)." | | |
| 3 | Look at the activity register. | There is no **+ Add activity** and no **Import CSV**. Opening a record opens the drawer in read mode: facts, evidence and history, no fields and no **Save**. | | |
| 4 | Look at the legal entities, facilities, emission factors and units pages. | The add, edit and remove controls are either absent or disabled with the tooltip "Needs the Preparer, Reviewer or Owner role." | | |
| 5 | Look at the inventory page. | **Launch calculation run** is disabled with the tooltip "Needs the Preparer, Reviewer or Owner role."; **Mark as final** and **Publish** are disabled with "Needs the Reviewer or Owner role." | | |
| 6 | On the GHG home, look at the organization card. | **Edit** and **Delete** are disabled with "Needs the Owner role."; **New organization** stays available, because anyone may create their own. | | |

Exports are checked in procedure 7.

### B6. Roles change, the last owner stays

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As the Newcomer, change the Analyst's role to **REVIEWER**. | The role change applies at once and silently (no toast; the Analyst can now designate a final run). | | |
| 2 | Try to remove yourself. | Refused with "'Sankofa Gold plc' needs at least one owner.". | | |
| 3 | Try to change your own role to PREPARER. | Refused with the same message. | | |

### B7. Every act is attributed

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As the Newcomer, open the inventory the Analyst created and scroll to **History**. | The Analyst's email is on the freeze and on the run launch (the two inventory acts B4 performed); the Newcomer's email is on nothing they did not do. | | |

### B8. A platform administrator is an outsider until they assume support access

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As the admin, open the GHG home. | Sankofa Gold plc is not listed: the admin is not one of its members. | | |
| 2 | Paste the organization's URL into the address bar. | A not-found state, the same one an outsider gets. | | |
| 3 | Open **Organizations** from the admin header (`/admin/organizations`). | Sankofa Gold plc is listed with the Newcomer's email under Owners and its member count. No facility count, no totals, no inventory names. | | |
| 4 | Click **Assume access** and submit with the reason `short`. | The button stays disabled until the reason is at least 10 characters. | | |
| 5 | Type `ticket 4512, preparer cannot open the run` and confirm. | A toast confirms the access. The row shows the expiry and an **End access** action. | | |
| 6 | Open the GHG home. | Sankofa Gold plc is now listed with a **Support access** badge and opens. | | |
| 7 | On the organization, classify one record or change the header. | The act succeeds. | | |
| 8 | Open the organization overview and read the **Support access** card. | It names the admin's email, the time the access was taken, the reason, and the expiry; the history below lists "Support access assumed". | | |
| 9 | Look at the members card and at **Delete** on the organization card. | The members form and the role selects are absent, and **Delete** is disabled: support access never grants membership changes or deletion. | | |
| 10 | Back on `/admin/organizations`, click **End access**. | The GHG home no longer lists Sankofa Gold plc and its URL is not found again. | | |
| 11 | As the Newcomer, open the overview's **Support access** card. | The history lists "Support access assumed" and "Support access ended", each with the admin's email. | | |

### B9. An organization is not deleted while it has a published record

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As the Newcomer, create the throwaway organization **QA tombstone**. | It is created and the Newcomer is its owner. | | |
| 2 | On its card, click **Delete**. | The dialog asks for the organization's name typed exactly and a reason, and **Delete** stays disabled until both are given. | | |
| 3 | Type `qa tombstone` (lower case) and a reason of 10 characters or more. | **Delete** stays disabled: the name must match exactly. | | |
| 4 | Correct the name to `QA tombstone` and confirm. | The organization disappears from the list, and its URL is not found. | | |
| 5 | Create **QA tombstone** again. | Accepted: a removed name is released for reuse. Delete it again the same way. | | |
| 6 | On the card of Sankofa Gold plc, whose inventory procedures 7 and 8 publish, click **Delete**. | Once an inventory of it is published or final, the dialog lists it (for example "QA scratch: Published") and refuses with "Publish records are kept: withdraw the final designation or supersede the published inventory first." Skip this step on a first pass, before anything is published. | | |

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals** (do not report as bugs): single sign-on, password reset
for existing users, email invitations to people without an account, rate
limiting on the public form, restoring a deleted organization, an email to
the owners when support access is assumed, a support window other than 24
hours, and an owner revoking an administrator's active grant.
