-- T-22 (audit findings F1, F2; spec 01.2): organizations have members with
-- roles; every act is attributed; approved accounts exist as PENDING until
-- their password is set.

CREATE TABLE ghg_organization_members (
    id              uuid PRIMARY KEY,
    organization_id uuid         NOT NULL REFERENCES ghg_organizations (id) ON DELETE CASCADE,
    user_id         uuid         NOT NULL,
    email           varchar(320) NOT NULL,
    display_name    varchar(100) NOT NULL,
    role            varchar(20)  NOT NULL CHECK (role IN ('OWNER', 'REVIEWER', 'PREPARER', 'VERIFIER')),
    created_at      timestamptz  NOT NULL DEFAULT now(),
    UNIQUE (organization_id, user_id)
);
CREATE INDEX idx_ghg_organization_members_user ON ghg_organization_members (user_id);

-- every existing owner becomes the OWNER member of their organization
INSERT INTO ghg_organization_members (id, organization_id, user_id, email, display_name, role)
SELECT gen_random_uuid(), o.id, u.id, u.email, u.display_name, 'OWNER'
FROM ghg_organizations o JOIN users u ON u.id = o.owner_user_id;

-- the audit trail records every act on an inventory (spec 05.2 widened)
ALTER TABLE ghg_audit_events DROP CONSTRAINT ghg_audit_events_action_check;
ALTER TABLE ghg_audit_events ADD CONSTRAINT ghg_audit_events_action_check
    CHECK (action IN ('RUN_VOIDED', 'FINAL_WITHDRAWN', 'CLASSIFIED', 'REVIEWED', 'FROZEN', 'REOPENED',
                      'RUN_LAUNCHED', 'FINAL_DESIGNATED', 'PUBLISHED', 'CORRECTION_CREATED', 'HEADER_SAVED'));

-- an approved access request creates the account at once, pending its password
ALTER TABLE users DROP CONSTRAINT users_status_check;
ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('ACTIVE', 'DISABLED', 'PENDING'));
