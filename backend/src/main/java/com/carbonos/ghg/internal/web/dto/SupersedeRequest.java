package com.carbonos.ghg.internal.web.dto;

import jakarta.validation.constraints.Size;

/** The correction's name; absent, the published inventory's name with " (correction)". */
public record SupersedeRequest( //
		@Size(max = 120) String name) {
}
