package com.carbonos.ghg.internal.web.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.carbonos.ghg.internal.ActivityCategory;
import com.carbonos.ghg.internal.Scope;
import com.carbonos.ghg.internal.SourceStream;
import com.carbonos.ghg.internal.StreamKind;

/** A source stream with the classification its records default to (spec 04.3). */
public record SourceStreamResponse(UUID id, UUID facilityId, String facilityName, String name, StreamKind kind,
		String fuel, String meterOrSupplier, boolean contractorOperated, String note, Scope defaultScope,
		ActivityCategory defaultCategory, List<ActivityCategory> allowedCategories, Instant createdAt) {

	public static SourceStreamResponse from(SourceStream stream) {
		return new SourceStreamResponse(stream.getId(), stream.getFacility().getId(), stream.getFacility().getName(),
				stream.getName(), stream.getKind(), stream.getFuel(), stream.getMeterOrSupplier(),
				stream.isContractorOperated(), stream.getNote(), stream.defaultScope(), stream.defaultCategory(),
				stream.getKind().categories(), stream.getCreatedAt());
	}
}
