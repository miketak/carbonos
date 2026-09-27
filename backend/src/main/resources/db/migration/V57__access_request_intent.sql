-- Spec 01.1: the landing page's buttons name what the visitor wants (the pilot,
-- a licence, a conversation, plain access) and let them add a sentence; both
-- travel with the request so the queue can tell an enquiry from a sign-up.
ALTER TABLE access_requests
    ADD COLUMN intent  varchar(20) CHECK (intent IN ('ACCESS', 'PILOT', 'LICENCE', 'TALK')),
    ADD COLUMN message varchar(1000);
