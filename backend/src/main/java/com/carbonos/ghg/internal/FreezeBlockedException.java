package com.carbonos.ghg.internal;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.carbonos.ghg.GhgRules;
import com.carbonos.shared.web.RuleViolation;

/**
 * A freeze refused because the classification is not clean (spec 05.5): 409
 * with the blocking records named in the detail and listed under
 * {@code errors.records}.
 */
class FreezeBlockedException extends RuleViolation {

	FreezeBlockedException(List<InventoryService.FreezeBlocker> records) {
		super(GhgRules.INVENTORY_FREEZE_BLOCKED, "Operation not allowed",
				records.size() + (records.size() == 1 ? " record blocks" : " records block"), listed(records));
		getBody().setProperty("errors", Map.of("records", records));
	}

	private static String listed(List<InventoryService.FreezeBlocker> records) {
		return records.stream()
			.limit(10)
			.map(record -> record.recordRef() + " '" + record.activityType() + "' at " + record.facilityName() + " "
					+ record.problem())
			.collect(Collectors.joining(", "))
				+ (records.size() > 10 ? ", and " + (records.size() - 10) + " more" : "");
	}
}
