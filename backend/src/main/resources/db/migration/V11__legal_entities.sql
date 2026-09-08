-- Spec 03.1: legal entities and Table 1. The organization consolidates legal
-- entities, not sites: each facility belongs to one entity, and the entity
-- carries the relationship type and economic interest that Table 1 of the
-- Corporate Standard turns into an accounting share under each approach.

-- 1. Entities. Every organization has exactly one "reporting company" entity
--    (the company itself, wholly owned) that facilities default to.
CREATE TABLE ghg_entities (
    id                        uuid PRIMARY KEY,
    organization_id           uuid          NOT NULL REFERENCES ghg_organizations (id) ON DELETE CASCADE,
    name                      varchar(120)  NOT NULL,
    relationship_type         varchar(30)   NOT NULL
        CHECK (relationship_type IN ('WHOLLY_OWNED', 'JOINT_VENTURE', 'NON_INCORPORATED_JV',
                                     'ASSOCIATE', 'FIXED_ASSET_INVESTMENT')),
    economic_interest_percent numeric(5, 2) NOT NULL
        CHECK (economic_interest_percent >= 0 AND economic_interest_percent <= 100),
    legal_ownership_percent   numeric(5, 2)
        CHECK (legal_ownership_percent IS NULL
               OR (legal_ownership_percent >= 0 AND legal_ownership_percent <= 100)),
    operated_by_company       boolean       NOT NULL,
    reporting_company         boolean       NOT NULL DEFAULT false,
    created_at                timestamptz   NOT NULL DEFAULT now(),
    updated_at                timestamptz   NOT NULL DEFAULT now(),
    UNIQUE (organization_id, name)
);

CREATE INDEX idx_ghg_entities_organization ON ghg_entities (organization_id);
CREATE UNIQUE INDEX idx_ghg_entities_reporting_company
    ON ghg_entities (organization_id) WHERE reporting_company;

INSERT INTO ghg_entities (id, organization_id, name, relationship_type, economic_interest_percent,
                          legal_ownership_percent, operated_by_company, reporting_company)
SELECT gen_random_uuid(), o.id, o.name, 'WHOLLY_OWNED', 100, 100, true, true
FROM ghg_organizations o;

-- 2. Facilities whose facts differed from "wholly owned" get an entity of
--    their own so their shares are preserved as closely as Table 1 allows:
--    financial control maps to a wholly owned operation, an operated but not
--    financially controlled site to a jointly controlled JV the company
--    operates, and a site with neither control to an associate.
INSERT INTO ghg_entities (id, organization_id, name, relationship_type, economic_interest_percent,
                          legal_ownership_percent, operated_by_company, reporting_company)
SELECT gen_random_uuid(),
       f.organization_id,
       f.name,
       CASE
           WHEN f.financial_control   THEN 'WHOLLY_OWNED'
           WHEN f.operational_control THEN 'JOINT_VENTURE'
           ELSE 'ASSOCIATE'
       END,
       f.equity_share_percent,
       f.equity_share_percent,
       f.operational_control,
       false
FROM ghg_facilities f
WHERE NOT (f.equity_share_percent = 100 AND f.financial_control AND f.operational_control)
ON CONFLICT (organization_id, name) DO NOTHING;

ALTER TABLE ghg_facilities ADD COLUMN entity_id uuid REFERENCES ghg_entities (id);

UPDATE ghg_facilities f
SET entity_id = COALESCE(
        (SELECT e.id FROM ghg_entities e
         WHERE e.organization_id = f.organization_id AND e.name = f.name AND NOT e.reporting_company
           AND NOT (f.equity_share_percent = 100 AND f.financial_control AND f.operational_control)),
        (SELECT e.id FROM ghg_entities e
         WHERE e.organization_id = f.organization_id AND e.reporting_company));

ALTER TABLE ghg_facilities
    ALTER COLUMN entity_id SET NOT NULL,
    DROP COLUMN equity_share_percent,
    DROP COLUMN financial_control,
    DROP COLUMN operational_control;

CREATE INDEX idx_ghg_facilities_entity ON ghg_facilities (entity_id);

-- 3. Boundary treatments are re-keyed by entity, with the facilities included
--    beneath. Pre-existing per-facility treatments and version entries are not
--    migrated (as V6 did for pre-1.0 runs): draft boundaries are redrawn, and
--    versions cut before this change keep their header rows only.
DROP TABLE ghg_boundary_treatments;

CREATE TABLE ghg_boundary_treatments (
    id                        uuid PRIMARY KEY,
    inventory_id              uuid          NOT NULL REFERENCES ghg_inventories (id) ON DELETE CASCADE,
    entity_id                 uuid          NOT NULL REFERENCES ghg_entities (id) ON DELETE CASCADE,
    relationship_type         varchar(30)   NOT NULL
        CHECK (relationship_type IN ('WHOLLY_OWNED', 'JOINT_VENTURE', 'NON_INCORPORATED_JV',
                                     'ASSOCIATE', 'FIXED_ASSET_INVESTMENT')),
    economic_interest_percent numeric(5, 2) NOT NULL
        CHECK (economic_interest_percent >= 0 AND economic_interest_percent <= 100),
    operated_by_company       boolean       NOT NULL,
    created_at                timestamptz   NOT NULL DEFAULT now(),
    updated_at                timestamptz   NOT NULL DEFAULT now(),
    UNIQUE (inventory_id, entity_id)
);

CREATE INDEX idx_ghg_boundary_treatments_inventory ON ghg_boundary_treatments (inventory_id);

CREATE TABLE ghg_boundary_facilities (
    id           uuid PRIMARY KEY,
    treatment_id uuid NOT NULL REFERENCES ghg_boundary_treatments (id) ON DELETE CASCADE,
    facility_id  uuid NOT NULL REFERENCES ghg_facilities (id) ON DELETE CASCADE,
    UNIQUE (treatment_id, facility_id)
);

CREATE INDEX idx_ghg_boundary_facilities_treatment ON ghg_boundary_facilities (treatment_id);

DROP TABLE ghg_boundary_version_entries;

CREATE TABLE ghg_boundary_version_entries (
    id                        uuid PRIMARY KEY,
    boundary_version_id       uuid          NOT NULL REFERENCES ghg_boundary_versions (id) ON DELETE CASCADE,
    entity_id                 uuid          NOT NULL,
    entity_name               varchar(120)  NOT NULL,
    relationship_type         varchar(30)   NOT NULL,
    economic_interest_percent numeric(5, 2) NOT NULL,
    operated_by_company       boolean       NOT NULL,
    accounting_share          numeric(7, 4) NOT NULL
);

CREATE INDEX idx_ghg_boundary_version_entries_version
    ON ghg_boundary_version_entries (boundary_version_id);

CREATE TABLE ghg_boundary_version_facilities (
    id            uuid PRIMARY KEY,
    entry_id      uuid         NOT NULL REFERENCES ghg_boundary_version_entries (id) ON DELETE CASCADE,
    facility_id   uuid         NOT NULL,
    facility_name varchar(120) NOT NULL,
    location      varchar(120) NOT NULL
);

CREATE INDEX idx_ghg_boundary_version_facilities_entry ON ghg_boundary_version_facilities (entry_id);

ALTER TABLE ghg_boundary_versions ADD COLUMN entity_count integer NOT NULL DEFAULT 0;
