-- Profile media: object-store keys + content types for avatar and resume.
-- Binary content lives in the S3-compatible store (MinIO locally, R2/Railway
-- bucket in production); the DB is the source of truth for what exists.
ALTER TABLE users
    ADD COLUMN avatar_key varchar(255),
    ADD COLUMN avatar_content_type varchar(100),
    ADD COLUMN resume_key varchar(255),
    ADD COLUMN resume_content_type varchar(100),
    ADD COLUMN resume_filename varchar(255);
