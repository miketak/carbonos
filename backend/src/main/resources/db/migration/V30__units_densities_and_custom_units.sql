-- T-13 (audit finding F11; spec 02.2): densities convert mass to volume and
-- back, custom units are defined as multiples of a registered unit, and every
-- line prints the conversion it applied.

-- 1. Densities: a shared set of typical values (organization_id null) and
--    each organization's own, from supplier specifications.
CREATE TABLE ghg_densities (
    id              uuid PRIMARY KEY,
    organization_id uuid REFERENCES ghg_organizations (id) ON DELETE CASCADE,
    material        varchar(120)   NOT NULL,
    kg_per_litre    numeric(10, 5) NOT NULL CHECK (kg_per_litre > 0),
    source          varchar(500)   NOT NULL,
    note            varchar(500),
    created_at      timestamptz    NOT NULL DEFAULT now(),
    updated_at      timestamptz    NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_ghg_densities_org_material
    ON ghg_densities (COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(material));

INSERT INTO ghg_densities (id, organization_id, material, kg_per_litre, source, note) VALUES
    ('d3a1f001-0000-4000-8000-000000000001', NULL, 'Diesel',         0.84000, 'Typical mid-range density of automotive diesel at 15 C (0.82 to 0.85 kg per litre)', 'A planning value. Replace it with the density on the supplier''s certificate of analysis before a final run; the gate warns while a typical value is in use.'),
    ('d3a1f001-0000-4000-8000-000000000002', NULL, 'Petrol',         0.74500, 'Typical mid-range density of motor gasoline at 15 C (0.72 to 0.775 kg per litre)', 'A planning value. Replace it with the supplier''s specification before a final run.'),
    ('d3a1f001-0000-4000-8000-000000000003', NULL, 'LPG',            0.54000, 'Typical density of liquefied petroleum gas as a liquid (0.51 to 0.58 kg per litre, propane to butane)', 'A planning value. LPG is invoiced by mass in Ghana; prefer a factor per tonne where the pack carries one.'),
    ('d3a1f001-0000-4000-8000-000000000004', NULL, 'Kerosene',       0.80000, 'Typical density of kerosene and jet kerosene at 15 C (0.78 to 0.81 kg per litre)', 'A planning value. Replace it with the supplier''s specification before a final run.'),
    ('d3a1f001-0000-4000-8000-000000000005', NULL, 'Heavy fuel oil', 0.98000, 'Typical density of residual fuel oil at 15 C (0.94 to 1.01 kg per litre)', 'A planning value. Replace it with the supplier''s specification before a final run.'),
    ('d3a1f001-0000-4000-8000-000000000006', NULL, 'Biodiesel',      0.88000, 'Typical density of fatty acid methyl ester at 15 C (0.86 to 0.90 kg per litre)', 'A planning value. Replace it with the supplier''s specification before a final run.'),
    ('d3a1f001-0000-4000-8000-000000000007', NULL, 'Lubricating oil', 0.88000, 'Typical density of mineral lubricating oil at 15 C (0.85 to 0.90 kg per litre)', 'A planning value. Replace it with the supplier''s specification before a final run.');

-- 2. Custom units: a multiple of a registered unit, per organization.
CREATE TABLE ghg_custom_units (
    id              uuid PRIMARY KEY,
    organization_id uuid           NOT NULL REFERENCES ghg_organizations (id) ON DELETE CASCADE,
    code            varchar(30)    NOT NULL,
    label           varchar(120)   NOT NULL,
    base_unit       varchar(30)    NOT NULL,
    factor          numeric(18, 6) NOT NULL CHECK (factor > 0),
    created_at      timestamptz    NOT NULL DEFAULT now(),
    updated_at      timestamptz    NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_ghg_custom_units_org_code ON ghg_custom_units (organization_id, lower(code));

-- 3. The density a classification applies, and the conversion each line prints.
ALTER TABLE ghg_assignments ADD COLUMN density_id uuid REFERENCES ghg_densities (id) ON DELETE SET NULL;
ALTER TABLE ghg_run_lines
    ADD COLUMN density_material    varchar(120),
    ADD COLUMN density_kg_per_litre numeric(10, 5),
    ADD COLUMN conversion_note     varchar(500);
