-- Spec 04.7 (audit 2026-09-11, findings F41 and F34): category 3 of the Scope
-- 3 Standard is made of lines that ride on records that already exist. An
-- upstream rule pairs a primary factor with an upstream factor, and the run
-- derives one scope 3 line from every included scope 1 or scope 2 line the
-- rule matches.
--
-- This migration adds structure only; it rewrites no rows. Runs already
-- launched are snapshots and keep their figures.

-- 1. The rules of one inventory's view. One primary factor carries at most one
--    rule of each kind, so a view never derives the same line twice.
CREATE TABLE ghg_upstream_rules (
    id                 uuid        NOT NULL PRIMARY KEY,
    inventory_id       uuid        NOT NULL REFERENCES ghg_inventories (id) ON DELETE CASCADE,
    primary_factor_id  uuid        NOT NULL REFERENCES ghg_emission_factors (id),
    upstream_factor_id uuid        NOT NULL REFERENCES ghg_emission_factors (id),
    kind               varchar(40) NOT NULL
        CHECK (kind IN ('WELL_TO_TANK', 'TRANSMISSION_AND_DISTRIBUTION')),
    created_at         timestamptz NOT NULL,
    created_by         varchar(255),
    CONSTRAINT ghg_upstream_rules_unique UNIQUE (inventory_id, primary_factor_id, kind)
);

CREATE INDEX idx_ghg_upstream_rules_inventory ON ghg_upstream_rules (inventory_id);

-- 2. A derived line points at the primary line it rides on, names the kind of
--    upstream emissions it carries, and prints why in words. Null on every
--    line a record produced directly. The pointer is a plain id, like every
--    other id a snapshot line carries (activity, facility, entity, factor): a
--    run line is a denormalized record, and a self-referencing key would make
--    the order in which a run's lines are deleted significant.
ALTER TABLE ghg_run_lines
    ADD COLUMN derived_from_line_id uuid,
    ADD COLUMN derived_kind         varchar(40)
        CHECK (derived_kind IN ('WELL_TO_TANK', 'TRANSMISSION_AND_DISTRIBUTION')),
    ADD COLUMN derived_note         varchar(500);

CREATE INDEX idx_ghg_run_lines_derived_from ON ghg_run_lines (derived_from_line_id);
