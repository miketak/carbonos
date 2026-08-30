package com.carbonos.user.internal;

import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

/** Deliberately non-enumerating: unknown, used, and expired tokens look the same. */
class InvalidSetupTokenException extends ErrorResponseException {

	InvalidSetupTokenException() {
		super(HttpStatus.NOT_FOUND);
		setTitle("Invalid link");
		setDetail("This link is invalid or has expired.");
	}
}
