package com.carbonos.ghg.internal.web.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import com.carbonos.ghg.internal.Evidence;

/** A source document with the record it stands behind (spec 04.6). */
public record EvidenceDocumentResponse(UUID id, Evidence.Kind kind, String name, String url, String contentType,
		Long sizeBytes, String uploadedBy, Instant uploadedAt, UUID activityId, int recordNo, String recordRef,
		String activityType, String streamName, UUID facilityId, String facilityName, LocalDate periodStart,
		LocalDate periodEnd, String evidenceRef, boolean recordRemoved, boolean calculated) {

	/** {@code calculated}: a run snapshotted the record, so this document cannot be removed (spec 04.6). */
	public static EvidenceDocumentResponse from(Evidence evidence, boolean calculated) {
		var activity = evidence.getActivity();
		var stream = activity.getStream();
		return new EvidenceDocumentResponse(evidence.getId(), evidence.getKind(), evidence.getName(),
				evidence.getUrl(), evidence.getContentType(), evidence.getSizeBytes(), evidence.getUploadedBy(),
				evidence.getUploadedAt(), activity.getId(), activity.getRecordNo(), activity.getRecordRef(),
				activity.getActivityType(), stream == null ? null : stream.getName(), activity.getFacility().getId(),
				activity.getFacility().getName(), activity.getPeriodStart(), activity.getPeriodEnd(),
				activity.getEvidenceRef(), activity.isDeleted(), calculated);
	}
}
