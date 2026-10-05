-- ECO-5 (spec 04.10): an emission source records how it was born. One created
-- from the activity form while a record was being entered is marked INLINE, so
-- a verifier can sample the sources born at the keyboard; the facility's
-- register page writes REGISTER. Rows that exist already came from the register.
ALTER TABLE ghg_source_streams
    ADD COLUMN origin             varchar(16) NOT NULL DEFAULT 'REGISTER' CHECK (origin IN ('REGISTER', 'INLINE')),
    ADD COLUMN created_by_user_id uuid;
