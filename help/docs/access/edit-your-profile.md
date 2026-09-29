---
owner: miketak
last_reviewed: 2026-09-28
description: Open the account menu, change the display name CarbonOS shows for you, add a profile picture, and see what the menu offers and what the profile page does not change.
role: Anyone
minutes: 2
---

# Edit your profile

Your profile is the display name and picture CarbonOS shows for your account. Edit it when your name changes, or when you want a picture where your initial is now.

<!-- sources: tasks/account/request-access-and-set-your-password.md (verified 2026-09-27); spec 01.6; AccountMenu.tsx (the menu's items); ProfilePage.tsx (labels, hint, toasts); useProfile.ts; OrganizationMember.java (the name recorded on a membership); ProfileController.java and UserAdminController.java (no password change endpoint) -->

## Before you start

- You are signed in. Every account has a profile, whatever its role.

## Open the account menu

1. Click your initial or picture at the top right of any page. The menu opens with your email at its head.
2. Read what it offers: **Edit profile**, **Help**, which opens the help centre in a new tab, and **Sign out**. An administrator also sees **Administration**, outside the console.
3. Click **Edit profile**.

What you see: the page **Edit profile** with your picture or initial, your **Email**, which cannot be edited, and **Display name**.

## Change your display name

1. Fill **Display name** with the name you want colleagues to read.
2. Click **Save changes**.

What you see: the toast "Profile updated". The new name appears in the account menu at once. An organization's history keeps recording your acts under your email, which never changes, and the **Members** card of an organization shows the name recorded when you were added to it.

## Add or change your picture

1. Click **Upload picture**, or **Change picture** when one is set. The hint reads "PNG, JPEG, or WebP · up to 5 MB".
2. Choose the file.

What you see: the toast "Profile picture updated" and the picture in place of your initial, on the page and in the menu. A file of another type, or over the limit, is refused under the button.

## What the profile does not change

The profile page has no password field, and CarbonOS has no other page that changes or resets a password: an account keeps the password set from the approval link, or the temporary one an administrator handed over. Your email cannot be changed by anyone ("Email cannot be changed."); your platform role is set by a platform administrator under **Users**, and your role in an organization by its owner under the organization's **Settings**. See [Check what your role may do](check-what-your-role-may-do.md).
