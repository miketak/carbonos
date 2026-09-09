-- T-01 (audit findings F31, F34; spec 07.3): a contractual instrument applies
-- to the kWh it covers over the period it covers, the balance takes the
-- residual mix or the grid average, and every run reports scope 2 both ways.

-- 1. Coverage on instruments. Rows older than this change have no covered
--    quantity and keep covering every kWh, as they did.
ALTER TABLE ghg_market_factors
    ADD COLUMN covered_kwh  numeric(18, 3) CHECK (covered_kwh IS NULL OR covered_kwh > 0),
    ADD COLUMN period_start date,
    ADD COLUMN period_end   date,
    ADD CONSTRAINT chk_ghg_market_factors_period
        CHECK (period_start IS NULL OR period_end IS NULL OR period_start <= period_end);

-- 2. The split on each line: covered kWh at the instrument, balance kWh at
--    the residual mix or the grid average.
ALTER TABLE ghg_run_lines
    ADD COLUMN market_covered_kwh             numeric(18, 3),
    ADD COLUMN market_balance_kwh             numeric(18, 3),
    ADD COLUMN market_balance_kg_co2e_per_kwh numeric(12, 6),
    ADD COLUMN market_balance_basis           varchar(20)
        CHECK (market_balance_basis IS NULL OR market_balance_basis IN ('RESIDUAL_MIX', 'GRID_AVERAGE'));

-- 3. Every run carries a market-based figure and says what it rests on.
--    Runs without instruments reported location-based only; their
--    market-based figure is the location-based one on the grid-average basis,
--    the proxy the Scope 2 Guidance allows where no residual mix is published.
ALTER TABLE ghg_runs
    ADD COLUMN scope2_market_basis varchar(20) NOT NULL DEFAULT 'GRID_AVERAGE'
        CHECK (scope2_market_basis IN ('INSTRUMENTS', 'RESIDUAL_MIX', 'GRID_AVERAGE'));
UPDATE ghg_runs SET scope2_market_basis = 'INSTRUMENTS' WHERE scope2_market_based_kg_co2e IS NOT NULL;
UPDATE ghg_runs SET scope2_market_based_kg_co2e = scope2_kg_co2e WHERE scope2_market_based_kg_co2e IS NULL;
ALTER TABLE ghg_runs ALTER COLUMN scope2_market_based_kg_co2e SET NOT NULL;
