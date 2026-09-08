-- Spec 07.1: what Chapter 9 requires of a report. Factors carry per-gas
-- components and a biogenic CO2 component; lines and runs total each gas;
-- scope 2 is reported location-based and market-based; an inventory declares
-- its operational boundary.

-- 1. Per-gas components. CO2, CH4, N2O, SF6 and NF3 are kg of the gas per
--    unit and are turned into CO2e with the reporting GWP set; HFCs and PFCs
--    are blends whose GWP the source applied, so they are kg CO2e per unit.
--    Biogenic CO2 is reported outside the scopes.
ALTER TABLE ghg_emission_factors
    ADD COLUMN co2_kg_per_unit          numeric(12, 6) NOT NULL DEFAULT 0,
    ADD COLUMN ch4_kg_per_unit          numeric(12, 6) NOT NULL DEFAULT 0,
    ADD COLUMN n2o_kg_per_unit          numeric(12, 6) NOT NULL DEFAULT 0,
    ADD COLUMN hfcs_kg_co2e_per_unit    numeric(12, 6) NOT NULL DEFAULT 0,
    ADD COLUMN pfcs_kg_co2e_per_unit    numeric(12, 6) NOT NULL DEFAULT 0,
    ADD COLUMN sf6_kg_per_unit          numeric(12, 6) NOT NULL DEFAULT 0,
    ADD COLUMN nf3_kg_per_unit          numeric(12, 6) NOT NULL DEFAULT 0,
    ADD COLUMN biogenic_co2_kg_per_unit numeric(12, 6) NOT NULL DEFAULT 0;

-- Splits chosen so that CO2 + 28 CH4 + 265 N2O (AR5 GWP100) equals the
-- seeded CO2e exactly; under AR6 the CH4 and N2O terms shift.
UPDATE ghg_emission_factors SET co2_kg_per_unit = 2.040950, ch4_kg_per_unit = 0.000050, n2o_kg_per_unit = 0.000010 WHERE id = 'c4a1f001-0000-4000-8000-000000000001';
UPDATE ghg_emission_factors SET co2_kg_per_unit = 1.553790, ch4_kg_per_unit = 0.000020, n2o_kg_per_unit = 0.000010 WHERE id = 'c4a1f001-0000-4000-8000-000000000002';
UPDATE ghg_emission_factors SET co2_kg_per_unit = 2.630700, ch4_kg_per_unit = 0.000100, n2o_kg_per_unit = 0.000100 WHERE id = 'c4a1f001-0000-4000-8000-000000000003';
UPDATE ghg_emission_factors SET co2_kg_per_unit = 2.143150, ch4_kg_per_unit = 0.000200, n2o_kg_per_unit = 0.000050 WHERE id = 'c4a1f001-0000-4000-8000-000000000004';
UPDATE ghg_emission_factors SET hfcs_kg_co2e_per_unit = 2088.000000 WHERE id = 'c4a1f001-0000-4000-8000-000000000005';
UPDATE ghg_emission_factors SET co2_kg_per_unit = 0.441000 WHERE id = 'c4a1f001-0000-4000-8000-000000000006';
UPDATE ghg_emission_factors SET co2_kg_per_unit = 0.207000 WHERE id = 'c4a1f001-0000-4000-8000-000000000007';
UPDATE ghg_emission_factors SET co2_kg_per_unit = 0.171000 WHERE id = 'c4a1f001-0000-4000-8000-000000000008';
UPDATE ghg_emission_factors SET co2_kg_per_unit = 0.170000 WHERE id = 'c4a1f001-0000-4000-8000-000000000009';
UPDATE ghg_emission_factors SET co2_kg_per_unit = 0.195000 WHERE id = 'c4a1f001-0000-4000-8000-000000000010';
UPDATE ghg_emission_factors SET co2_kg_per_unit = 0.102000 WHERE id = 'c4a1f001-0000-4000-8000-000000000011';
UPDATE ghg_emission_factors SET co2_kg_per_unit = 12.200000, ch4_kg_per_unit = 15.500000 WHERE id = 'c4a1f001-0000-4000-8000-000000000012';
UPDATE ghg_emission_factors SET co2_kg_per_unit = 0.149000 WHERE id = 'c4a1f001-0000-4000-8000-000000000013';
UPDATE ghg_emission_factors SET co2_kg_per_unit = 170.000000 WHERE id = 'c4a1f001-0000-4000-8000-000000000014';
UPDATE ghg_emission_factors SET co2_kg_per_unit = 785.000000 WHERE id = 'c4a1f001-0000-4000-8000-000000000015';

-- a biomass fuel: its CO2 is biogenic and reported outside the scopes; only
-- the CH4 and N2O count toward the scopes
INSERT INTO ghg_emission_factors (id, name, default_scope, default_category, unit, kg_co2e_per_unit, source,
                                  scope_agnostic, ch4_kg_per_unit, n2o_kg_per_unit, biogenic_co2_kg_per_unit) VALUES
    ('c4a1f001-0000-4000-8000-000000000016', 'Wood pellets (biomass)', 'SCOPE_1', 'STATIONARY_COMBUSTION', 'tonne',
     14.990000, 'DEFRA 2025 (approx.)', true, 0.100000, 0.046000, 1800.000000);

-- 2. The inventory chooses the reporting GWP set and declares its operational
--    boundary: which scope 3 categories it covers and why others are left out.
ALTER TABLE ghg_inventories
    ADD COLUMN gwp_set varchar(5) NOT NULL DEFAULT 'AR5' CHECK (gwp_set IN ('AR5', 'AR6')),
    ADD COLUMN scope3_categories text,
    ADD COLUMN scope3_exclusions_rationale varchar(1000);

-- 3. Market-based scope 2: a contractual instrument per facility, per
--    inventory (the inventory carries the period).
CREATE TABLE ghg_market_factors (
    id               uuid PRIMARY KEY,
    inventory_id     uuid           NOT NULL REFERENCES ghg_inventories (id) ON DELETE CASCADE,
    facility_id      uuid           NOT NULL REFERENCES ghg_facilities (id) ON DELETE CASCADE,
    instrument_type  varchar(30)    NOT NULL
        CHECK (instrument_type IN ('SUPPLIER_SPECIFIC', 'CONTRACT', 'CERTIFICATE', 'RESIDUAL_MIX')),
    kg_co2e_per_kwh  numeric(12, 6) NOT NULL CHECK (kg_co2e_per_kwh >= 0),
    source           varchar(120)   NOT NULL,
    created_at       timestamptz    NOT NULL DEFAULT now(),
    updated_at       timestamptz    NOT NULL DEFAULT now(),
    UNIQUE (inventory_id, facility_id)
);

CREATE INDEX idx_ghg_market_factors_inventory ON ghg_market_factors (inventory_id);

-- 4. Runs and lines total each gas, biogenic CO2 and market-based scope 2.
ALTER TABLE ghg_runs
    ADD COLUMN gwp_set                     varchar(5)     NOT NULL DEFAULT 'AR5',
    ADD COLUMN co2_kg                      numeric(18, 3) NOT NULL DEFAULT 0,
    ADD COLUMN ch4_kg                      numeric(18, 3) NOT NULL DEFAULT 0,
    ADD COLUMN n2o_kg                      numeric(18, 3) NOT NULL DEFAULT 0,
    ADD COLUMN hfcs_kg_co2e                numeric(18, 3) NOT NULL DEFAULT 0,
    ADD COLUMN pfcs_kg_co2e                numeric(18, 3) NOT NULL DEFAULT 0,
    ADD COLUMN sf6_kg                      numeric(18, 3) NOT NULL DEFAULT 0,
    ADD COLUMN nf3_kg                      numeric(18, 3) NOT NULL DEFAULT 0,
    ADD COLUMN biogenic_co2_kg             numeric(18, 3) NOT NULL DEFAULT 0,
    ADD COLUMN scope2_market_based_kg_co2e numeric(18, 3);

ALTER TABLE ghg_run_lines
    ADD COLUMN co2_kg                        numeric(18, 3) NOT NULL DEFAULT 0,
    ADD COLUMN ch4_kg                        numeric(18, 3) NOT NULL DEFAULT 0,
    ADD COLUMN n2o_kg                        numeric(18, 3) NOT NULL DEFAULT 0,
    ADD COLUMN hfcs_kg_co2e                  numeric(18, 3) NOT NULL DEFAULT 0,
    ADD COLUMN pfcs_kg_co2e                  numeric(18, 3) NOT NULL DEFAULT 0,
    ADD COLUMN sf6_kg                        numeric(18, 3) NOT NULL DEFAULT 0,
    ADD COLUMN nf3_kg                        numeric(18, 3) NOT NULL DEFAULT 0,
    ADD COLUMN biogenic_co2_kg               numeric(18, 3) NOT NULL DEFAULT 0,
    ADD COLUMN market_based_kg_co2e          numeric(18, 3),
    ADD COLUMN market_factor_kg_co2e_per_kwh numeric(12, 6),
    ADD COLUMN market_instrument             varchar(30);

-- lines older than this change were all-CO2e with no split recorded; leave
-- their gas columns at zero rather than invent a split
