---
owner: miketak
last_reviewed: 2026-09-29
description: What CarbonOS says when the organization's details, members, legal entities or facilities refuse a change, what each message means, and what to do about it.
---

# Fix an organization settings problem

The messages you meet under **Settings**, **Legal entities** and
**Facilities**. Every message is quoted as the product prints it.

<!-- sources: troubleshooting/index.md (verified 2026-09-26); spec 01.4 (members), 01.8 (account numbers), 03.x (entities and facilities); strings checked on 2026-09-28 in DuplicateOrganizationNameException.java, OrganizationFormModal.tsx, OrganizationSettingsPage.tsx, MembersCard.tsx, useGhg.ts (useMemberMutation), GhgService.java (entity, facility, member and deletion refusals) -->

| You see | It means | Do this |
| --- | --- | --- |
| "An organization named '…' already exists: … (ORG-*NNNN*). Confirm to use the name anyway." | Another organization carries the name you typed. | Check its account number. If yours is a different organization, click **Create anyway** or **Save anyway**; otherwise change the name. |
| "'*Organization*' needs at least one owner." | Changing the role of the last owner, or removing them. | Make another member an owner first. |
| "'*Organization*' cannot be deleted while its records stand: … Publish records are kept: withdraw the final designation or supersede the published inventory first." | Deleting an organization that holds a final or published inventory. | Withdraw the final designation, or supersede the published inventory with a correction; a published record is never deleted. |
| "still has facilities. Move them to another entity before deleting it." | **Remove** on an entity with facilities. | Edit each facility's **Legal entity** first. |
| "a parent chain cannot loop." | **Held through** would make an entity its own ancestor. | Choose another parent. |
| "'*Facility*' has recorded activity data. Facts are the audit trail: remove or reassign its activity records before deleting the facility." | **Remove** on a facility with activity records. | Move the records to another facility under **Activity data**, or remove them with a reason. |
