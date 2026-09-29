-- Spec 01.9: changing and resetting a password.
-- Two tables. Reset tokens are stored as a SHA-256 hash, never the raw value
-- the email carries, and each one works once. Every change and reset leaves
-- an append-only row in user_security_events, the account's security history.

-- 1. One row per reset link sent. The raw token exists only in the email (and
--    briefly in the event that carries it to the mail module); a database
--    read yields hashes that open nothing. used_at is set when the link sets
--    a password, and on every other open link of the account at that moment.
CREATE TABLE password_reset_tokens (
    id            uuid        PRIMARY KEY,
    user_id       uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash    char(64)    NOT NULL,
    expires_at    timestamptz NOT NULL,
    used_at       timestamptz,
    requested_by  uuid        REFERENCES users (id) ON DELETE SET NULL,
    created_at    timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_password_reset_tokens_hash UNIQUE (token_hash)
);

-- voiding the open links of one account on a reset or a change
CREATE INDEX idx_password_reset_tokens_user_open ON password_reset_tokens (user_id) WHERE used_at IS NULL;

-- 2. The account's security history. No foreign key: the row outlives the
--    account, so the email is recorded with the id.
CREATE TABLE user_security_events (
    id             uuid         PRIMARY KEY,
    user_id        uuid         NOT NULL,
    user_email     varchar(320) NOT NULL,
    action         varchar(40)  NOT NULL CHECK (action IN (
                       'PASSWORD_CHANGED', 'PASSWORD_RESET_REQUESTED',
                       'PASSWORD_RESET_SENT_BY_ADMIN', 'PASSWORD_RESET_COMPLETED')),
    actor_user_id  uuid,
    actor          varchar(320) NOT NULL,
    created_at     timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_security_events_user_created ON user_security_events (user_id, created_at DESC);
