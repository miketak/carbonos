package com.carbonos.user.internal.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.carbonos.user.internal.AccessRequestRepository;
import com.carbonos.user.internal.AccessRequestStatus;
import com.carbonos.user.internal.UserRepository;
import com.carbonos.user.internal.UserRole;
import com.carbonos.user.internal.UserStatus;
import com.carbonos.user.internal.web.dto.AccountsSummaryResponse;

/**
 * The accounts figures the administration panel opens on (spec 01.5). Under
 * {@code /api/admin/**}, which the security filter reserves for the ADMIN
 * platform role.
 */
@RestController
@RequestMapping("/api/admin/summary/accounts")
class AdminSummaryController {

	private final UserRepository users;

	private final AccessRequestRepository accessRequests;

	AdminSummaryController(UserRepository users, AccessRequestRepository accessRequests) {
		this.users = users;
		this.accessRequests = accessRequests;
	}

	@GetMapping
	AccountsSummaryResponse get() {
		return new AccountsSummaryResponse(users.count(), users.countByStatus(UserStatus.ACTIVE),
				users.countByStatus(UserStatus.PENDING),
				users.countByRoleAndStatus(UserRole.ADMIN, UserStatus.ACTIVE),
				accessRequests.countByStatus(AccessRequestStatus.PENDING));
	}
}
