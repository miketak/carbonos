package com.carbonos.user.internal;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

/** A "new" password equal to the current one (spec 01.9): 422 on the new password field. */
class SamePasswordException extends ErrorResponseException {

	static final String MESSAGE = "Choose a password different from your current one.";

	SamePasswordException() {
		super(HttpStatus.UNPROCESSABLE_ENTITY);
		setTitle("Validation failed");
		setDetail(MESSAGE);
		getBody().setProperty("errors", Map.of("newPassword", MESSAGE));
	}
}
