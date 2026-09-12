package com.carbonos.ghg.internal.web;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.carbonos.ghg.internal.SupportAccessService;
import com.carbonos.ghg.internal.web.dto.AdminOrganizationResponse;

/**
 * The administrators' list of organizations (spec 01.3): the way support
 * staff find an organization they are not a member of. Under
 * {@code /api/admin/**}, which the security filter reserves for the ADMIN
 * platform role, and checked again in the service.
 */
@RestController
@RequestMapping("/api/admin/organizations")
class AdminOrganizationController {

	private final SupportAccessService supportAccess;

	AdminOrganizationController(SupportAccessService supportAccess) {
		this.supportAccess = supportAccess;
	}

	@GetMapping
	List<AdminOrganizationResponse> list() {
		return supportAccess.listForAdministrator().stream().map(AdminOrganizationResponse::from).toList();
	}
}
