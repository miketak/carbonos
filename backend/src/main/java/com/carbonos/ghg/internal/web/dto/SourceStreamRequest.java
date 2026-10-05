package com.carbonos.ghg.internal.web.dto;

import com.carbonos.ghg.internal.GhgService;
import com.carbonos.ghg.internal.StreamKind;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** An emission source of a facility (specs 04.3, 04.10). */
public record SourceStreamRequest( //
		@NotBlank @Size(max = 120) String name, //
		@NotNull StreamKind kind, //
		@Size(max = 80) String fuel, //
		@Size(max = 120) String meterOrSupplier, //
		Boolean contractorOperated, //
		@Size(max = 255) String note) {

	public GhgService.StreamFacts toFacts() {
		return new GhgService.StreamFacts(name, kind, fuel, meterOrSupplier, Boolean.TRUE.equals(contractorOperated),
				note);
	}
}
