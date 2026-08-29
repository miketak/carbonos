package com.carbonos.user.internal;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

class UserNotFoundException extends ErrorResponseException {

	UserNotFoundException(UUID id) {
		super(HttpStatus.NOT_FOUND);
		setTitle("User not found");
		setDetail("No user exists with id " + id + ".");
	}
}
