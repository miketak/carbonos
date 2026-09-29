package com.carbonos.user.internal;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

/**
 * The current password given on the profile does not match (spec 01.9). A
 * 422 on the field, never a 401: the session is fine, and the app reads a 401
 * as signed out.
 */
class WrongCurrentPasswordException extends ErrorResponseException {

	static final String MESSAGE = "The current password is not correct.";

	WrongCurrentPasswordException() {
		super(HttpStatus.UNPROCESSABLE_ENTITY);
		setTitle("Validation failed");
		setDetail(MESSAGE);
		getBody().setProperty("errors", Map.of("currentPassword", MESSAGE));
	}
}
