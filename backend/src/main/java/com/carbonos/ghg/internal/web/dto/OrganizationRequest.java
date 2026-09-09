package com.carbonos.ghg.internal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record OrganizationRequest( //
		@NotBlank @Size(max = 120) String name, //
		@Size(max = 255) String address, //
		@Size(max = 160) String contact) {
}
