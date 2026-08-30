package com.carbonos.user.internal.web;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.carbonos.user.internal.AccessRequestService;
import com.carbonos.user.internal.web.dto.CompleteAccessRequest;
import com.carbonos.user.internal.web.dto.SetupInfoResponse;
import com.carbonos.user.internal.web.dto.SubmitAccessRequest;
import com.carbonos.user.internal.web.dto.UserResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

/** The public side of spec 002: submit a request, then set the password from the emailed link. */
@RestController
@RequestMapping("/api/access-requests")
class AccessRequestController {

	private final AccessRequestService accessRequests;
	private final AuthenticationManager authenticationManager;
	private final SecurityContextRepository securityContextRepository;

	AccessRequestController(AccessRequestService accessRequests, AuthenticationManager authenticationManager,
			SecurityContextRepository securityContextRepository) {
		this.accessRequests = accessRequests;
		this.authenticationManager = authenticationManager;
		this.securityContextRepository = securityContextRepository;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.ACCEPTED)
	void submit(@Valid @RequestBody SubmitAccessRequest body) {
		accessRequests.submit(body.email(), body.displayName(), body.company());
	}

	@GetMapping("/setup/{token}")
	SetupInfoResponse setupInfo(@PathVariable String token) {
		return SetupInfoResponse.from(accessRequests.getBySetupToken(token));
	}

	@PostMapping("/complete")
	UserResponse complete(@Valid @RequestBody CompleteAccessRequest body, HttpServletRequest request,
			HttpServletResponse response) {
		var user = accessRequests.complete(body.token(), body.password());
		// sign the new user straight in — same session dance as AuthController.login
		try {
			var authentication = authenticationManager.authenticate(
					UsernamePasswordAuthenticationToken.unauthenticated(user.getEmail(), body.password()));
			if (request.getSession(false) != null) {
				request.changeSessionId();
			}
			var context = SecurityContextHolder.createEmptyContext();
			context.setAuthentication(authentication);
			SecurityContextHolder.setContext(context);
			securityContextRepository.saveContext(context, request, response);
		}
		catch (AuthenticationException ex) {
			throw new InvalidCredentialsException();
		}
		return UserResponse.from(user);
	}
}
