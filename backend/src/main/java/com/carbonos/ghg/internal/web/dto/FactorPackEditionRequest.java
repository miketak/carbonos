package com.carbonos.ghg.internal.web.dto;

import java.time.LocalDate;

import com.carbonos.ghg.internal.FactorPackEdition;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * A draft edition as a curator states it (spec 02.5): the publication it
 * represents and the date it applies from. {@code editionId} and
 * {@code cloneFrom} are read on creation only; an identifier is a citation key
 * and never changes.
 */
public record FactorPackEditionRequest( //
		@Size(max = 60) String editionId, //
		@Size(max = 60) String cloneFrom, //
		@NotBlank @Size(max = 200) String name, //
		@NotBlank @Size(max = 500) String source, //
		@Size(max = 500) String sourceUrl, //
		@Min(1990) @Max(2100) Integer publicationYear, //
		@Size(max = 20) String gwpBasis, //
		@Size(max = 200) String license, //
		@Size(max = 20) String retrieved, //
		@Size(max = 4000) String notes, //
		LocalDate appliesFrom) {

	public FactorPackEdition.Facts facts() {
		return new FactorPackEdition.Facts(name, source, sourceUrl, publicationYear, gwpBasis, license, retrieved,
				notes, appliesFrom);
	}
}
