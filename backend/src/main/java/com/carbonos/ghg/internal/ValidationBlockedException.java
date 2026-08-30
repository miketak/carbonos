package com.carbonos.ghg.internal;

import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

class ValidationBlockedException extends ErrorResponseException {

	ValidationBlockedException(long errorCount) {
		super(HttpStatus.CONFLICT);
		setTitle("Validation failing");
		setDetail("This inventory has " + errorCount + " blocking validation finding"
				+ (errorCount == 1 ? "" : "s") + ". Resolve them before launching a run.");
	}
}
