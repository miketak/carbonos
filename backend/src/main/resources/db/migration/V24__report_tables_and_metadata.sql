-- T-08 (audit findings F39, F40, F43, F44; spec 07.4): breakdown tables,
-- a frozen factor set per run, and the report header.

-- 1. A facility's country; the reporting entity's address and contact.
ALTER TABLE ghg_facilities ADD COLUMN country varchar(2);
ALTER TABLE ghg_organizations
    ADD COLUMN address varchar(255),
    ADD COLUMN contact varchar(160);

-- 2. Lines snapshot the legal entity and country, so the breakdown tables
--    read the same after a facility moves or is renamed.
ALTER TABLE ghg_run_lines
    ADD COLUMN entity_id   uuid,
    ADD COLUMN entity_name varchar(120),
    ADD COLUMN country     varchar(2);
UPDATE ghg_run_lines l
SET entity_id = e.id, entity_name = e.name, country = f.country
FROM ghg_facilities f JOIN ghg_entities e ON e.id = f.entity_id
WHERE f.id = l.facility_id;

-- 3. Who launched a run, and the frozen factor set it applied.
ALTER TABLE ghg_runs ADD COLUMN created_by varchar(320);

CREATE TABLE ghg_run_factors (
    id                       uuid PRIMARY KEY,
    run_id                   uuid           NOT NULL REFERENCES ghg_runs (id) ON DELETE CASCADE,
    factor_id                uuid           NOT NULL,
    name                     varchar(120)   NOT NULL,
    unit                     varchar(30)    NOT NULL,
    gwp_set                  varchar(5)     NOT NULL,
    kg_co2e_per_unit         numeric(12, 6) NOT NULL,
    co2_kg_per_unit          numeric(12, 6) NOT NULL,
    ch4_kg_per_unit          numeric(12, 6) NOT NULL,
    ch4_fossil               boolean        NOT NULL,
    n2o_kg_per_unit          numeric(12, 6) NOT NULL,
    hfcs_kg_per_unit         numeric(12, 6) NOT NULL,
    pfcs_kg_per_unit         numeric(12, 6) NOT NULL,
    sf6_kg_per_unit          numeric(12, 6) NOT NULL,
    nf3_kg_per_unit          numeric(12, 6) NOT NULL,
    biogenic_co2_kg_per_unit numeric(12, 6) NOT NULL,
    blend_composition        varchar(255),
    blend_gwp_source         varchar(20),
    source                   varchar(120)   NOT NULL
);
CREATE INDEX idx_ghg_run_factors_run ON ghg_run_factors (run_id);

-- earlier runs: reconstruct the set from the library as it stands now, on the run's set
INSERT INTO ghg_run_factors (id, run_id, factor_id, name, unit, gwp_set, kg_co2e_per_unit, co2_kg_per_unit,
                             ch4_kg_per_unit, ch4_fossil, n2o_kg_per_unit, hfcs_kg_per_unit, pfcs_kg_per_unit,
                             sf6_kg_per_unit, nf3_kg_per_unit, biogenic_co2_kg_per_unit, blend_composition,
                             blend_gwp_source, source)
SELECT gen_random_uuid(), used.run_id, f.id, f.name, f.unit, used.gwp_set, used.kg_co2e_per_unit,
       f.co2_kg_per_unit, f.ch4_kg_per_unit, f.ch4_fossil, f.n2o_kg_per_unit, f.hfcs_kg_per_unit,
       f.pfcs_kg_per_unit, f.sf6_kg_per_unit, f.nf3_kg_per_unit, f.biogenic_co2_kg_per_unit,
       f.blend_composition, f.blend_gwp_source, f.source
FROM (SELECT DISTINCT l.run_id, l.factor_name, r.gwp_set, l.kg_co2e_per_unit
      FROM ghg_run_lines l JOIN ghg_runs r ON r.id = l.run_id) used
JOIN ghg_emission_factors f ON f.name = used.factor_name;

-- 4. The report header: approver, publisher, assurance; intensity denominators.
ALTER TABLE ghg_inventories
    ADD COLUMN approved_by         varchar(160),
    ADD COLUMN published_by        varchar(320),
    ADD COLUMN assurance_level     varchar(12) NOT NULL DEFAULT 'UNVERIFIED'
        CHECK (assurance_level IN ('UNVERIFIED', 'LIMITED', 'REASONABLE')),
    ADD COLUMN assurance_provider  varchar(160),
    ADD COLUMN assurance_statement varchar(255);

CREATE TABLE ghg_intensity_metrics (
    id           uuid PRIMARY KEY,
    inventory_id uuid           NOT NULL REFERENCES ghg_inventories (id) ON DELETE CASCADE,
    name         varchar(120)   NOT NULL,
    value        numeric(18, 3) NOT NULL CHECK (value > 0),
    unit         varchar(30)    NOT NULL
);
CREATE INDEX idx_ghg_intensity_metrics_inventory ON ghg_intensity_metrics (inventory_id);
