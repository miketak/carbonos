package com.carbonos.user.internal;

import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

/**
 * A reset link that opens nothing (spec 01.9). Unknown is 404; used and
 * expired are 410 with their own sentence, so the holder knows to ask again.
 * None of them says anything about whether an account exists: only a holder
 * of a real link can reach the used and expired cases.
 */
class InvalidResetLinkException extends ErrorResponseException {

	static final String UNKNOWN = "This reset link is not valid.";

	static final String USED = "This reset link has already been used.";

	static final String EXPIRED = "This reset link has expired. Reset links are valid for 1 hour.";

	private InvalidResetLinkException(HttpStatus status, String detail) {
		super(status);
		setTitle("Invalid link");
		setDetail(detail);
	}

	static InvalidResetLinkException unknown() {
		return new InvalidResetLinkException(HttpStatus.NOT_FOUND, UNKNOWN);
	}

	static InvalidResetLinkException used() {
		return new InvalidResetLinkException(HttpStatus.GONE, USED);
	}

	static InvalidResetLinkException expired() {
		return new InvalidResetLinkException(HttpStatus.GONE, EXPIRED);
	}
}
