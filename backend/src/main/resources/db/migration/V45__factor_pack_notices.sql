-- Specs 02.5 (publication) and 02.7 (adopting a new edition).
--
-- Publishing an edition writes to the catalogue and raises a notice for every
-- organization holding a lineage the predecessor carried. It never writes to
-- ghg_emission_factors, to an assignment or to a run: every organization's
-- figures are the same the moment after a publication as the moment before.
-- This migration creates the notices publication raises. The inbox, the diff
-- and the decision are spec 02.7's own phase; the columns the decision needs
-- are created here so the record is one table rather than two.
--
-- It also widens the citation column, which is a data change on
-- ghg_emission_factors and ghg_run_factors, so it is replayed with psql on a
-- copy of a seeded database before it deploys, as
-- docs/how-to/add-a-migration.md requires.

-- 1. The citation column. Spec 02.5 rule 2 requires the citation an import
--    builds to fit ghg_emission_factors.source. At varchar(500) three seeded
--    rows did not fit: IPCC:2006:flaring-gas-production at 572 characters,
--    IPCC:2006:flaring-per-m3-flared and
--    IPCC:2006:land-clearing-tropical-moist-forest at 528. They are
--    hand-written derivations whose detail is the arithmetic rather than a
--    table row, and the rule exempted them rather than fitting them, which put
--    a hole in the rule.
--
--    The width is chosen from what the catalogue can produce rather than from
--    what it holds today. A citation is the source publication, then the
--    publisher's three taxonomy parts joined by ' / ': at the column widths of
--    ghg_factor_pack_rows that is at most 500 + 2 + 120 + 3 + 200 + 3 + 500 =
--    1,328 characters. varchar(2000) holds every citation a row can state, with
--    room for a widened taxonomy later. The 2,836 seeded rows have a median
--    citation of 148 characters and a 99th percentile of 228, so the ordinary
--    row is nowhere near either figure.
--
--    ghg_run_factors.source snapshots the factor's citation when a run is
--    calculated, so it is widened with it or a run over a long citation would
--    fail where the factor saved.
ALTER TABLE ghg_emission_factors ALTER COLUMN source TYPE varchar(2000);
ALTER TABLE ghg_run_factors ALTER COLUMN source TYPE varchar(2000);

-- 2. The notices. One per organization per edition: publication raises them,
--    the organization decides, and a withdrawal closes the open ones.
CREATE TABLE ghg_factor_pack_notices (
    id                             uuid PRIMARY KEY,
    organization_id                uuid        NOT NULL REFERENCES ghg_organizations (id) ON DELETE CASCADE,
    edition_id                     varchar(60) NOT NULL REFERENCES ghg_factor_pack_editions (edition_id),
    predecessor_edition_id         varchar(60) REFERENCES ghg_factor_pack_editions (edition_id),
    status                         varchar(12) NOT NULL,
    raised_at                      timestamptz NOT NULL DEFAULT now(),
    -- the hash over the per-row comparison, so a verifier can confirm the diff the decider saw
    diff_hash                      varchar(64) NOT NULL,
    rows_affected                  integer     NOT NULL DEFAULT 0,
    rows_over_threshold            integer     NOT NULL DEFAULT 0,
    estimated_kg_co2e_delta        numeric(18, 3),
    -- what the decision records (spec 02.7); null until the organization decides
    decided_at                     timestamptz,
    decided_by_user_id             uuid,
    decided_by                     varchar(320),
    decided_by_role                varchar(20),
    decision_note                  varchar(2000),
    recalculation_case             varchar(30),
    recalculation_id               uuid,
    applied_at                     timestamptz,
    significance_threshold_percent numeric(6, 2),
    affected_percent               numeric(9, 4),
    scopes_affected                varchar(40),
    created_at                     timestamptz NOT NULL DEFAULT now(),
    updated_at                     timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_ghg_factor_pack_notices_status
        CHECK (status IN ('OPEN', 'ACCEPTED', 'DECLINED', 'WITHDRAWN')),
    CONSTRAINT chk_ghg_factor_pack_notices_case
        CHECK (recalculation_case IS NULL OR recalculation_case IN ('VINTAGE_PROGRESSION',
            'RETROSPECTIVE_ADOPTION', 'ERRATUM_ON_REPORTED_YEAR')),
    -- a decided notice names the decider, the moment, and how the recalculation question was answered
    CONSTRAINT chk_ghg_factor_pack_notices_decided
        CHECK (status NOT IN ('ACCEPTED', 'DECLINED') OR (decided_at IS NOT NULL AND decided_by IS NOT NULL
            AND recalculation_case IS NOT NULL)),
    -- a publication raises one notice per organization
    CONSTRAINT uq_ghg_factor_pack_notices_edition UNIQUE (organization_id, edition_id)
);
-- the count badge the workspace navigation carries reads only the open ones
CREATE INDEX idx_ghg_factor_pack_notices_open
    ON ghg_factor_pack_notices (organization_id) WHERE status = 'OPEN';
CREATE INDEX idx_ghg_factor_pack_notices_edition ON ghg_factor_pack_notices (edition_id, status);

-- 3. Accepting and declining are acts on an organization, so spec 02.7 records
--    them as audit events. The action check is dropped and recreated with the
--    two added, the pattern V37__organization_confidentiality_and_deletion.sql
--    uses. Nothing else on the table changes and
--    chk_ghg_audit_events_subject stands: an edition belongs to no organization,
--    so the publication trail stays in ghg_factor_pack_events.
ALTER TABLE ghg_audit_events DROP CONSTRAINT ghg_audit_events_action_check;
ALTER TABLE ghg_audit_events ADD CONSTRAINT ghg_audit_events_action_check
    CHECK (action IN ('RUN_VOIDED', 'FINAL_WITHDRAWN', 'CLASSIFIED', 'REVIEWED', 'FROZEN', 'REOPENED',
                      'RUN_LAUNCHED', 'FINAL_DESIGNATED', 'PUBLISHED', 'CORRECTION_CREATED', 'HEADER_SAVED',
                      'ADMIN_ACCESS_ASSUMED', 'ADMIN_ACCESS_ENDED', 'ADMIN_ACCESS_EXPIRED', 'ORGANIZATION_DELETED',
                      'FACTOR_PACK_ADOPTED', 'FACTOR_PACK_DECLINED'));
