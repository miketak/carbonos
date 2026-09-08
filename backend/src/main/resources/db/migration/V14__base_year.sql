-- Spec 06: base year and recalculation policy (Chapter 5). An organization
-- designates the inventory that established its base year and the policy
-- (significance threshold and honoured triggers); structural changes to a
-- later boundary are measured against the base-year run and recorded as
-- candidates for recalculation, decided by the accountant.

CREATE TABLE ghg_base_years (
    id                   uuid PRIMARY KEY,
    organization_id      uuid          NOT NULL UNIQUE REFERENCES ghg_organizations (id) ON DELETE CASCADE,
    inventory_id         uuid          NOT NULL REFERENCES ghg_inventories (id) ON DELETE CASCADE,
    threshold_percent    numeric(5, 2) NOT NULL
        CHECK (threshold_percent >= 0 AND threshold_percent <= 100),
    trigger_structural   boolean       NOT NULL,
    trigger_methodology  boolean       NOT NULL,
    trigger_errors       boolean       NOT NULL,
    created_at           timestamptz   NOT NULL DEFAULT now(),
    updated_at           timestamptz   NOT NULL DEFAULT now()
);

CREATE TABLE ghg_base_year_recalculations (
    id                      uuid PRIMARY KEY,
    base_year_id            uuid          NOT NULL REFERENCES ghg_base_years (id) ON DELETE CASCADE,
    trigger_type            varchar(30)   NOT NULL
        CHECK (trigger_type IN ('STRUCTURAL_CHANGE', 'METHODOLOGY_CHANGE', 'ERROR_CORRECTION')),
    reason                  varchar(500)  NOT NULL,
    triggering_inventory_id uuid REFERENCES ghg_inventories (id) ON DELETE SET NULL,
    boundary_version_id     uuid REFERENCES ghg_boundary_versions (id) ON DELETE SET NULL,
    boundary_version_no     integer,
    affected_percent        numeric(7, 2),
    above_threshold         boolean       NOT NULL,
    status                  varchar(20)   NOT NULL
        CHECK (status IN ('FLAGGED', 'RECALCULATED', 'DECLINED')),
    run_id                  uuid REFERENCES ghg_runs (id) ON DELETE SET NULL,
    decision_note           varchar(500),
    decided_by              varchar(320),
    decided_at              timestamptz,
    created_at              timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_ghg_base_year_recalculations_base_year
    ON ghg_base_year_recalculations (base_year_id);
