package com.carbonos.ghg.internal;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

/**
 * Another live organization already carries the name (spec 01.8): a 409 that
 * names each one with its account number, so the reader can tell whether
 * theirs is a different organization. Re-sending the request with
 * {@code allowDuplicateName} proceeds; the client detects this refusal by the
 * {@code duplicates} property, not by the status.
 */
class DuplicateOrganizationNameException extends ErrorResponseException {

	DuplicateOrganizationNameException(String name, List<Organization> duplicates) {
		super(HttpStatus.CONFLICT);
		setTitle("Duplicate organization name");
		setDetail("An organization named '" + name + "' already exists: "
				+ duplicates.stream().map(AccountNumbers::label).collect(Collectors.joining(", "))
				+ ". Confirm to use the name anyway.");
		getBody().setProperty("duplicates", duplicates.stream()
			.map(organization -> Map.of("id", organization.getId().toString(), "name", organization.getName(),
					"accountNo", organization.getAccountNo()))
			.toList());
	}
}
