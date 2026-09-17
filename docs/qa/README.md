# QA procedures

Manual test procedures for CarbonOS, organized by **persona**: the kind of
company whose year the procedures walk through, with its own entities,
sites, streams, records and figures. A persona's pack is self-contained
and runs in order; the product under test is the same, the scenario is not.

| Persona | Company | What it exercises | Procedures |
| --- | --- | --- | --- |
| [Mining](mining/README.md) | Sankofa Gold plc, a Ghanaian gold producer | An open pit, a joint-venture processing plant, an associate's port loadout, a head office, an exploration camp and a leased warehouse; diesel, grid electricity, explosives, refrigerants and waste; the full workflow from access to base year | 001 to 011 |

Procedures 001 (access and roles) and 011 (platform administration) test
the platform rather than a company and are kept with the mining pack, which
is the first and, so far, the only one. A second persona starts by copying
the mining README, then writes its own scenario and procedures 002 to 010
against the same specs.

Each persona's README says what to prepare, how to read a procedure, and
where to record verdicts. `make qa-docs` exports a persona's procedures as
Google Docs (see the how-to "Publish the QA procedures").
