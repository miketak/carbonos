package com.carbonos.user.internal.web;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.carbonos.user.internal.PasswordService;
import com.carbonos.user.internal.web.dto.CompletePasswordReset;
import com.carbonos.user.internal.web.dto.PasswordResetInfoResponse;
import com.carbonos.user.internal.web.dto.PasswordResetRequest;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * The public side of spec 01.9: ask for a reset link, read what a link
 * opens, and set the new password with it. CSRF applies to both POSTs.
 */
@RestController
@RequestMapping("/api/auth/password-reset")
class PasswordResetController {

	private final PasswordService passwords;

	PasswordResetController(PasswordService passwords) {
		this.passwords = passwords;
	}

	/** 202 whether or not the address has an account: the answer must not tell. */
	@PostMapping
	@ResponseStatus(HttpStatus.ACCEPTED)
	void request(@Valid @RequestBody PasswordResetRequest body, HttpServletRequest request) {
		passwords.requestReset(body.email(), request.getRemoteAddr());
	}

	@GetMapping("/{token}")
	PasswordResetInfoResponse info(@PathVariable String token) {
		return PasswordResetInfoResponse.from(passwords.inspect(token));
	}

	/** Sets the password; the holder signs in afresh, since every session of the account has ended. */
	@PostMapping("/complete")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void complete(@Valid @RequestBody CompletePasswordReset body) {
		passwords.completeReset(body.token(), body.password());
	}
}
