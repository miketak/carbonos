package com.carbonos.ghg.internal.web.dto;

import java.util.List;
import java.util.UUID;

import com.carbonos.ghg.internal.GhgService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

/**
 * One act over several records (spec 04.11): which records, what to do, the one
 * value the action needs, and the reason every record's revision or tombstone
 * carries. The service refuses an empty or oversized selection by rule.
 */
public record BulkActivityRequest(List<UUID> ids, @Size(max = 500) String reason, GhgService.BulkAction action,
		UUID streamId, @Min(1) @Max(5) Integer dataQualityTier, @Valid Link link) {

	public record Link(@Size(max = 255) String name, @Size(max = 1000) String url) {
	}

	public GhgService.BulkRequest toRequest() {
		return new GhgService.BulkRequest(ids == null ? List.of() : ids, reason, action, streamId, dataQualityTier,
				link == null ? null : link.name(), link == null ? null : link.url());
	}
}
