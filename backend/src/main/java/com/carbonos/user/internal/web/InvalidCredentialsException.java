package com.carbonos.user.internal.web;

import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

/**
 * Single 401 for unknown email, wrong password, and disabled account alike,
 * so accounts cannot be enumerated.
 */
class InvalidCredentialsException extends ErrorResponseException {

	InvalidCredentialsException() {
		super(HttpStatus.UNAUTHORIZED);
		setTitle("Invalid credentials");
		setDetail("Invalid email or password.");
	}
}
