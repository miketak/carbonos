package com.carbonos.user.internal.web.dto;

import java.time.Instant;
import java.util.UUID;

import com.carbonos.user.internal.AccessRequest;
import com.carbonos.user.internal.AccessRequestStatus;

public record AccessRequestResponse(UUID id, String email, String displayName, String company,
		AccessRequestStatus status, Instant createdAt, Instant decidedAt) {

	public static AccessRequestResponse from(AccessRequest request) {
		return new AccessRequestResponse(request.getId(), request.getEmail(), request.getDisplayName(),
				request.getCompany(), request.getStatus(), request.getCreatedAt(), request.getDecidedAt());
	}
}
