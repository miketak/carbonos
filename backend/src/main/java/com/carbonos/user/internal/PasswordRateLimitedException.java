package com.carbonos.user.internal;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

/** Past a password limit (spec 01.9): 429 with a {@code Retry-After} of the limiter's window. */
class PasswordRateLimitedException extends ErrorResponseException {

	PasswordRateLimitedException(String detail) {
		super(HttpStatus.TOO_MANY_REQUESTS);
		setTitle("Too many requests");
		setDetail(detail);
		getHeaders().set(HttpHeaders.RETRY_AFTER, String.valueOf(PasswordRateLimiter.WINDOW.toSeconds()));
	}
}
