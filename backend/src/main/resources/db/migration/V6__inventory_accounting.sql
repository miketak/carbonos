-- Spec 003: facts vs. views. Activities become pure organizational facts;
-- inventories are accounting views with their own boundary and per-activity
-- assignments; runs re-parent from organizations to inventories.

-- 1. Inventories: the accounting views.
CREATE TABLE ghg_inventories (
    id                     uuid PRIMARY KEY,
    organization_id        uuid         NOT NULL REFERENCES ghg_organizations (id) ON DELETE CASCADE,
    name                   varchar(120) NOT NULL,
    period_start           date         NOT NULL,
    period_end             date         NOT NULL,
    purpose                varchar(255),
    base_year              integer,
    consolidation_approach varchar(30)  NOT NULL
        CHECK (consolidation_approach IN ('EQUITY_SHARE', 'FINANCIAL_CONTROL', 'OPERATIONAL_CONTROL')),
    final_run_id           uuid,
    created_at             timestamptz  NOT NULL DEFAULT now(),
    updated_at             timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX idx_ghg_inventories_organization ON ghg_inventories (organization_id);

-- 2. Per-inventory boundary: which facilities count, and how much of each.
CREATE TABLE ghg_boundary_treatments (
    id                  uuid PRIMARY KEY,
    inventory_id        uuid          NOT NULL REFERENCES ghg_inventories (id) ON DELETE CASCADE,
    facility_id         uuid          NOT NULL REFERENCES ghg_facilities (id) ON DELETE CASCADE,
    ownership_percent   numeric(5, 2) NOT NULL
        CHECK (ownership_percent >= 0 AND ownership_percent <= 100),
    financial_control   boolean       NOT NULL,
    operational_control boolean       NOT NULL,
    created_at          timestamptz   NOT NULL DEFAULT now(),
    updated_at          timestamptz   NOT NULL DEFAULT now(),
    UNIQUE (inventory_id, facility_id)
);

CREATE INDEX idx_ghg_boundary_treatments_inventory ON ghg_boundary_treatments (inventory_id);

-- 3. Activities become pure facts: no factor, own type/unit/provenance.
ALTER TABLE ghg_activities
    ADD COLUMN activity_type varchar(120),
    ADD COLUMN unit          varchar(30),
    ADD COLUMN data_source   varchar(120),
    ADD COLUMN evidence_ref  varchar(150),
    ADD COLUMN data_quality  varchar(20) NOT NULL DEFAULT 'MEASURED'
        CHECK (data_quality IN ('MEASURED', 'ESTIMATED', 'CALCULATED'));

UPDATE ghg_activities a
SET activity_type = f.name,
    unit          = f.unit
FROM ghg_emission_factors f
WHERE a.emission_factor_id = f.id;

ALTER TABLE ghg_activities
    ALTER COLUMN activity_type SET NOT NULL,
    ALTER COLUMN unit SET NOT NULL,
    DROP COLUMN emission_factor_id;

-- 4. Assignments: the inventory's view over the facts. The fact is never touched.
CREATE TABLE ghg_assignments (
    id                 uuid PRIMARY KEY,
    inventory_id       uuid        NOT NULL REFERENCES ghg_inventories (id) ON DELETE CASCADE,
    activity_id        uuid        NOT NULL REFERENCES ghg_activities (id) ON DELETE CASCADE,
    included           boolean     NOT NULL,
    exclusion_reason   varchar(40)
        CHECK (exclusion_reason IN ('OUTSIDE_PERIOD', 'OUTSIDE_BOUNDARY', 'NON_GHG',
                                    'DUPLICATE', 'NOT_APPLICABLE', 'METHODOLOGY', 'OTHER')),
    scope              varchar(10) CHECK (scope IN ('SCOPE_1', 'SCOPE_2', 'SCOPE_3')),
    category           varchar(40),
    emission_factor_id uuid REFERENCES ghg_emission_factors (id),
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),
    UNIQUE (inventory_id, activity_id)
);

CREATE INDEX idx_ghg_assignments_inventory ON ghg_assignments (inventory_id);

-- 5. Runs re-parent to inventories. Pre-1.0 spike runs are not migrated.
DELETE FROM ghg_run_lines;
DELETE FROM ghg_runs;

ALTER TABLE ghg_runs
    DROP COLUMN organization_id,
    ADD COLUMN inventory_id uuid NOT NULL REFERENCES ghg_inventories (id) ON DELETE CASCADE;

CREATE INDEX idx_ghg_runs_inventory ON ghg_runs (inventory_id);

ALTER TABLE ghg_inventories
    ADD CONSTRAINT fk_ghg_inventories_final_run
        FOREIGN KEY (final_run_id) REFERENCES ghg_runs (id) ON DELETE SET NULL;

-- 6. The consolidation approach now belongs to the inventory, not the organization.
ALTER TABLE ghg_organizations DROP COLUMN consolidation_approach;
