package com.carbonos.user.internal.web;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.carbonos.user.internal.UserRepository;
import com.carbonos.user.internal.UserService;
import com.carbonos.user.internal.security.AuthenticatedUser;
import com.carbonos.user.internal.web.dto.LoginRequest;
import com.carbonos.user.internal.web.dto.UserResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
class AuthController {

	private final AuthenticationManager authenticationManager;
	private final SecurityContextRepository securityContextRepository;
	private final UserRepository users;

	AuthController(AuthenticationManager authenticationManager, SecurityContextRepository securityContextRepository,
			UserRepository users) {
		this.authenticationManager = authenticationManager;
		this.securityContextRepository = securityContextRepository;
		this.users = users;
	}

	@PostMapping("/login")
	UserResponse login(@Valid @RequestBody LoginRequest body, HttpServletRequest request,
			HttpServletResponse response) {
		try {
			var authentication = authenticationManager.authenticate(UsernamePasswordAuthenticationToken
				.unauthenticated(UserService.normalize(body.email()), body.password()));
			if (request.getSession(false) != null) {
				request.changeSessionId();
			}
			var context = SecurityContextHolder.createEmptyContext();
			context.setAuthentication(authentication);
			SecurityContextHolder.setContext(context);
			securityContextRepository.saveContext(context, request, response);
			var principal = (AuthenticatedUser) authentication.getPrincipal();
			return currentUser(principal);
		}
		catch (AuthenticationException ex) {
			throw new InvalidCredentialsException();
		}
	}

	@PostMapping("/logout")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void logout(HttpServletRequest request) {
		var session = request.getSession(false);
		if (session != null) {
			session.invalidate();
		}
		SecurityContextHolder.clearContext();
	}

	@GetMapping("/me")
	UserResponse me(@AuthenticationPrincipal AuthenticatedUser principal) {
		return currentUser(principal);
	}

	private UserResponse currentUser(AuthenticatedUser principal) {
		// fresh read so role/status edits show immediately; a deleted user's
		// still-live session gets a 401 the SPA treats as logged out
		return users.findById(principal.getId())
			.map(UserResponse::from)
			.orElseThrow(InvalidCredentialsException::new);
	}
}
