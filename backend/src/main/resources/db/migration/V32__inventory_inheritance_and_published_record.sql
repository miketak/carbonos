-- T-12, T-10 (audit findings F29, F41, F49; spec 05.3): a new inventory can
-- copy its activity view from another, a correction inherits it and needs a
-- reason, and the published report is snapshotted so later events cannot
-- rewrite it.

ALTER TABLE ghg_inventories
    ADD COLUMN copied_from_id    uuid,
    ADD COLUMN correction_reason varchar(1000),
    ADD COLUMN published_report  text;

ALTER TABLE ghg_assignments ADD COLUMN inherited boolean NOT NULL DEFAULT false;
