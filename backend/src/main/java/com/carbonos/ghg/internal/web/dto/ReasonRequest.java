package com.carbonos.ghg.internal.web.dto;

import jakarta.validation.constraints.Size;

/** The reason an act on the record needs (spec 05.2): voiding a run, withdrawing a final designation. */
public record ReasonRequest( //
		// the length is the service's refusal (ghg.reason-too-short), so the problem detail names the rule
		@Size(max = 500) String reason) {
}
