package com.carbonos.ghg.internal.web.dto;

import jakarta.validation.constraints.Size;

/** The reviewer's optional note when a run is designated final through the run itself (spec 05.5). */
public record FinalNoteRequest( //
		@Size(max = 500) String note) {
}
