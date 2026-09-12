-- Spec 01.3: organization data is visible to members only; a platform
-- administrator assumes a logged, 24-hour support access; an organization is
-- deleted with a tombstone, never cascaded, and only while nothing under it
-- is published or final.

-- 1. Support access grants: who assumed access to which organization, why,
--    when it was granted, when it expires and when it was ended by hand.
CREATE TABLE ghg_support_access (
    id              uuid PRIMARY KEY,
    organization_id uuid         NOT NULL REFERENCES ghg_organizations (id) ON DELETE CASCADE,
    admin_user_id   uuid         NOT NULL,
    admin_email     varchar(320) NOT NULL,
    reason          varchar(500) NOT NULL,
    granted_at      timestamptz  NOT NULL DEFAULT now(),
    expires_at      timestamptz  NOT NULL,
    ended_at        timestamptz
);
CREATE INDEX idx_ghg_support_access_organization_expiry ON ghg_support_access (organization_id, expires_at);
CREATE INDEX idx_ghg_support_access_admin ON ghg_support_access (admin_user_id, expires_at);

-- 2. The organization's tombstone (the vocabulary of spec 04.4). A removed
--    name is released: the unique constraint on the name becomes a partial
--    unique index over the rows that are still live.
ALTER TABLE ghg_organizations
    ADD COLUMN deleted_at    timestamptz,
    ADD COLUMN deleted_by    varchar(320),
    ADD COLUMN delete_reason varchar(500),
    ADD CONSTRAINT chk_ghg_organizations_tombstone
        CHECK ((deleted_at IS NULL) = (deleted_by IS NULL) AND (deleted_at IS NULL) = (delete_reason IS NULL));
ALTER TABLE ghg_organizations DROP CONSTRAINT ghg_organizations_name_key;
CREATE UNIQUE INDEX uq_ghg_organizations_live_name ON ghg_organizations (lower(name)) WHERE deleted_at IS NULL;

-- 3. Audit events at the organization level: support access assumed, ended
--    and expired, and the organization deleted. The inventory becomes
--    optional and every event names its organization.
ALTER TABLE ghg_audit_events
    ALTER COLUMN inventory_id DROP NOT NULL,
    ADD COLUMN organization_id uuid REFERENCES ghg_organizations (id) ON DELETE CASCADE;

UPDATE ghg_audit_events e
   SET organization_id = i.organization_id
  FROM ghg_inventories i
 WHERE i.id = e.inventory_id;

ALTER TABLE ghg_audit_events
    ADD CONSTRAINT chk_ghg_audit_events_subject CHECK (organization_id IS NOT NULL OR inventory_id IS NOT NULL);
ALTER TABLE ghg_audit_events DROP CONSTRAINT ghg_audit_events_action_check;
ALTER TABLE ghg_audit_events ADD CONSTRAINT ghg_audit_events_action_check
    CHECK (action IN ('RUN_VOIDED', 'FINAL_WITHDRAWN', 'CLASSIFIED', 'REVIEWED', 'FROZEN', 'REOPENED',
                      'RUN_LAUNCHED', 'FINAL_DESIGNATED', 'PUBLISHED', 'CORRECTION_CREATED', 'HEADER_SAVED',
                      'ADMIN_ACCESS_ASSUMED', 'ADMIN_ACCESS_ENDED', 'ADMIN_ACCESS_EXPIRED', 'ORGANIZATION_DELETED'));
CREATE INDEX idx_ghg_audit_events_organization ON ghg_audit_events (organization_id, created_at DESC);
