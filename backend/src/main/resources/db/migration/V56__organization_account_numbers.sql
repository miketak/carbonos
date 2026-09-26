-- Spec 01.8: every organization carries a platform-wide account number,
-- assigned once in creation order and never reused, and two live
-- organizations may share a name. The number is what tells them apart on a
-- screen, a PDF or a support call; the UUID stays the key.

-- 1. The sequence and the column. Existing rows, tombstones included, are
--    numbered in creation order (ties broken on the id, so the result is
--    deterministic); a removed organization keeps its number.
CREATE SEQUENCE ghg_organizations_account_no_seq AS bigint START WITH 1 INCREMENT BY 1;

ALTER TABLE ghg_organizations ADD COLUMN account_no bigint;

WITH numbered AS (
    SELECT id, row_number() OVER (ORDER BY created_at, id) AS n
      FROM ghg_organizations
)
UPDATE ghg_organizations o
   SET account_no = numbered.n
  FROM numbered
 WHERE o.id = numbered.id;

SELECT setval('ghg_organizations_account_no_seq',
              COALESCE((SELECT max(account_no) FROM ghg_organizations), 0) + 1, false);

ALTER TABLE ghg_organizations
    ALTER COLUMN account_no SET NOT NULL,
    ALTER COLUMN account_no SET DEFAULT nextval('ghg_organizations_account_no_seq'),
    ADD CONSTRAINT uq_ghg_organizations_account_no UNIQUE (account_no),
    ADD CONSTRAINT chk_ghg_organizations_account_no_positive CHECK (account_no > 0);
ALTER SEQUENCE ghg_organizations_account_no_seq OWNED BY ghg_organizations.account_no;

-- 2. The name is no longer unique among live rows (spec 01.3 is superseded
--    here). The partial index stays, non-unique, for the duplicate lookup.
DROP INDEX uq_ghg_organizations_live_name;
CREATE INDEX idx_ghg_organizations_live_name ON ghg_organizations (lower(name)) WHERE deleted_at IS NULL;

-- 3. A rename is part of the organization's history: with shared names, which
--    organization was renamed into which is a fact an owner reads for
--    themselves. The action check is dropped and recreated, the pattern V37,
--    V45, V48 and V53 use.
ALTER TABLE ghg_audit_events DROP CONSTRAINT ghg_audit_events_action_check;
ALTER TABLE ghg_audit_events ADD CONSTRAINT ghg_audit_events_action_check
    CHECK (action IN ('RUN_VOIDED', 'FINAL_WITHDRAWN', 'CLASSIFIED', 'REVIEWED', 'FROZEN', 'REOPENED',
                      'RUN_LAUNCHED', 'FINAL_DESIGNATED', 'PUBLISHED', 'CORRECTION_CREATED', 'HEADER_SAVED',
                      'ADMIN_ACCESS_ASSUMED', 'ADMIN_ACCESS_ENDED', 'ADMIN_ACCESS_EXPIRED', 'ORGANIZATION_DELETED',
                      'FACTOR_PACK_ADOPTED', 'FACTOR_PACK_DECLINED', 'ORGANIZATION_CREATED',
                      'MEMBER_ADDED', 'MEMBER_ROLE_CHANGED', 'MEMBER_REMOVED', 'ORGANIZATION_RENAMED'));
