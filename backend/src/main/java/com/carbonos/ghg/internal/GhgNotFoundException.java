package com.carbonos.ghg.internal;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

class GhgNotFoundException extends ErrorResponseException {

	private GhgNotFoundException(String what, UUID id) {
		super(HttpStatus.NOT_FOUND);
		setTitle(what + " not found");
		setDetail("No " + what.toLowerCase() + " exists with id " + id + ".");
	}

	static GhgNotFoundException organization(UUID id) {
		return new GhgNotFoundException("Organization", id);
	}

	static GhgNotFoundException facility(UUID id) {
		return new GhgNotFoundException("Facility", id);
	}

	static GhgNotFoundException activity(UUID id) {
		return new GhgNotFoundException("Activity", id);
	}

	static GhgNotFoundException emissionFactor(UUID id) {
		return new GhgNotFoundException("Emission factor", id);
	}

	static GhgNotFoundException run(UUID id) {
		return new GhgNotFoundException("Run", id);
	}

	static GhgNotFoundException inventory(UUID id) {
		return new GhgNotFoundException("Inventory", id);
	}

	static GhgNotFoundException assignment(UUID id) {
		return new GhgNotFoundException("Assignment", id);
	}

	static GhgNotFoundException boundaryTreatment(UUID id) {
		return new GhgNotFoundException("Boundary treatment", id);
	}
}
