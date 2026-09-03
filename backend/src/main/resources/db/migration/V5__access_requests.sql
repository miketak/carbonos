-- Self-service registration: visitors request access, admins decide, approved
-- requests carry a single-use password-setup token (spec 01.1).
CREATE TABLE access_requests (
    id               uuid PRIMARY KEY,
    email            varchar(320) NOT NULL,
    display_name     varchar(100) NOT NULL,
    company          varchar(150),
    status           varchar(20)  NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'DENIED', 'COMPLETED')),
    setup_token      varchar(64) UNIQUE,
    token_expires_at timestamptz,
    decided_at       timestamptz,
    decided_by       uuid REFERENCES users (id) ON DELETE SET NULL,
    created_at       timestamptz  NOT NULL DEFAULT now(),
    updated_at       timestamptz  NOT NULL DEFAULT now()
);

-- one open request per address; decided requests stay as audit trail
CREATE UNIQUE INDEX idx_access_requests_pending_email ON access_requests (email) WHERE status = 'PENDING';
CREATE INDEX idx_access_requests_status ON access_requests (status);
