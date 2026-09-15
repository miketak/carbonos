-- Spec 01.5: the deployment-wide policy an administrator sets in the
-- administration panel, and the record of every change to it.
--
-- Two decisions stop being constants in Java. The support-access window was
-- Duration.ofHours(24) in SupportAccess, so tightening or relaxing the
-- break-glass control needed a release (decision D-02). Organization
-- creation was open to every signed-in user, which a hosted deployment may
-- not want (decision D-03).
--
-- Typed columns rather than a key/value bag: Hibernate validates the schema
-- against the entity at startup, and a CHECK keeps a bad window out of the
-- database as well as out of the service. Adding a setting later costs a
-- column and a migration, which is the honest price for that.

-- 1. The settings themselves. One row, forever: the CHECK on the primary key
--    is what makes "the settings" a thing rather than a table of things.
CREATE TABLE platform_settings (
    id                          integer      PRIMARY KEY,
    support_access_window_hours integer      NOT NULL DEFAULT 24,
    organization_creation       varchar(20)  NOT NULL DEFAULT 'EVERYONE',
    updated_at                  timestamptz  NOT NULL DEFAULT now(),
    updated_by                  varchar(320),
    CONSTRAINT chk_platform_settings_singleton
        CHECK (id = 1),
    -- 72 hours, not a week. Seven days of owner-equivalent access to a
    -- client's pre-publication inventory is standing access with an expiry
    -- attached, and at that length the forgotten-access failure the control
    -- exists to prevent is back. Ending a grant and assuming it again is
    -- cheap and writes a fresh reason into the client's history, so a short
    -- window documents a long support case better than a long one does.
    CONSTRAINT chk_platform_settings_window
        CHECK (support_access_window_hours BETWEEN 1 AND 72),
    CONSTRAINT chk_platform_settings_org_creation
        CHECK (organization_creation IN ('EVERYONE', 'ADMINISTRATORS'))
);

-- The defaults are today's behaviour exactly: 24 hours (spec 01.3) and open
-- creation (spec 01.4). A deployment that upgrades and never opens the
-- settings page behaves identically. Seeding the row here also means the
-- service never has to invent a default when the row is missing.
INSERT INTO platform_settings (id) VALUES (1);

-- 2. The change log. Append-only, and the reason is mandatory.
--
--    Without this, an administrator could raise the window, assume access,
--    and lower it again, leaving as evidence only a grant whose expiry
--    happens to sit further out than usual. That is a self-serving change to
--    a privileged-access control by the person it benefits, and Chapter 7
--    treats change control over the systems behind an inventory as part of
--    inventory quality.
--
--    It is its own table for the same reason ghg_factor_pack_events is: a
--    platform act has neither an organization nor an inventory, so
--    chk_ghg_audit_events_subject refuses it, and it is not about an edition
--    either.
CREATE TABLE platform_setting_changes (
    id           uuid         PRIMARY KEY,
    setting_key  varchar(60)  NOT NULL,
    old_value    varchar(60)  NOT NULL,
    new_value    varchar(60)  NOT NULL,
    reason       varchar(500) NOT NULL,
    actor_id     uuid,
    actor_email  varchar(320) NOT NULL,
    changed_at   timestamptz  NOT NULL,
    CONSTRAINT chk_platform_setting_changes_reason
        CHECK (length(btrim(reason)) >= 10)
);

CREATE INDEX idx_platform_setting_changes_changed_at
    ON platform_setting_changes (changed_at DESC);

-- 3. One new audit action. While creation is reserved to administrators, the
--    administrator who creates an organization is not a member of it, so the
--    act has to be recorded where the owners can read it. The action check is
--    dropped and recreated with it added, the pattern V37 and V45 use.
ALTER TABLE ghg_audit_events DROP CONSTRAINT ghg_audit_events_action_check;
ALTER TABLE ghg_audit_events ADD CONSTRAINT ghg_audit_events_action_check
    CHECK (action IN ('RUN_VOIDED', 'FINAL_WITHDRAWN', 'CLASSIFIED', 'REVIEWED', 'FROZEN', 'REOPENED',
                      'RUN_LAUNCHED', 'FINAL_DESIGNATED', 'PUBLISHED', 'CORRECTION_CREATED', 'HEADER_SAVED',
                      'ADMIN_ACCESS_ASSUMED', 'ADMIN_ACCESS_ENDED', 'ADMIN_ACCESS_EXPIRED', 'ORGANIZATION_DELETED',
                      'FACTOR_PACK_ADOPTED', 'FACTOR_PACK_DECLINED', 'ORGANIZATION_CREATED'));
