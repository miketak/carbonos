package com.carbonos.ghg.internal;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

/**
 * A freeze refused because the classification is not clean (spec 05.5): 409
 * with the blocking records named in the detail and listed under
 * {@code errors.records}.
 */
class FreezeBlockedException extends ErrorResponseException {

	FreezeBlockedException(List<InventoryService.FreezeBlocker> records) {
		super(HttpStatus.CONFLICT);
		setTitle("Operation not allowed");
		var listed = records.stream()
			.limit(10)
			.map(record -> record.recordRef() + " '" + record.activityType() + "' at " + record.facilityName() + " "
					+ record.problem())
			.collect(Collectors.joining(", "));
		setDetail(records.size() + " record" + (records.size() == 1 ? " blocks" : "s block") + " the freeze: " + listed
				+ (records.size() > 10 ? ", and " + (records.size() - 10) + " more" : "")
				+ ". Classify or exclude them first.");
		getBody().setProperty("errors", Map.of("records", records));
	}
}
