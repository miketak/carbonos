package com.carbonos.ghg.internal.web.dto;

import java.time.Instant;
import java.util.UUID;

import com.carbonos.ghg.internal.Evidence;

/** A file or link attached to a record or an instrument (spec 04.4). */
public record EvidenceResponse(UUID id, Evidence.Kind kind, String name, String url, String contentType,
		Long sizeBytes, String uploadedBy, Instant uploadedAt) {

	public static EvidenceResponse from(Evidence evidence) {
		return new EvidenceResponse(evidence.getId(), evidence.getKind(), evidence.getName(), evidence.getUrl(),
				evidence.getContentType(), evidence.getSizeBytes(), evidence.getUploadedBy(),
				evidence.getUploadedAt());
	}
}
