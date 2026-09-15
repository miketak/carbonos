package com.carbonos.platform.internal;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

/**
 * A rejected field on a settings write: 422 with {@code errors.<field>}, the
 * shape every form in the product already prints inline.
 */
class PlatformFieldException extends ErrorResponseException {

	PlatformFieldException(String field, String message) {
		super(HttpStatus.UNPROCESSABLE_ENTITY);
		setTitle("Invalid request");
		setDetail(message);
		getBody().setProperty("errors", Map.of(field, message));
	}
}
