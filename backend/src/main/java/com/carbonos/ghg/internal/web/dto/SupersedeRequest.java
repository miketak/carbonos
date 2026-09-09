package com.carbonos.ghg.internal.web.dto;

import jakarta.validation.constraints.Size;

/** The correction's name (absent, the published one's with " (correction)") and why it is made (spec 05.3). */
public record SupersedeRequest( //
		@Size(max = 120) String name, //
		@Size(max = 1000) String reason) {
}
