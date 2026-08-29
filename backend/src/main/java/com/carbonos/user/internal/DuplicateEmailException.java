package com.carbonos.user.internal;

import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

class DuplicateEmailException extends ErrorResponseException {

	DuplicateEmailException(String email) {
		super(HttpStatus.CONFLICT);
		setTitle("Duplicate email");
		setDetail("A user with email '" + email + "' already exists.");
	}
}
