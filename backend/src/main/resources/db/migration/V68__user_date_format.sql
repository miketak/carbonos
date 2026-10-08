-- Spec 01.10: the date form an account reads, day-first or month-first. Null is "not chosen yet",
-- and the app follows the browser until the holder picks one.
ALTER TABLE users ADD COLUMN date_format varchar(3);
ALTER TABLE users ADD CONSTRAINT users_date_format_check CHECK (date_format IN ('DMY', 'MDY'));
