# QA procedures

Manual test procedures for CarbonOS, organized by **persona**: the kind of
company whose year the procedures walk through, with its own entities,
sites, streams, records and figures. A persona's pack is self-contained
and runs in order; the product under test is the same, the scenario is not.

| Persona | Company | What it exercises | Procedures |
| --- | --- | --- | --- |
| [Mining](mining/README.md) | Sankofa Gold plc, a Ghanaian gold producer | An open pit, a joint-venture processing plant, an associate's port loadout, a head office, an exploration camp and a leased warehouse; diesel, grid electricity, explosives, refrigerants and waste; the full workflow from access to base year | 001 to 011 |
| [Governance](governance/README.md) | Adansi Foods Ltd, a small Ghanaian food processor | Three entities, three sites, ten records from a fixture file; one object per rule: every refusal, warning, notice and record from the first account to a designated base year, with the least typing; the pack lifecycle from a cloned edition to the run that cites it | 001 to 008 |

The mining pack proves the arithmetic of a full year; the governance pack
proves the rules with the minimum that makes each one fire. Procedures 001
(access and roles) and 011 (platform administration) of the mining pack
test the platform rather than a company; the governance pack carries its
own platform cases in its procedures 001 and 007. A further persona starts
by copying a README, then writes its own scenario and procedures against
the same specs.

Each persona's README says what to prepare, how to read a procedure, and
where to record verdicts. `make qa-docs` exports a persona's procedures as
Google Docs (see the how-to "Publish the QA procedures").
