package com.carbonos.user.internal;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

/**
 * 422 with an {@code errors.file} entry so the SPA renders it inline, matching
 * the bean-validation error contract.
 */
class UnsupportedFileTypeException extends ErrorResponseException {

	UnsupportedFileTypeException(String message) {
		super(HttpStatus.UNPROCESSABLE_ENTITY);
		setTitle("Unsupported file");
		setDetail(message);
		getBody().setProperty("errors", Map.of("file", message));
	}
}
