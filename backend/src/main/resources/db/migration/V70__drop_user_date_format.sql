-- ECO-134: dates read ISO everywhere, so the per-user date form of spec 01.10 (V68) has no job left.
-- Date pickers are native inputs and already follow the browser's locale.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_date_format_check;
ALTER TABLE users DROP COLUMN IF EXISTS date_format;
