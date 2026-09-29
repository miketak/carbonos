---
owner: miketak
last_reviewed: 2026-09-28
description: The four files a run exports, their names, every column of the lines and exclusions CSV files, and every key of the frozen inputs JSON.
role: Verifier
---

# Understand the export files

Every run offers four files from its page, generated from its snapshot and unchanged afterwards.

<!-- sources: specs 07.1, 07.2, 07.4, 07.5 and 07.7; spec 01.8 (account numbers); old page reference/report-exports.md (files downloaded from a run on 2026-09-24); backend/src/main/java/com/carbonos/ghg/internal/export/RunCsv.java (columns in file order, verified 2026-09-28); backend/src/main/java/com/carbonos/ghg/internal/web/ExportController.java (file names, the FrozenInputs record); backend/src/main/java/com/carbonos/ghg/internal/web/dto/ReportResponse.java (FactorRow), BoundaryVersionResponse.java, BoundaryVersionSummaryResponse.java, BoundaryVersionEntryResponse.java, BoundaryExclusionResponse.java; backend/src/main/java/com/carbonos/ghg/internal/Scope2MarketBasis.java, GwpSet.java, ConsolidationApproach.java; file names from the Gye Nyame Gold walkthrough of 2026-09-28 (replay-log.txt): "8 downloads" -->

| Link on the run page | File | Holds |
| --- | --- | --- |
| **PDF report** | `<organization>-org-<account number>-<period>-run-<N>.pdf` | The report as issued. |
| **Lines (CSV)** | `run-<N>-lines.csv` | One row per line. |
| **Exclusions (CSV)** | `run-<N>-exclusions.csv` | One row per excluded record. |
| **Frozen inputs (JSON)** | `run-<N>-inputs.json` | Everything the run computed from, apart from the records. |

## PDF report

For Run 001 of Gye Nyame Gold the file is `gye-nyame-gold-ltd-org-0001-2025-run-1.pdf`. Its sections are those of the run page; see [Fill the report header and read the report](fill-the-report-header-and-read-the-report.md).

## Lines CSV

One row per line, derived lines included: UTF-8, a header row, plain decimals. The columns, in file order:

| Column group | Columns |
| --- | --- |
| Line identity | `line_id`, `derived_from_line_id`, `derived_kind` |
| Record | `record_id`, `record_ref` |
| Where | `facility_id`, `facility`, `legal_entity`, `country` |
| Activity and period | `activity_type`, `evidence_ref`, `period_start`, `period_end` |
| Classification | `scope`, `category`, `reporting_basis`, `lease_type` |
| Quantity and factor | `quantity`, `unit`, `factor_id`, `factor`, `factor_unit`, `converted_quantity`, `conversion_factor`, `kg_co2e_per_unit`, `gwp_set` |
| Weighting | `accounting_share`, `period_days`, `covered_days`, `period_share` |
| Result | `kg_co2e`, `co2_kg`, `ch4_kg`, `ch4_fossil`, `n2o_kg`, `hfcs_kg`, `hfcs_kg_co2e`, `pfcs_kg`, `pfcs_kg_co2e`, `sf6_kg`, `nf3_kg`, `biogenic_co2_kg`, `co2e_unsplit_kg` |
| Market-based scope 2 | `market_based_kg_co2e`, `market_instrument`, `market_factor_kg_co2e_per_kwh`, `market_covered_kwh`, `market_balance_kwh`, `market_balance_basis`, `market_note` |
| Notes and justifications | `period_note`, `stream`, `scope_justification`, `proxy_factor`, `proxy_justification` |
| Data quality | `data_quality`, `data_quality_tier`, `uncertainty_percent` |
| Evidence, density and derivation | `evidence_files`, `density_material`, `density_kg_per_litre`, `conversion_note`, `derived_note` |

- `kg_co2e` is `converted_quantity × kg_co2e_per_unit × accounting_share × period_share`; a year-end pro-rated record shows the split in `period_days` and `covered_days`.
- `scope` reads `SCOPE_1`, `SCOPE_2` or `SCOPE_3`; `category` reads codes such as `PURCHASED_ELECTRICITY`; `reporting_basis` reads `SCOPES`, or `OUTSIDE_SCOPES_NON_KYOTO` for a line no scope total includes.
- `co2e_unsplit_kg` is the line's kg CO₂e when its factor published no gas split, else 0; the report's row "CO₂e from factors without a gas split" sums it.
- `derived_from_line_id`, `derived_kind` and `derived_note` are filled on a category 3 line an upstream rule derived, else empty.
- `market_balance_basis` reads `GRID_AVERAGE` or `RESIDUAL_MIX` for the kilowatt-hours no instrument covered; `market_note` says it in words.
- `ch4_fossil` and `proxy_factor` read `true` or `false`.

## Exclusions CSV

One row per excluded record, with the columns `record_id`, `record_ref`, `facility`, `activity_type`, `period_start`, `period_end`, `quantity`, `unit`, `reason`, `detail`, `justification`, `estimated_kg_co2e`, `estimate_state` and `gas`. `estimated_kg_co2e` is empty for a record not estimated and `0` for one stated to emit nothing.

An operation left out of the boundary is not a record exclusion: it is under `boundaryVersion.exclusions` in the frozen inputs and in section 01 of the report.

## Frozen inputs JSON

| Key | Contents |
| --- | --- |
| `runId`, `runNo`, `label` | The run. |
| `periodStart`, `periodEnd` | The reporting period. |
| `consolidationApproach` | `EQUITY_SHARE`, `FINANCIAL_CONTROL` or `OPERATIONAL_CONTROL`. |
| `gwpSet` | `AR5` or `AR6`. |
| `scope2MarketBasis` | `INSTRUMENTS`, `RESIDUAL_MIX` or `GRID_AVERAGE`: what the market-based figure rests on. |
| `boundaryVersion` | `version` (`id`, `versionNo`, `consolidationApproach`, entity and facility counts, `frozenBy`, `frozenAt`, and `reopenedBy`, `reopenedAt`, `reopenReason` where it was reopened), `entries` (each entity with `relationshipType`, `economicInterestPercent`, `operatedByCompany`, `controlledByCompany`, `effectiveEconomicInterestPercent`, `chain`, `accountingShare`, `table1Row`, `effectiveFrom`, `effectiveTo`, `financialControlOverride`, `excluded`, `exclusionReason` and `facilities`) and `exclusions` (entity, facility, `reason`, `detail`). |
| `factors` | One object per factor applied: `factorId`, `name`, `unit`, `gwpSet`, `kgCo2ePerUnit`, the gases (`co2`, `ch4`, `ch4Fossil`, `n2o`, `hfcsKg`, `pfcsKg`, `sf6`, `nf3`, `biogenicCo2`), `blendComposition`, `blendGwpSource`, `source`, `publicationYear`, `dataYear`, `packs`, `reportingBasis`, `sourceEdition`, `validFrom`, `approvedBy`, `selfApproved`. |
| `instruments` | The market-based instruments applied. |
| `residualMixAvailable`, `residualMixKgCo2ePerKwh` | The residual-mix answer. |

The release of a factor set is in each factor's `source`, `publicationYear`, `dataYear`, `packs` and `sourceEdition`; Run 001 lists five factors from the packs `defra-2025` and `ghana`.

## Evidence index

The evidence index is not tied to a run: **Activity data › Source documents › Download evidence index (CSV)** lists every file and link across the organization with its record.
