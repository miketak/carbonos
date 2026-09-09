package com.carbonos.ghg.internal.web;

import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.carbonos.ghg.internal.GhgService;
import com.carbonos.ghg.internal.OrgRole;
import com.carbonos.ghg.internal.OrganizationMember;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** An organization's members and their roles (spec 01.2); owners and platform administrators only. */
@RestController
@RequestMapping("/api/ghg/organizations/{organizationId}/members")
class MemberController {

	record AddMemberRequest(@NotBlank @Email String email, @NotNull OrgRole role) {
	}

	record RoleRequest(@NotNull OrgRole role) {
	}

	record MemberResponse(UUID id, UUID userId, String email, String displayName, OrgRole role, Instant createdAt) {
		static MemberResponse from(OrganizationMember member) {
			return new MemberResponse(member.getId(), member.getUserId(), member.getEmail(), member.getDisplayName(),
					member.getRole(), member.getCreatedAt());
		}
	}

	private final GhgService ghgService;

	MemberController(GhgService ghgService) {
		this.ghgService = ghgService;
	}

	@GetMapping
	List<MemberResponse> list(@PathVariable UUID organizationId) {
		return ghgService.listMembers(organizationId).stream().map(MemberResponse::from).toList();
	}

	@PostMapping
	ResponseEntity<MemberResponse> add(@PathVariable UUID organizationId, @Valid @RequestBody AddMemberRequest body) {
		var member = ghgService.addMember(organizationId, body.email(), body.role());
		URI location = ServletUriComponentsBuilder.fromCurrentContextPath()
			.path("/api/ghg/organizations/{organizationId}/members/{id}")
			.buildAndExpand(organizationId, member.getId())
			.toUri();
		return ResponseEntity.created(location).body(MemberResponse.from(member));
	}

	@PutMapping("/{memberId}")
	MemberResponse changeRole(@PathVariable UUID organizationId, @PathVariable UUID memberId,
			@Valid @RequestBody RoleRequest body) {
		return MemberResponse.from(ghgService.changeMemberRole(organizationId, memberId, body.role()));
	}

	@DeleteMapping("/{memberId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void remove(@PathVariable UUID organizationId, @PathVariable UUID memberId) {
		ghgService.removeMember(organizationId, memberId);
	}
}
