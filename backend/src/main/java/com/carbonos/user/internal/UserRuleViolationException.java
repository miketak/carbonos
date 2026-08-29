package com.carbonos.user.internal;

import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

class UserRuleViolationException extends ErrorResponseException {

	UserRuleViolationException(String detail) {
		super(HttpStatus.CONFLICT);
		setTitle("Operation not allowed");
		setDetail(detail);
	}
}
