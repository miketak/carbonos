package com.carbonos.ghg.internal.web.dto;

import com.carbonos.ghg.internal.StreamKind;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** A source stream of a facility (spec 04.3). */
public record SourceStreamRequest( //
		@NotBlank @Size(max = 120) String name, //
		@NotNull StreamKind kind, //
		@Size(max = 80) String fuel, //
		@Size(max = 120) String meterOrSupplier, //
		Boolean contractorOperated, //
		@Size(max = 255) String note) {
}
