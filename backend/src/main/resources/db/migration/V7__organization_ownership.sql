-- AUTH-01 (spec 01): tenant isolation. Every GHG organization is owned by the
-- user who created it; only the owner and platform ADMINs may touch it or
-- anything nested under it. Loose reference (no FK) so user lifecycle stays
-- decoupled; an org with no living owner is ADMIN-only.
ALTER TABLE ghg_organizations
    ADD COLUMN owner_user_id uuid;

-- Backfill existing organizations to the oldest active admin.
UPDATE ghg_organizations
SET owner_user_id = (SELECT id
                     FROM users
                     WHERE role = 'ADMIN' AND status = 'ACTIVE'
                     ORDER BY created_at
                     LIMIT 1);
