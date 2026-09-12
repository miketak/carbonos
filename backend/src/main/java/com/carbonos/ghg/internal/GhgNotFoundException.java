package com.carbonos.ghg.internal;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

class GhgNotFoundException extends ErrorResponseException {

	private GhgNotFoundException(String what, UUID id, String text) {
		super(HttpStatus.NOT_FOUND);
		setTitle(what + " not found");
		setDetail(what + " " + text + " was not found.");
	}

	private GhgNotFoundException(String what, UUID id) {
		super(HttpStatus.NOT_FOUND);
		setTitle(what + " not found");
		setDetail("No " + what.toLowerCase() + " exists with id " + id + ".");
	}

	static GhgNotFoundException organization(UUID id) {
		return new GhgNotFoundException("Organization", id);
	}

	static GhgNotFoundException entity(UUID id) {
		return new GhgNotFoundException("Legal entity", id);
	}

	static GhgNotFoundException account(String email) {
		return new GhgNotFoundException("Account", null, email);
	}

	static GhgNotFoundException member(UUID id) {
		return new GhgNotFoundException("Member", id);
	}

	static GhgNotFoundException supportAccess(UUID organizationId) {
		return new GhgNotFoundException("Support access", organizationId,
				"is not held on organization " + organizationId);
	}

	static GhgNotFoundException pack(String id) {
		return new GhgNotFoundException("Factor pack", null, id);
	}

	static GhgNotFoundException stream(UUID id) {
		return new GhgNotFoundException("Source stream", id);
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

	static GhgNotFoundException boundaryVersion(UUID id) {
		return new GhgNotFoundException("Boundary version", id);
	}

	static GhgNotFoundException baseYear(UUID organizationId) {
		return new GhgNotFoundException("Base year", organizationId);
	}

	static GhgNotFoundException recalculation(UUID id) {
		return new GhgNotFoundException("Recalculation", id);
	}

	static GhgNotFoundException density(UUID id) {
		return new GhgNotFoundException("Density", id);
	}

	static GhgNotFoundException customUnit(UUID id) {
		return new GhgNotFoundException("Custom unit", id);
	}

	static GhgNotFoundException importBatch(UUID id) {
		return new GhgNotFoundException("Import", id);
	}

	static GhgNotFoundException evidence(UUID id) {
		return new GhgNotFoundException("Evidence", id);
	}

	static GhgNotFoundException marketFactor(UUID id) {
		return new GhgNotFoundException("Market factor", id);
	}
}
