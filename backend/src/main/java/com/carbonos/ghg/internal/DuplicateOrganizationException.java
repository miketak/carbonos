package com.carbonos.ghg.internal;

import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

class DuplicateOrganizationException extends ErrorResponseException {

	DuplicateOrganizationException(String name) {
		super(HttpStatus.CONFLICT);
		setTitle("Duplicate organization");
		setDetail("An organization named '" + name + "' already exists.");
	}
}
