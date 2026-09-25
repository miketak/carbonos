---
owner: miketak
last_reviewed: 2026-09-24
---

# Report exports

Every run offers four files from its page. They are generated from the
run's snapshot and never change afterwards.

<!-- sources: run-1-lines.csv, run-1-exclusions.csv, run-1-inputs.json and riverside-bottling-ltd-2025-run-1.pdf downloaded from Run 001 of FY2025 on 2026-09-24; RunDetailPage.tsx; specs 07.1, 07.2, 07.4 -->

## PDF report

`<organization>-<year>-run-<N>.pdf`, for example
`riverside-bottling-ltd-2025-run-1.pdf`. The sections are those of the
run page: 00 Report, 01 Company and organizational boundary, 02
Operational boundary, 03 Reporting period, 04 Emissions by scope, 05
Emissions by gas, 06 Biogenic CO₂, 6A Gases outside the scopes, 07 Base
year, 08 Methodology with the emission factors applied and the
data-quality table, 09 Exclusions, 10 Snapshot lines.

## Lines (CSV)

`run-<N>-lines.csv`: one row per line, including derived lines.

| Column group | Columns |
| --- | --- |
| Line identity | `line_id`, `derived_from_line_id`, `derived_kind`, `derived_note` |
| Record | `record_id`, `record_ref`, `activity_type`, `evidence_ref`, `evidence_files`, `period_start`, `period_end`, `period_note`, `stream` |
| Where | `facility_id`, `facility`, `legal_entity`, `country` |
| Classification | `scope`, `category`, `reporting_basis`, `lease_type`, `scope_justification`, `proxy_factor`, `proxy_justification` |
| Quantity and conversion | `quantity`, `unit`, `converted_quantity`, `conversion_factor`, `conversion_note`, `density_material`, `density_kg_per_litre` |
| Factor | `factor_id`, `factor`, `factor_unit`, `kg_co2e_per_unit`, `gwp_set` |
| Weighting | `accounting_share`, `period_days`, `covered_days`, `period_share` |
| Result | `kg_co2e`, `co2_kg`, `ch4_kg`, `ch4_fossil`, `n2o_kg`, `hfcs_kg`, `hfcs_kg_co2e`, `pfcs_kg`, `pfcs_kg_co2e`, `sf6_kg`, `nf3_kg`, `biogenic_co2_kg`, `co2e_unsplit_kg` |
| Market-based scope 2 | `market_based_kg_co2e`, `market_instrument`, `market_factor_kg_co2e_per_kwh`, `market_covered_kwh`, `market_balance_kwh`, `market_balance_basis`, `market_note` |
| Data quality | `data_quality`, `data_quality_tier`, `uncertainty_percent` |

`kg_co2e` is `converted_quantity × kg_co2e_per_unit × accounting_share ×
period_share`. Scopes read `SCOPE_1`, `SCOPE_2`, `SCOPE_3`; categories
read the product's codes such as `PURCHASED_ELECTRICITY`;
`market_balance_basis` reads `GRID_AVERAGE` or `RESIDUAL_MIX`.

## Exclusions (CSV)

`run-<N>-exclusions.csv`: one row per excluded record, with the columns
`record_id`, `record_ref`, `facility`, `activity_type`, `period_start`,
`period_end`, `quantity`, `unit`, `reason`, `detail`, `justification`,
`estimated_kg_co2e`, `estimate_state`, `gas`. A run with no exclusions
exports the header row alone.

## Frozen inputs (JSON)

`run-<N>-inputs.json`: everything the run computed from, apart from the
records themselves.

| Key | Contents |
| --- | --- |
| `runId`, `runNo`, `label` | The run. |
| `periodStart`, `periodEnd` | The reporting period. |
| `consolidationApproach` | `EQUITY_SHARE`, `FINANCIAL_CONTROL` or `OPERATIONAL_CONTROL`. |
| `gwpSet` | `AR5` or `AR6`. |
| `scope2MarketBasis` | `GRID_AVERAGE` or `RESIDUAL_MIX`. |
| `boundaryVersion` | The version (`versionNo`, `frozenBy`, `frozenAt`, reopen details), its `entries` (each entity with relationship, economic interest, operated and controlled flags, effective interest, chain, `accountingShare`, `table1Row`, window, override, exclusion, facilities) and its `exclusions`. |
| `factors` | One object per factor applied: `factorId`, `name`, `unit`, `gwpSet`, `kgCo2ePerUnit`, the gases (`co2`, `ch4`, `ch4Fossil`, `n2o`, `hfcsKg`, `pfcsKg`, `sf6`, `nf3`, `biogenicCo2`), `blendComposition`, `blendGwpSource`, `source`, `publicationYear`, `dataYear`, `packs`, `reportingBasis`, `sourceEdition`, `validFrom`, `approvedBy`, `selfApproved`. |
| `instruments` | The market-based instruments applied. |
| `residualMixAvailable`, `residualMixKgCo2ePerKwh` | The residual-mix answer. |

## Evidence index

**Activity data › Source documents › Download evidence index (CSV)**
lists every file and link across the organization with the record it
belongs to. It is not tied to a run.
