package com.carbonos.help.internal;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

/**
 * A rejected field on a vote or a search report: 422 with
 * {@code errors.<field>}, the shape bean validation produces and every form
 * in the product prints inline (spec 09).
 */
class HelpFieldException extends ErrorResponseException {

	HelpFieldException(String field, String message) {
		super(HttpStatus.UNPROCESSABLE_ENTITY);
		setTitle("Invalid request");
		setDetail(message);
		getBody().setProperty("errors", Map.of(field, message));
	}
}
