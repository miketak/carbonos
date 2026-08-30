package com.carbonos.user.internal;

import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

class DuplicateAccessRequestException extends ErrorResponseException {

	DuplicateAccessRequestException(String email) {
		super(HttpStatus.CONFLICT);
		setTitle("Duplicate request");
		setDetail("An account or pending request already exists for '" + email + "'.");
	}
}
