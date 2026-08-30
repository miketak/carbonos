package com.carbonos.user.internal.web.dto;

import com.carbonos.user.internal.AccessRequest;

/** What the set-password page needs to greet the requester. */
public record SetupInfoResponse(String email, String displayName) {

	public static SetupInfoResponse from(AccessRequest request) {
		return new SetupInfoResponse(request.getEmail(), request.getDisplayName());
	}
}
