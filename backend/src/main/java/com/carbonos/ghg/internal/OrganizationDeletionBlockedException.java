package com.carbonos.ghg.internal;

import java.util.List;
import java.util.Map;

import com.carbonos.ghg.GhgRules;
import com.carbonos.shared.web.RuleViolation;

/**
 * An organization cannot be deleted while any inventory is published or final
 * (spec 01.3): 409 naming each blocking inventory by name and status.
 */
class OrganizationDeletionBlockedException extends RuleViolation {

	OrganizationDeletionBlockedException(String organization, String records, List<Inventory> blockers) {
		super(GhgRules.ORGANIZATION_HAS_RECORDS, "Organization cannot be deleted", organization, records);
		getBody().setProperty("blockingInventories", blockers.stream()
			.map(inventory -> Map.of("id", inventory.getId().toString(), "name", inventory.getName(), "status",
					inventory.getStatus().name()))
			.toList());
	}
}
