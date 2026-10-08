package com.carbonos.ghg.internal.web.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.carbonos.ghg.internal.ActivityCategory;
import com.carbonos.ghg.internal.Scope;
import com.carbonos.ghg.internal.SourceStream;
import com.carbonos.ghg.internal.StreamKind;

/**
 * An emission source with the classification its records default to (specs
 * 04.3, 04.10) and the number of live records that name it, which the edit
 * page reads to know whether a change of kind or operator needs a reason.
 */
public record SourceStreamResponse(UUID id, UUID facilityId, String facilityName, String name, StreamKind kind,
		String fuel, String meterOrSupplier, boolean contractorOperated, String note, Scope defaultScope,
		ActivityCategory defaultCategory, List<ActivityCategory> allowedCategories, SourceStream.Origin origin,
		Instant createdAt, long recordCount) {

	public static SourceStreamResponse from(SourceStream stream, long recordCount) {
		return new SourceStreamResponse(stream.getId(), stream.getFacility().getId(), stream.getFacility().getName(),
				stream.getName(), stream.getKind(), stream.getFuel(), stream.getMeterOrSupplier(),
				stream.isContractorOperated(), stream.getNote(), stream.defaultScope(), stream.defaultCategory(),
				stream.getKind().categories(), stream.getOrigin(), stream.getCreatedAt(), recordCount);
	}

	/** A source just created: nothing names it yet. */
	public static SourceStreamResponse from(SourceStream stream) {
		return from(stream, 0);
	}
}
