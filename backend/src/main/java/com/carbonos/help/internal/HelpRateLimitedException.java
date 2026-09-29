package com.carbonos.help.internal;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

/**
 * The eleventh request in a minute from one voter (spec 09): 429 with a
 * {@code Retry-After} of one minute, the length of the limiter's window.
 */
class HelpRateLimitedException extends ErrorResponseException {

	HelpRateLimitedException() {
		super(HttpStatus.TOO_MANY_REQUESTS);
		setTitle("Too many requests");
		setDetail("Ten requests a minute is the limit. Try again in a minute.");
		getHeaders().set(HttpHeaders.RETRY_AFTER, String.valueOf(HelpRateLimiter.WINDOW.toSeconds()));
	}
}
