package com.carbonos.ghg.internal.web.dto;

import java.time.Instant;

import com.carbonos.ghg.internal.FactorPackEvent;

/** One entry of an edition's publication trail (spec 02.5). */
public record FactorPackEventResponse(FactorPackEvent.Action action, String actor, String detail, Instant occurredAt) {

	public static FactorPackEventResponse from(FactorPackEvent event) {
		return new FactorPackEventResponse(event.getAction(), event.getActorEmail(), event.getDetail(),
				event.getOccurredAt());
	}
}
