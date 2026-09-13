package com.carbonos.ghg.internal.web.dto;

import java.time.LocalDate;

import com.carbonos.ghg.internal.FactorPackPublication;

import jakarta.validation.constraints.Size;

/**
 * What an approver states when publishing an edition (spec 02.5): the source
 * document they checked it against and the date it applies from. Whether it is
 * an erratum is theirs to state too, because an erratum marks its predecessor
 * as holding an error rather than merely superseding it.
 */
public record FactorPackPublishRequest( //
		@Size(max = 500) String sourceDocument, //
		LocalDate appliesFrom, //
		// a boxed Boolean, because the field is optional and an absent one is not an erratum
		Boolean erratum, //
		@Size(max = 1000) String erratumNote) {

	public FactorPackPublication.PublishRequest toRequest() {
		return new FactorPackPublication.PublishRequest(sourceDocument, appliesFrom, Boolean.TRUE.equals(erratum),
				erratumNote);
	}
}
