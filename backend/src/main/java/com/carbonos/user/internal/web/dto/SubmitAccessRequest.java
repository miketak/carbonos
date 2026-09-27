package com.carbonos.user.internal.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import com.carbonos.user.internal.AccessRequestIntent;

public record SubmitAccessRequest(
		@NotBlank @Email @Size(max = 320) String email, //
		@NotBlank @Size(max = 100) String displayName, //
		@Size(max = 150) String company, //
		AccessRequestIntent intent, //
		@Size(max = 1000) String message) {
}
