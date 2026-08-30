package com.carbonos.user.internal.web;

import java.util.List;
import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.carbonos.user.internal.AccessRequestService;
import com.carbonos.user.AuthenticatedUser;
import com.carbonos.user.internal.web.dto.AccessRequestResponse;

/** The admin queue of spec 002: list requests, approve or deny. */
@RestController
@RequestMapping("/api/admin/access-requests")
class AccessRequestAdminController {

	private final AccessRequestService accessRequests;

	AccessRequestAdminController(AccessRequestService accessRequests) {
		this.accessRequests = accessRequests;
	}

	@GetMapping
	List<AccessRequestResponse> list() {
		return accessRequests.list().stream().map(AccessRequestResponse::from).toList();
	}

	@PostMapping("/{id}/approve")
	AccessRequestResponse approve(@PathVariable UUID id, @AuthenticationPrincipal AuthenticatedUser actor) {
		return AccessRequestResponse.from(accessRequests.approve(id, actor.getId()));
	}

	@PostMapping("/{id}/deny")
	AccessRequestResponse deny(@PathVariable UUID id, @AuthenticationPrincipal AuthenticatedUser actor) {
		return AccessRequestResponse.from(accessRequests.deny(id, actor.getId()));
	}
}
