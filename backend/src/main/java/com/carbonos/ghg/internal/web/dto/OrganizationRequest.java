package com.carbonos.ghg.internal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record OrganizationRequest( //
		@NotBlank @Size(max = 120) String name, //
		@Size(max = 255) String address, //
		@Size(max = 160) String contact, //
		/**
		 * The account that becomes the owner (spec 01.5). Sent only while the
		 * deployment reserves creation to administrators, because an
		 * administrator must not become the owner of a client's organization.
		 * Ignored while creation is open, where the creator is the owner.
		 */
		@Size(max = 320) String ownerEmail, //
		/**
		 * Spec 01.8: the caller has read the 409 naming the organization(s) that
		 * already carry the name and wants this name anyway. Absent means no.
		 */
		Boolean allowDuplicateName) {

	public boolean allowsDuplicateName() {
		return Boolean.TRUE.equals(allowDuplicateName);
	}
}
