package com.carbonos.ghg.internal.web.dto;

import java.time.Instant;

import com.carbonos.ghg.internal.SupportAccess;

/** One active support grant (spec 01.3): who holds it, since when, until when, and why. */
public record SupportAccessResponse(String adminEmail, Instant grantedAt, Instant expiresAt, String reason) {

	public static SupportAccessResponse from(SupportAccess grant) {
		return new SupportAccessResponse(grant.getAdminEmail(), grant.getGrantedAt(), grant.getExpiresAt(),
				grant.getReason());
	}
}
