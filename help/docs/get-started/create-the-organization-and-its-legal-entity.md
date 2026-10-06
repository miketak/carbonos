---
owner: miketak
last_reviewed: 2026-10-06
description: Create the Gye Nyame Gold Ltd organization, read its account number, and record its camp services subsidiary as a legal entity with its ownership facts.
role: Owner
minutes: 5
screens: [step-1-legal-entities.png]
---

# Create the organization and its legal entity

This first step of the Get started series produces the reporting organization, Gye Nyame Gold Ltd, and its one subsidiary, recorded with the ownership facts that every inventory's accounting share is computed from.

<!-- sources: specs 01.3, 01.8 (organizations and account numbers); spec 10 (the organizations table, the rail); specs 03.1 to 03.4 (legal entities); the old tutorial get-started/your-first-inventory.md (verified 2026-09-24); screen text and figures from the Gye Nyame Gold walkthrough of 2026-09-28 (replay-log.txt) -->

## Before you start

- You need an account. A platform administrator creates it, or approves the request you make from the landing page ([Request access](../access/request-access.md)). You sign in with your email address and a password.
- Nothing else. Creating an organization makes you its owner, and the owner can do every step of this series alone.

## Create the organization

1. Sign in. A member of no organization lands on the organizations list, which reads "No organizations yet" and offers **New organization**; from inside an organization, **All organizations** at the foot of the rail leads there.
2. Click **New organization**.
3. Fill **Name** with `Gye Nyame Gold Ltd`.
4. Fill **Address (optional)** with `Mine Site Road, Obuasi`. The dialog explains that it is "Printed in the report header as the reporting entity's address."
5. Leave **Contact (optional)** and **Owner's email (optional)** empty. Naming somebody else as owner makes them the owner and leaves you outside the organization.
6. Click **Create organization**.

What you see: the message "Gye Nyame Gold Ltd (ORG-0001) created." and a row for the organization with ORG-0001 under its name, reading "0 facilities in the boundary", with **Open** and **Settings**. The account number identifies the organization on the platform. Click **Open**. The **Overview** lists five numbered steps, from "Add your legal entities and facilities" to "Clear pre-flight and launch a run", and the dark rail on the left holds the pages this series visits, numbered as steps: **01 Legal entities**, **02 Facilities**, **03 Activity data** and **04 Inventories**, then **Emission factors**.

## Record the legal entity

Gye Nyame Gold Ltd is already listed under **Legal entities** as the reporting company, at 100% under every approach. The company also owns a subsidiary that runs the accommodation camp.

1. Open **Legal entities** and click **Add entity**.
2. On the **Add legal entity** page, fill **Name** with `Gye Nyame Camp Services Ltd`.
3. Leave **Relationship** as "Group company or subsidiary (financial control)" and **Economic interest (%)** at 100.
4. Fill **Legal ownership (%)** with `100`.
5. Leave **Operated by the company** ticked, **Financial control** as "Follows the Table 1 row", **Held through** as "Held directly by the reporting company", and the two dates empty.
6. Fill **Jurisdiction (optional)** with `GH`, the ISO 3166-1 alpha-2 code of the country of incorporation.
7. Click **Add entity**.

![The Legal entities table with Gye Nyame Gold Ltd as the reporting company and Gye Nyame Camp Services Ltd as a subsidiary, both at 100% in every share column](../assets/screens/step-1-legal-entities.png)

What you see: "Gye Nyame Camp Services Ltd added." The table has two rows. The new one reads "Subsidiary" with the jurisdiction "(GH)", operated "Yes", and 100% in each of the last three columns, **Equity share**, **Financial ctrl**, and **Operational ctrl**. Those columns are Table 1 of the GHG Protocol Corporate Standard applied to what you typed: the relationship and the approach together set the accounting share. That is why ownership and control are recorded once, here, rather than on each inventory.

## What you have

- An organization, Gye Nyame Gold Ltd, with the account number ORG-0001 and you as its owner.
- Two legal entities: the reporting company and Gye Nyame Camp Services Ltd, each at a 100% share under equity share, financial control and operational control.
- No facilities yet: the row still reads "0 facilities in the boundary". The next step adds them.
