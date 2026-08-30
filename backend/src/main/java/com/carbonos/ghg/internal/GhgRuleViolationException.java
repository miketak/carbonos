package com.carbonos.ghg.internal;

import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

class GhgRuleViolationException extends ErrorResponseException {

	GhgRuleViolationException(String detail) {
		super(HttpStatus.CONFLICT);
		setTitle("Operation not allowed");
		setDetail(detail);
	}
}
