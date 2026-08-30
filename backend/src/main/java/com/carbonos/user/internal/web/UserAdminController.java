package com.carbonos.user.internal.web;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

import com.carbonos.user.internal.UserService;
import com.carbonos.user.AuthenticatedUser;
import com.carbonos.user.internal.web.dto.CreateUserRequest;
import com.carbonos.user.internal.web.dto.UpdateUserRequest;
import com.carbonos.user.internal.web.dto.UserResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/users")
class UserAdminController {

	private final UserService userService;

	UserAdminController(UserService userService) {
		this.userService = userService;
	}

	@GetMapping
	List<UserResponse> list() {
		return userService.list().stream().map(UserResponse::from).toList();
	}

	@GetMapping("/{id}")
	UserResponse get(@PathVariable UUID id) {
		return UserResponse.from(userService.get(id));
	}

	@PostMapping
	ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest body) {
		var user = userService.create(body.email(), body.displayName(), body.role(), body.temporaryPassword());
		URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(user.getId())
			.toUri();
		return ResponseEntity.created(location).body(UserResponse.from(user));
	}

	@PutMapping("/{id}")
	UserResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateUserRequest body,
			@AuthenticationPrincipal AuthenticatedUser actor) {
		return UserResponse
			.from(userService.update(id, body.displayName(), body.role(), body.status(), actor.getId()));
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete(@PathVariable UUID id, @AuthenticationPrincipal AuthenticatedUser actor) {
		userService.delete(id, actor.getId());
	}
}
