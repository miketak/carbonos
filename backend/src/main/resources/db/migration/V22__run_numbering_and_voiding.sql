-- T-05 (audit finding F35; spec 05.2): runs are numbered for ever and voided
-- with a reason instead of deleted; withdrawing a final designation needs a
-- reason; both acts leave an audit event.

-- 1. Run numbers, unique per inventory, never reused. Existing runs are
--    numbered in creation order.
ALTER TABLE ghg_runs
    ADD COLUMN run_no            integer,
    ADD COLUMN voided_at         timestamptz,
    ADD COLUMN voided_by_user_id uuid,
    ADD COLUMN voided_by         varchar(320),
    ADD COLUMN void_reason       varchar(500);

UPDATE ghg_runs r
SET run_no = numbered.run_no
FROM (SELECT id, row_number() OVER (PARTITION BY inventory_id ORDER BY created_at, id) AS run_no
      FROM ghg_runs) numbered
WHERE numbered.id = r.id;

ALTER TABLE ghg_runs
    ALTER COLUMN run_no SET NOT NULL,
    ADD CONSTRAINT uq_ghg_runs_inventory_run_no UNIQUE (inventory_id, run_no),
    ADD CONSTRAINT chk_ghg_runs_void
        CHECK ((voided_at IS NULL) = (void_reason IS NULL));

-- 2. Audit events on an inventory.
CREATE TABLE ghg_audit_events (
    id            uuid PRIMARY KEY,
    inventory_id  uuid         NOT NULL REFERENCES ghg_inventories (id) ON DELETE CASCADE,
    run_id        uuid,
    run_no        integer,
    action        varchar(40)  NOT NULL CHECK (action IN ('RUN_VOIDED', 'FINAL_WITHDRAWN')),
    actor_user_id uuid,
    actor         varchar(320) NOT NULL,
    reason        varchar(500) NOT NULL,
    created_at    timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX idx_ghg_audit_events_inventory ON ghg_audit_events (inventory_id, created_at DESC);
