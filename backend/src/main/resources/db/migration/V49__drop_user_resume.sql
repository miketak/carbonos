-- The resume upload was an experiment and is retired (spec 01.6). The avatar
-- columns added alongside it by V3 stay: they are the live profile picture.
ALTER TABLE users
	DROP COLUMN resume_key,
	DROP COLUMN resume_content_type,
	DROP COLUMN resume_filename;
