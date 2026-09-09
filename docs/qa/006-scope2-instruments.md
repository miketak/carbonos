# Procedure 6: Scope 2 instruments

**Objective.** Confirm that market-based scope 2 rests only on contractual
instruments that pass every Scope 2 Quality Criterion, that coverage and
period are applied line by line, and that the report discloses the
residual mix and the method either way.

**Covers** [spec 07.2](../../specs/07.2-required-disclosures.md),
[spec 07.3](../../specs/07.3-scope-2-instrument-coverage.md) and
[spec 07.6](../../specs/07.6-scope2-instrument-criteria-and-scope3-crosscheck.md).

**Estimated time:** 45 minutes.

**Run this procedure** before a release, and after any change to market
factors, the residual mix, the criteria or the scope 2 arithmetic.

## Prerequisites

- **2025 Operational** as procedure 5 leaves it, reopened as a draft, with
  R2 (48,500 MWh at S2) and R4 (210,000 kWh at S4) classified with the
  Ghana grid factor.
- A small PDF to attach as a retirement statement.

## A. Recording instruments

### A0. A negative factor is refused inline

1. On the instruments card, type -0.1 in **kg CO2e per kWh**, a source,
   and 20,000 MWh covered. Add.

**Expected result:** the form stays put, with "kg CO₂e per kWh must be 0
or more." under the factor; nothing is recorded and no toast appears. Clear
the factor.

Verdict: ☐ pass ☐ fail. Notes:

### A1. An instrument with a criterion unanswered is not applied

1. On the instruments card, add for S2: certificate, 0 kg CO2e/kWh,
   source "I-REC(E) Ghana 2025", covered 20,000 MWh, certificate
   IREC-GH-2025-0417, registry I-TRACK, vintage 2025, and answer criteria
   1, 2, 4, 5, 6, 7 and 8 as **Met**, leaving 3 unanswered.
2. Read the pre-flight.

**Expected result:** the row reads "Not applied: 1 unanswered" with the
eight outcomes listed. The **Emission factors** gate warns "1 of the eight
criteria not yet answered" and says the market-based figure falls back.

Verdict: ☐ pass ☐ fail. Notes:

### A2. Evidence attaches to an instrument

1. Click **Evidence** on the instrument and attach the PDF as the
   retirement statement.

**Expected result:** the file is listed with your email and the date.

Verdict: ☐ pass ☐ fail. Notes:

### A3. All eight met applies the instrument

1. Edit the instrument: answer criterion 3 **Met**, retirement date
   2026-01-15. Save.

**Expected result:** the row reads "All eight met" with the certificate,
registry, vintage and retirement date; the gate warning is gone.

Verdict: ☐ pass ☐ fail. Notes:

### A4. Coverage beyond the electricity warns

1. Edit the instrument's covered quantity to 60,000 MWh.

**Expected result:** the gate warns that the instrument covers more than
the facility's scope 2 electricity in its period. Set it back to 20,000.

Verdict: ☐ pass ☐ fail. Notes:

### A5. A record outside the instrument's period is uncovered

1. Set the instrument's period to 2025-01-01 to 2025-06-30.

**Expected result:** no error now; procedure 7 shows the July record priced
at the balance factor. Set the period back to blank.

Verdict: ☐ pass ☐ fail. Notes:

## B. The residual mix

### B1. The disclosure is required either way

1. Read the pre-flight before touching the residual mix.

**Expected result:** a warning that the inventory does not say whether a
residual mix is available.

Verdict: ☐ pass ☐ fail. Notes:

### B2. Not available

1. Choose **No residual mix is available** and save.

**Expected result:** the warning is gone; the report (procedure 7) prints
the double-counting disclosure and prices uncovered kWh at the grid
average.

Verdict: ☐ pass ☐ fail. Notes:

### B3. Available with a factor

1. Choose **Yes** with 0.52 kg CO2e/kWh and save.

**Expected result:** saved; a "yes" without a factor is refused.

Verdict: ☐ pass ☐ fail. Notes:

## C. Arithmetic (checked in procedure 7)

Freeze the inventory. Procedure 7 checks the figures this setup produces:

- S2: 20,000 MWh covered at 0, the balance 28,500 MWh at the residual mix
  0.52 → 14,820,000 kg market-based against 48,500,000 × 0.441 =
  21,388,500 kg location-based.
- S4: no instrument, 210,000 kWh at the residual mix 0.52 → 109,200 kg
  market-based against 92,610 kg location-based.

Write the two market-based figures here for procedure 7: ______ and ______.

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals:** registry lookups; more than one instrument per
facility and inventory.
