package com.carbonos.ghg.internal.web.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RunRequest( //
		@NotBlank @Size(max = 120) String label, //
		@NotNull LocalDate periodStart, //
		@NotNull LocalDate periodEnd) {
}
