package com.carbonos.ghg.internal;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

class InvalidPeriodException extends ErrorResponseException {

	InvalidPeriodException() {
		super(HttpStatus.UNPROCESSABLE_ENTITY);
		setTitle("Invalid period");
		setDetail("The period end must not be before its start.");
		getBody().setProperty("errors", Map.of("periodEnd", "Must not be before the period start."));
	}
}
