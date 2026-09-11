# Procedure 1: Access and roles

**Objective.** Confirm that a newcomer can get an account through the
request flow, that an owner can add them to an organization with a role,
and that each role can do exactly what it allows and nothing more.

**Covers** [spec 01](../../specs/01-identity-and-access.md),
[spec 01.1](../../specs/01.1-access-requests.md) and
[spec 01.2](../../specs/01.2-organization-membership-and-roles.md).

**Estimated time:** 60 minutes.

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
| 2 | Add `nobody@example.test`. | Refused with "Account nobody@example.test was not found." | | |
| 3 | Add the Analyst a second time. | Refused as already a member. | | |

### B4. A preparer works but cannot publish

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In the normal window, sign in as the Analyst. Open Sankofa Gold plc. | The organization opens. | | |
| 2 | Add the facility **QA scratch site**, record one activity on it ("QA scratch diesel", 100 litre, any date in 2025), create the inventory **QA scratch** (2025, operational control) and freeze it. | Every write succeeds. | | |
| 3 | Launch a run (allowed for a preparer). | The run launches. | | |
| 4 | Click **Mark as final** on the run. | Refused with "This action needs the REVIEWER or OWNER role in the organization.". **Publish** stays disabled ("Designate a final run first") until a run is final, so a preparer never reaches it. | | |

Procedure 2 removes these three scratch objects before it builds the
scenario, so keep the names.

### B5. A verifier reads everything and changes nothing

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Sign in as the Auditor in another context and open the organization. | The organization opens. | | |
| 2 | Open the facility, the activity data and the inventory, including the run page of B4. | Every page opens. | | |
| 3 | Try to record an activity and to change the inventory. | The buttons are still shown; each write is refused on submit with "This action needs the PREPARER, REVIEWER or OWNER role in the organization." | | |

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

### B8. Platform administrators keep oversight

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As the admin, open the GHG home. | The admin sees every organization and can open Sankofa Gold plc; its overview's **Members** card reads "Your role: ADMIN" although the admin is not listed as a member. | | |

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals** (do not report as bugs): single sign-on, password reset
for existing users, email invitations to people without an account, rate
limiting on the public form.
