-- Spec 05.5: deliberate lifecycle acts. A reopen needs a reason, and the
-- boundary version it supersedes records who reopened it, when, and why. A
-- final designation is confirmed with an optional review note, and the
-- inventory records the note, who designated the run and when.

-- 1. The reopen on the superseded boundary version.
ALTER TABLE ghg_boundary_versions
    ADD COLUMN reopened_by_user_id uuid,
    ADD COLUMN reopened_by         varchar(320),
    ADD COLUMN reopened_at         timestamptz,
    ADD COLUMN reopen_reason       varchar(500);

-- 2. The final designation on the inventory, backfilled from the newest
--    FINAL_DESIGNATED audit event of each inventory that still has a final run.
ALTER TABLE ghg_inventories
    ADD COLUMN final_designated_by varchar(320),
    ADD COLUMN final_designated_at timestamptz,
    ADD COLUMN final_note          varchar(500);

UPDATE ghg_inventories i
   SET final_designated_by = e.actor,
       final_designated_at = e.created_at
  FROM (SELECT DISTINCT ON (inventory_id) inventory_id, actor, created_at
          FROM ghg_audit_events
         WHERE action = 'FINAL_DESIGNATED'
         ORDER BY inventory_id, created_at DESC) e
 WHERE e.inventory_id = i.id
   AND i.status IN ('FINAL', 'PUBLISHED')
   AND i.final_run_id IS NOT NULL;
