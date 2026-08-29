CREATE TABLE users (
    id            uuid PRIMARY KEY,
    email         varchar(320) NOT NULL UNIQUE,
    display_name  varchar(100) NOT NULL,
    role          varchar(20)  NOT NULL CHECK (role IN ('ADMIN', 'MEMBER')),
    status        varchar(20)  NOT NULL CHECK (status IN ('ACTIVE', 'DISABLED')),
    password_hash varchar(100) NOT NULL,
    created_at    timestamptz  NOT NULL DEFAULT now(),
    updated_at    timestamptz  NOT NULL DEFAULT now()
);
