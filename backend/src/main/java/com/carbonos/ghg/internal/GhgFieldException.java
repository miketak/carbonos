package com.carbonos.ghg.internal;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

/** A request field the service rejects: 422 with the message under {@code errors.<field>}, like bean validation. */
class GhgFieldException extends ErrorResponseException {

	GhgFieldException(String field, String message) {
		super(HttpStatus.UNPROCESSABLE_ENTITY);
		setTitle("Invalid request");
		setDetail(message);
		getBody().setProperty("errors", Map.of(field, message));
	}
}
