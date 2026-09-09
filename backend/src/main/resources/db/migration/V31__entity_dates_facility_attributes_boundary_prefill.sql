-- T-19, T-20, T-21 (audit findings F5, F7, F21, F47; spec 03.4): legal
-- entities carry effective dates, a jurisdiction and a financial-control
-- override; facilities carry a grid region, a type and lease flags; grid
-- factors carry the region they serve, so a facility's location-based factor
-- is suggested; the boundary is pre-populated from the approach.

-- 1. Legal entities: effective dates, jurisdiction, financial-control override.
ALTER TABLE ghg_entities
    ADD COLUMN effective_from             date,
    ADD COLUMN effective_to               date,
    ADD COLUMN jurisdiction               varchar(2),
    ADD COLUMN financial_control_override boolean,
    ADD COLUMN control_note               varchar(500);

-- the override is a decision the treatment and the version carry with the other facts
ALTER TABLE ghg_boundary_treatments ADD COLUMN financial_control_override boolean;
ALTER TABLE ghg_boundary_version_entries ADD COLUMN financial_control_override boolean;

-- 2. Facilities: grid region, type, lease flags.
ALTER TABLE ghg_facilities
    ADD COLUMN grid_region   varchar(40),
    ADD COLUMN facility_type varchar(30) CHECK (facility_type IN (
        'OFFICE', 'MINE', 'PROCESSING_PLANT', 'WAREHOUSE', 'PORT', 'CAMP', 'FLEET_DEPOT', 'CONSTRUCTION_SITE',
        'WELL_SITE', 'OTHER')),
    ADD COLUMN lease_type    varchar(30) CHECK (lease_type IN (
        'FINANCE_LEASE_IN', 'OPERATING_LEASE_IN', 'FINANCE_LEASE_OUT', 'OPERATING_LEASE_OUT')),
    ADD COLUMN lease_from    date,
    ADD COLUMN lease_to      date;

-- 3. Grid factors name the region they serve: ISO 3166-1 alpha-3 for a
--    national grid, "US-<subregion>" for an eGRID subregion.
ALTER TABLE ghg_emission_factors ADD COLUMN grid_region varchar(40);
UPDATE ghg_emission_factors SET grid_region = 'GHA' WHERE id = 'c4a1f001-0000-4000-8000-000000000006';
UPDATE ghg_emission_factors SET grid_region = 'GBR' WHERE id = 'c4a1f001-0000-4000-8000-000000000007';
UPDATE ghg_emission_factors SET grid_region = split_part(pack_code, ':', 3)
    WHERE pack = 'ember-grid-2025' AND pack_code LIKE 'EMBER:grid:%';
UPDATE ghg_emission_factors SET grid_region = 'US-' || split_part(split_part(pack_code, ':', 3), '_', 1)
    WHERE pack IN ('epa-hub-2025', 'sector-oil-and-gas', 'sector-construction', 'sector-mining')
      AND pack_code LIKE 'EPA:Electricity_US_eGRID_subregion%';
CREATE INDEX idx_ghg_emission_factors_grid_region ON ghg_emission_factors (grid_region) WHERE grid_region IS NOT NULL;

-- 4. A manual recalculation candidate can be weighed against a comparison run.
ALTER TABLE ghg_base_year_recalculations ADD COLUMN comparison_run_id uuid;
