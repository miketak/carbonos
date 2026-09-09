-- Spec 07.2: the disclosures Chapter 9, the 2013 amendment and the Scope 2
-- Guidance require that the report did not yet make.

-- 1. The mass of the HFC and PFC blends per unit, and the assessment report
--    whose potentials the source applied. The seeded R-410A factor is 1 kg of
--    refrigerant per kg leaked, at 2,088 kg CO2e (IPCC AR5 GWP100).
ALTER TABLE ghg_emission_factors
    ADD COLUMN hfcs_kg_per_unit numeric(12, 6) NOT NULL DEFAULT 0,
    ADD COLUMN pfcs_kg_per_unit numeric(12, 6) NOT NULL DEFAULT 0,
    ADD COLUMN blend_gwp_source varchar(20);
UPDATE ghg_emission_factors SET hfcs_kg_per_unit = 1, blend_gwp_source = 'AR5'
    WHERE id = 'c4a1f001-0000-4000-8000-000000000005';

ALTER TABLE ghg_runs
    ADD COLUMN hfcs_kg numeric(18, 3) NOT NULL DEFAULT 0,
    ADD COLUMN pfcs_kg numeric(18, 3) NOT NULL DEFAULT 0;
ALTER TABLE ghg_run_lines
    ADD COLUMN hfcs_kg numeric(18, 3) NOT NULL DEFAULT 0,
    ADD COLUMN pfcs_kg numeric(18, 3) NOT NULL DEFAULT 0,
    ADD COLUMN blend_gwp_source varchar(20),
    ADD COLUMN market_note varchar(255);
-- lines calculated before this change carried no mass for the blends; the
-- seeded blend is per kg, so its mass is the converted quantity
UPDATE ghg_run_lines SET hfcs_kg = ROUND(converted_quantity * weight, 3), blend_gwp_source = 'AR5'
    WHERE factor_name = 'Refrigerant R-410A leakage';
UPDATE ghg_runs r SET hfcs_kg = (SELECT COALESCE(SUM(l.hfcs_kg), 0) FROM ghg_run_lines l WHERE l.run_id = r.id);

-- 2. Purchased cooling is scope 2 (Chapter 4).
ALTER TABLE ghg_emission_factors DROP CONSTRAINT ghg_emission_factors_category_check;
ALTER TABLE ghg_emission_factors ADD CONSTRAINT ghg_emission_factors_category_check
    CHECK (default_category IN (
        'STATIONARY_COMBUSTION', 'MOBILE_COMBUSTION', 'PROCESS_EMISSIONS', 'FUGITIVE_EMISSIONS',
        'PURCHASED_ELECTRICITY', 'PURCHASED_HEAT_STEAM', 'PURCHASED_COOLING',
        'PURCHASED_GOODS_SERVICES', 'CAPITAL_GOODS', 'FUEL_ENERGY_RELATED', 'UPSTREAM_TRANSPORT',
        'WASTE_GENERATED', 'BUSINESS_TRAVEL', 'EMPLOYEE_COMMUTING', 'UPSTREAM_LEASED_ASSETS',
        'DOWNSTREAM_TRANSPORT', 'PROCESSING_SOLD_PRODUCTS', 'USE_SOLD_PRODUCTS',
        'END_OF_LIFE_SOLD_PRODUCTS', 'DOWNSTREAM_LEASED_ASSETS', 'FRANCHISES', 'INVESTMENTS'));
INSERT INTO ghg_emission_factors (id, name, default_scope, default_category, unit, kg_co2e_per_unit, source,
                                  scope_agnostic, co2_kg_per_unit) VALUES
    ('c4a1f001-0000-4000-8000-000000000017', 'District cooling', 'SCOPE_2', 'PURCHASED_COOLING', 'kWh',
     0.120000, 'DEFRA 2025 (approx.)', false, 0.120000);

-- 3. Scope 2 Quality Criteria and the residual mix. Instruments recorded
--    before this change were not assessed, and the note says so.
ALTER TABLE ghg_market_factors
    ADD COLUMN meets_quality_criteria boolean NOT NULL DEFAULT true,
    ADD COLUMN quality_notes varchar(500);
UPDATE ghg_market_factors SET quality_notes = 'Not assessed against the Scope 2 Quality Criteria before spec 07.2.';
ALTER TABLE ghg_inventories
    ADD COLUMN residual_mix_available boolean,
    ADD COLUMN residual_mix_kg_co2e_per_kwh numeric(12, 6) CHECK (residual_mix_kg_co2e_per_kwh IS NULL OR residual_mix_kg_co2e_per_kwh >= 0);

-- 4. Operations deliberately left out of a boundary, with a reason, and the
--    copy a version keeps of them.
CREATE TABLE ghg_boundary_exclusions (
    id           uuid PRIMARY KEY,
    inventory_id uuid         NOT NULL REFERENCES ghg_inventories (id) ON DELETE CASCADE,
    entity_id    uuid REFERENCES ghg_entities (id) ON DELETE CASCADE,
    facility_id  uuid REFERENCES ghg_facilities (id) ON DELETE CASCADE,
    reason       varchar(40)  NOT NULL
        CHECK (reason IN ('OUTSIDE_PERIOD', 'OUTSIDE_BOUNDARY', 'NON_GHG', 'DUPLICATE', 'NOT_APPLICABLE',
                          'METHODOLOGY', 'OTHER')),
    detail       varchar(500),
    created_at   timestamptz  NOT NULL DEFAULT now(),
    CHECK ((entity_id IS NULL) <> (facility_id IS NULL))
);
CREATE UNIQUE INDEX idx_ghg_boundary_exclusions_entity ON ghg_boundary_exclusions (inventory_id, entity_id)
    WHERE entity_id IS NOT NULL;
CREATE UNIQUE INDEX idx_ghg_boundary_exclusions_facility ON ghg_boundary_exclusions (inventory_id, facility_id)
    WHERE facility_id IS NOT NULL;

CREATE TABLE ghg_boundary_version_exclusions (
    id                  uuid PRIMARY KEY,
    boundary_version_id uuid         NOT NULL REFERENCES ghg_boundary_versions (id) ON DELETE CASCADE,
    entity_id           uuid         NOT NULL,
    entity_name         varchar(120) NOT NULL,
    facility_id         uuid,
    facility_name       varchar(120),
    reason              varchar(40)  NOT NULL,
    detail              varchar(500)
);
CREATE INDEX idx_ghg_boundary_version_exclusions_version ON ghg_boundary_version_exclusions (boundary_version_id);
