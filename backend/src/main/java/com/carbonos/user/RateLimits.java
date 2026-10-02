package com.carbonos.user;

/**
 * The in-memory rate limits of the {@code user} module (password reset
 * requests and changes, spec 01.9). Public so the {@code qa} module's reset
 * can clear them: a fresh deployment starts with no attempts counted.
 */
public interface RateLimits {

	void reset();
}
