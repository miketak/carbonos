---
owner: miketak
last_reviewed: 2026-10-02
---

# Calculation vectors

The inventory calculation engine is checked against test vectors: known
inputs with hand-computed expected outputs, committed as
`backend/src/test/resources/ghg/calculation-vectors.json` and reproduced
through the engine's own code by the `*VectorsTest` classes under
`backend/src/test/java/com/carbonos/ghg/internal/`. This page is the format.
[Run the checks](../how-to/run-the-checks.md#the-calculation-vectors) says how
to run them and when to add one.

## The file

| Key | What it holds |
| --- | --- |
| `version` | The format version, `1`. |
| `notes` | The formulas and precisions in one paragraph, so a reader of the file alone knows how a figure was computed. |
| `gwpReference` | The global warming potentials the `source` lines rely on, per set (`AR5`, `AR6`): fossil and biogenic CH4, N2O, SF6, HFC-32, HFC-125. They repeat `GwpSet` for the reader; the tests use the enum. |
| `factors` | The factor library: every emission factor a vector names, keyed (`diesel`, `grid`, `r410a`, ...). |
| `lines` | Runs of records priced through `LineMath`: the shares, the conversion, every gas column, the market-based side, the derived category 3 lines, the run's totals. |
| `proRating`, `proRatingSums` | The days a frozen boundary covers of a record, and the period share they make; sums of adjacent windows. |
| `conversions` | A quantity in the factor's unit through `Conversion.of`. |
| `baseYear`, `baseYearShares` | Sequences of recalculation candidates and their running sum; a part of the base as a percentage. |
| `rounding` | One figure per rounding stage. |

Every vector carries `id` (stable, cited by the test name), `description`
(one line), `source` (the arithmetic that gives the expected figure, or the
published example it comes from, with any rounding it absorbs) and, where
there are inputs, `inputs` and `expected`. Decimals are strings, so
`"0.468809"` reaches the test with every digit; dates are ISO; enums are the
backend's constant names.

## Precisions

The expected figures are what the engine stores, not full-precision
arithmetic. The tests compare them with `compareTo`, except where noted.

| Figure | Precision | Where |
| --- | --- | --- |
| A line's kilograms (kg CO2e, each gas column, the market-based figure) | 3 decimals, half up | `LineMath.round` |
| The period share | 6 decimals, half up; exactly `1` when every day is covered | `LineMath.periodShare` |
| A converted quantity and its factor | DECIMAL64 (16 significant digits); the tests compare at 6 decimals | `Conversion.of` |
| A run's totals | The sum of the rounded lines, never a rounding of the sum | `GhgRun.addLine` |
| A base-year share | 2 decimals, half up | `BaseYearService.percentOfBase` |
| Tonnes on the report | 3 decimals, half up | `ReportResponse.tonnes` |

Two consequences the vectors spell out: a figure computed at full precision
can differ from the engine's by a rounding of the period share (`L04`: the
engine prints 134,093.26 where 134,093.151 is exact), and each gas column
rounds on its own, so the gas rows times their potentials foot to a diesel
line's total within about 0.15 kg at most (`L03`, `L04`, `L05`, `L16`).

## The factor library

A factor states its publication's figure and gas split the way `EmissionFactor`
holds them. A field left out is zero or null.

| Field | Meaning |
| --- | --- |
| `name`, `scope`, `category`, `unit` | The factor as the register lists it; the unit is a registered one (`litre`, `kWh`, `kg`, `tonne`, `US-gallon`). |
| `kgCo2ePerUnit` | The published CO2e, used as is when no gas split is stated. |
| `co2`, `ch4`, `n2o`, `sf6`, `biogenicCo2` | Kilograms of each gas per unit; `ch4Fossil` picks the fossil or biogenic CH4 potential. |
| `hfcsKg` | Kilograms of HFC per unit; with `blendComposition` (`HFC-32:0.5,HFC-125:0.5`) the CO2e is re-derived under the run's set, without it the published CO2e minus the CO2 stands and `blendGwpSource` names its basis. |
| `reportingBasis` | `OUTSIDE_SCOPES_NON_KYOTO` for a Montreal Protocol gas: priced on the line, counted in no total. |

## Line vectors

`inputs`:

| Field | Meaning |
| --- | --- |
| `gwpSet`, `approach`, `inventoryPeriod` | The inventory. |
| `residualMix` | `{available, kgCo2ePerKwh}`; absent means availability not stated. |
| `customUnits` | `[{code, base, factor}]`: a unit of the organization's own. |
| `instruments` | `[{facility, type, kgCo2ePerKwh, coveredKwh, periodStart, periodEnd, meetsQualityCriteria}]`: one contractual instrument per facility (spec 07.3). |
| `records[]` | `ref` (the record number; the line reads `ACT-0001`), `activityType`, `facility`, `quantity`, `unit`, `period`, `factor` (a library key), `coverage` (`share`, `coveredDays`, `totalDays`, what the frozen boundary would answer), `density` (`material`, `kgPerLitre`, `typical`), `upstreamRules` (`[{upstream, kind}]`, `WELL_TO_TANK` or `TRANSMISSION_AND_DISTRIBUTION`). |

The records are priced in the order listed, sharing one coverage map per
facility, so an instrument is consumed chronologically as the run does it.

`expected.records[]`, one per input record in the same order: `kgCo2e`,
`co2Kg`, `ch4Kg`, `n2oKg`, `hfcsKgCo2e`, `sf6Kg`, `biogenicCo2Kg`, `hfcsKg`,
`blendGwpSource`, `ch4Fossil`, `convertedQuantity`, `conversionFactor`,
`conversionNote`, `kgCo2ePerUnit`, `weight` (the accounting share),
`periodShare`, `periodNote`, `scope`, `category`, `reportingBasis`, `unsplit`
(a CO2e-only factor's line), `market` (`kgCo2e`, `instrument`, `coveredKwh`,
`balanceKwh`, `balanceBasis`, `note` or `noteStartsWith`; null on a scope 1
or 3 line) and `derived[]` (`upstream`, `kind`, `kgCo2e`, `co2Kg`, `scope`,
`category`, `note`, `conversionFactor`).

`expected.run`: `totalKgCo2e`, `scope1KgCo2e`, `scope2KgCo2e`,
`scope3KgCo2e`, `scope2MarketBasedKgCo2e`, `scope2MarketBasis`
(`GRID_AVERAGE` until an instrument or the residual mix is applied), `co2Kg`,
`ch4Kg`, `ch4FossilKg`, `n2oKg`, `hfcsKgCo2e`, `biogenicCo2Kg`,
`co2eUnsplitKg`, `activityCount` (lines, derived ones included),
`outsideScopesLines`, `assessmentReports` (the GWP sets the run cites) and
`gasFootingToleranceKg`.

After the figures, `RunInvariants.assertAll` checks what holds for every run:
the scopes sum to the total, the lines sum to the total, every share is in
[0, 1], every stored kilogram carries three decimals, the gas rows times
their potentials foot to the total within `gasFootingToleranceKg`, the
unsplit total is the sum of the unsplit lines, and the CSV has one row per
line.

## Pro-rating vectors

`inputs`: `inventoryPeriod`, `record` (its period), `windowFrom` and
`windowTo` (the entity's membership window; null for none). The test freezes a
boundary of one entity holding one facility with that window and asks it for
the record's coverage. `expected`: `days` (the record's), `coveredDays`,
`periodShare`, `periodNote` (the line's note, null when every day is
covered).

`proRatingSums`: `vectors` (ids) whose period shares must add up to
`expected`, for windows that meet.

## Conversion vectors

`inputs`: `quantity`, `from`, `to`, `density` and `customUnits` as above.
`expected`: `present` (whether the units convert at all), `convertedQuantity`
and `factor` (compared at six decimals), `note` (the conversion note as the
line prints it, with "typical value" for a typical density) and
`viaDensity`.

## Base-year vectors

`inputs`: `thresholdPercent`, `baseTotalKg` and `steps[]`, each `flag`
(`trigger`, `what`, and `affectedKg` over the base or `affectedPercent`
typed) or `decide` (`status` on the last flagged candidate). `expected.flags[]`
in flag order: `affectedPercent`, `cumulativePercent`, `aboveThreshold` and
the `reason` the candidate prints; `hasUnresolvedFlag` at the end.

The candidates are built outside a database, so `createdAt` is null and a
declined candidate counts as outstanding until a recalculation is recorded;
the sequences are written around one `RECALCULATED` decision for that reason.

`baseYearShares`: `partKg` and `baseKg` into `BaseYearService.percentOfBase`.

## Rounding vectors

`stage` picks the method: `LINE_KG` (`input`), `PERIOD_SHARE` (`coveredDays`,
`totalDays`), `BASE_YEAR_PERCENT` (`partKg`, `baseKg`), `TONNES` (`input`,
checked by `ReportResponseTonnesTest` in the `web.dto` package). The test
compares the value and its scale.

## Mirrors of the integration tests

Vectors whose `source` says "mirrors" pin the same figure an API integration
test pins end to end (2660 and 1064 for the shares, 100691.953 for US
gallons, 134093.26 and 1372.903 for pro-rating, 1549.6 for every gas column,
19235 and 22555 for a blend on AR5 and AR6, 596.1 and 153.48 for biomass,
882 and 491 for a certificate, 11,686,500 and 15,000,000 for an instrument
used up, 350 for the residual mix, 149600 outside the scopes, 4.76 and 9.52
for the base year). A change that moves one of them fails here in a second
and there in minutes, for the same reason.

## Later: the QA pack

The QA package imports committed JSON the same way (`with { type: 'json' }`),
so a scenario could create a vector's records and factors through the API and
assert the run against `expected`. Nothing does yet; the ids are stable and
the decimals plain so that stays open.
