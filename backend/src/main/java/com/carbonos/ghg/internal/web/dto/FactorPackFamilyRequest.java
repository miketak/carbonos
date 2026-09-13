package com.carbonos.ghg.internal.web.dto;

import com.carbonos.ghg.internal.FactorPackKind;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** A pack family: the lineage of one publication, keyed for good (spec 02.5). */
public record FactorPackFamilyRequest( //
		@NotBlank @Size(max = 60) String packKey, //
		@NotBlank @Size(max = 200) String name, //
		@NotNull FactorPackKind kind, //
		@Size(max = 2000) String summary) {
}
