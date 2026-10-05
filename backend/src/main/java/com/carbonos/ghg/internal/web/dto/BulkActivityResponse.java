package com.carbonos.ghg.internal.web.dto;

import java.util.List;
import java.util.UUID;

import com.carbonos.ghg.internal.GhgService;

/** What one act over several records changed (spec 04.11): the act's id, how many records, and which. */
public record BulkActivityResponse(UUID bulkId, int applied, List<String> records) {

	public static BulkActivityResponse from(GhgService.BulkOutcome outcome) {
		return new BulkActivityResponse(outcome.bulkId(), outcome.applied(), outcome.recordRefs());
	}
}
