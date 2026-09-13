-- Spec 02.7 (adopting a new edition), the decision phase.
--
-- V45 created ghg_factor_pack_notices with every column the decision fills,
-- and one check on it that the decision phase cannot satisfy:
-- chk_ghg_factor_pack_notices_decided required a recalculation answer of any
-- notice that is ACCEPTED *or* DECLINED. Spec 02.7 asks the recalculation
-- question on acceptance only. Declining changes nothing, writes no factor and
-- raises no candidate, so there is no methodology change to classify and
-- POST /factor-pack-notices/{id}/decline carries a note at most. The check as
-- written would refuse every decline.
--
-- The check is dropped and recreated so a decided notice still names the
-- decider and the moment, and an ACCEPTED one still carries the answer.
-- No column is added and no row is rewritten: the table holds no decided
-- notice yet, because this is the phase that writes the first one.
ALTER TABLE ghg_factor_pack_notices DROP CONSTRAINT chk_ghg_factor_pack_notices_decided;
ALTER TABLE ghg_factor_pack_notices ADD CONSTRAINT chk_ghg_factor_pack_notices_decided
    CHECK (status NOT IN ('ACCEPTED', 'DECLINED')
        OR (decided_at IS NOT NULL AND decided_by IS NOT NULL AND decided_by_role IS NOT NULL
            AND (status <> 'ACCEPTED' OR recalculation_case IS NOT NULL)));

-- Spec 02.7: the note is required whenever the answer is a vintage progression
-- at or above the organization's significance threshold, because that is the
-- case a verifier questions. The service refuses it with 422 errors.note; the
-- check is the backstop, so the record cannot exist without the reason.
ALTER TABLE ghg_factor_pack_notices ADD CONSTRAINT chk_ghg_factor_pack_notices_note
    CHECK (recalculation_case IS DISTINCT FROM 'VINTAGE_PROGRESSION'
        OR affected_percent IS NULL OR significance_threshold_percent IS NULL
        OR affected_percent < significance_threshold_percent
        OR decision_note IS NOT NULL);
