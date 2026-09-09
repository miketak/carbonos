package com.carbonos.ghg.internal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** A link to a document held elsewhere (spec 04.4). */
public record EvidenceLinkRequest( //
		@Size(max = 255) String name, //
		@NotBlank @Size(max = 1000) String url) {
}
