---
owner: miketak
last_reviewed: 2026-09-24
---

# Set platform settings

**Role needed:** platform Admin.

Two settings govern access to clients' inventories, so every change is
kept with its reason.

<!-- sources: AdminSettingsPage.tsx; spec 01.5; verified 2026-09-24 -->

## Steps

1. Open **Platform settings** in the console.
2. Set **Support access lasts**: "Hours, between 1 and 72. A grant keeps
   the window it was taken under, so changing this never moves access
   that is already live." The default is 24.
3. Set **Who may create an organization**: "Everyone signed in" or
   "Administrators only". "With administrators only, the form asks for
   the client account that becomes the owner, and the administrator is
   not made a member."
4. Fill **Reason for this change**: "At least 10 characters. It is kept
   with the change, and a verifier may ask to read it."
5. Click **Save settings**.

## What you see

**Every change** lists each saved change with who made it, when, and
the reason; until the first, "Nothing has been changed; the deployment
is running on the defaults." The dashboard summarises the current
values in one line: "Support access lasts 24 hours, and everyone signed
in may create an organization."

## What changed elsewhere

- New support grants take the new window; live grants keep theirs.
- With "Administrators only", **New organization** on **GHG
  accounting** is offered to administrators alone, and the form's
  **Owner's email** names the owner.
