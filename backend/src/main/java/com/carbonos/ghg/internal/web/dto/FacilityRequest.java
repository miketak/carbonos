package com.carbonos.ghg.internal.web.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** A facility: name, location and the legal entity it belongs to; absent, the reporting company (spec 03.1). */
public record FacilityRequest( //
		@NotBlank @Size(max = 120) String name, //
		@NotBlank @Size(max = 120) String location, //
		UUID entityId) {
}
