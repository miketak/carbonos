package com.carbonos.ghg.internal.web.dto;

import java.time.Instant;
import java.util.UUID;

import com.carbonos.ghg.internal.GhgAuditEvent;

/** One recorded act on an inventory (spec 05.2). */
public record AuditEventResponse(UUID id, GhgAuditEvent.Action action, UUID runId, Integer runNo, String actor,
		String reason, Instant at) {

	public static AuditEventResponse from(GhgAuditEvent event) {
		return new AuditEventResponse(event.getId(), event.getAction(), event.getRunId(), event.getRunNo(),
				event.getActor(), event.getReason(), event.getCreatedAt());
	}
}
