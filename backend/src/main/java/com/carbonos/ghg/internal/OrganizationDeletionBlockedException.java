package com.carbonos.ghg.internal;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

/**
 * An organization cannot be deleted while any inventory is published or final
 * (spec 01.3): 409 naming each blocking inventory by name and status.
 */
class OrganizationDeletionBlockedException extends ErrorResponseException {

	OrganizationDeletionBlockedException(String detail, List<Inventory> blockers) {
		super(HttpStatus.CONFLICT);
		setTitle("Organization cannot be deleted");
		setDetail(detail);
		getBody().setProperty("blockingInventories", blockers.stream()
			.map(inventory -> Map.of("id", inventory.getId().toString(), "name", inventory.getName(), "status",
					inventory.getStatus().name()))
			.toList());
	}
}
