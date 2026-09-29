package com.carbonos.user.internal;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

/** A password that fails the policy (spec 01.2): 422 with the rule under errors.password. */
public class WeakPasswordException extends ErrorResponseException {

	public WeakPasswordException() {
		this("password");
	}

	/** The rule under the form's own field name (the profile's is {@code newPassword}, spec 01.9). */
	public WeakPasswordException(String field) {
		super(HttpStatus.UNPROCESSABLE_ENTITY);
		setTitle("Validation failed");
		setDetail(PasswordPolicy.RULE);
		getBody().setProperty("errors", Map.of(field, PasswordPolicy.RULE));
	}
}
