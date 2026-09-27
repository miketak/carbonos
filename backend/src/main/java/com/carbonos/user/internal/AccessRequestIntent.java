package com.carbonos.user.internal;

/** What the visitor pressed on the landing page (spec 01.1); null for requests made before it was recorded. */
public enum AccessRequestIntent {
	ACCESS, PILOT, LICENCE, TALK
}
