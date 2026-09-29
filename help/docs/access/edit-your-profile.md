---
owner: miketak
last_reviewed: 2026-09-29
description: Open the account menu, change the display name CarbonOS shows for you, add a profile picture, change your password, and see what the profile page does not change.
role: Anyone
minutes: 2
---

# Edit your profile

Your profile is the display name and picture CarbonOS shows for your account, and the place to change your password. Edit it when your name changes, when you want a picture where your initial is now, or when you replace a password.

<!-- sources: tasks/account/request-access-and-set-your-password.md (verified 2026-09-27); spec 01.6; AccountMenu.tsx (the menu's items); ProfilePage.tsx (labels, hint, toasts); useProfile.ts; GhgService.java (the member list reads the account's current name; OrganizationMember.java keeps the name recorded on a membership); spec 01.9, ChangePasswordSection.tsx (labels, refusals, toast) and PasswordService.java (the other sessions end, the email) -->

## Before you start

- You are signed in. Every account has a profile, whatever its role.

## Open the account menu

1. Click your initial or picture at the top right of any page. The menu opens with your email at its head.
2. Read what it offers: **Edit profile**, **Help**, which opens the help centre in a new tab, and **Sign out**. An administrator also sees **Administration**, outside the console.
3. Click **Edit profile**.

What you see: the page **Edit profile** with your picture or initial, your **Email**, which cannot be edited, **Display name**, and the section **Change password**.

## Change your display name

1. Fill **Display name** with the name you want colleagues to read.
2. Click **Save changes**.

What you see: the toast "Profile updated". The new name appears in the account menu at once. An organization's history keeps recording your acts under your email, which never changes, and the **Members** card of each organization shows the new name.

## Add or change your picture

1. Click **Upload picture**, or **Change picture** when one is set. The hint reads "PNG, JPEG, or WebP · up to 5 MB".
2. Choose the file.

What you see: the toast "Profile picture updated" and the picture in place of your initial, on the page and in the menu. A file of another type, or over the limit, is refused under the button.

## Change your password

1. Under **Change password**, fill **Current password**.
2. Fill **New password**: "At least 12 characters, with a letter and a digit."
3. Fill **Confirm new password** with the same value, then click **Change password**.

What you see: the toast "Password changed. Your other sessions are signed out." You stay signed in on this page, and CarbonOS emails you "Your CarbonOS password was changed". A wrong current password is refused under its field with "The current password is not correct."; the old password again, with "Choose a password different from your current one."; a different confirmation, with "Passwords do not match." If you no longer know the current password, see [Reset a forgotten password](reset-a-forgotten-password.md).

## What the profile does not change

Your email cannot be changed by anyone ("Email cannot be changed."); your platform role is set by a platform administrator under **Users**, and your role in an organization by its owner under the organization's **Settings**. See [Check what your role may do](check-what-your-role-may-do.md).
