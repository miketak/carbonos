package com.carbonos.user.internal.web;

import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.carbonos.user.internal.PasswordService;
import com.carbonos.user.internal.ProfileService;
import com.carbonos.user.AuthenticatedUser;
import com.carbonos.user.internal.web.dto.ChangePasswordRequest;
import com.carbonos.user.internal.web.dto.ProfileResponse;
import com.carbonos.user.internal.web.dto.UpdateProfileRequest;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/profile")
class ProfileController {

	private final ProfileService profile;
	private final PasswordService passwords;

	ProfileController(ProfileService profile, PasswordService passwords) {
		this.profile = profile;
		this.passwords = passwords;
	}

	@GetMapping
	ProfileResponse profile(@AuthenticationPrincipal AuthenticatedUser principal) {
		return ProfileResponse.from(profile.get(principal.getId()));
	}

	@PutMapping
	ProfileResponse update(@AuthenticationPrincipal AuthenticatedUser principal,
			@Valid @RequestBody UpdateProfileRequest body) {
		return ProfileResponse.from(profile.updateDisplayName(principal.getId(), body.displayName()));
	}

	/** Spec 01.9: this session stays signed in; every other session of the account ends. */
	@PutMapping("/password")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void changePassword(@AuthenticationPrincipal AuthenticatedUser principal,
			@Valid @RequestBody ChangePasswordRequest body, HttpServletRequest request) {
		var session = request.getSession(false);
		passwords.change(principal.getId(), body.currentPassword(), body.newPassword(),
				session == null ? null : session.getId());
	}

	@PutMapping(path = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	ProfileResponse uploadAvatar(@AuthenticationPrincipal AuthenticatedUser principal,
			@RequestPart("file") MultipartFile file) {
		return ProfileResponse.from(profile.storeAvatar(principal.getId(), file));
	}

	@GetMapping("/avatar")
	ResponseEntity<InputStreamResource> avatar(@AuthenticationPrincipal AuthenticatedUser principal) {
		var download = profile.avatar(principal.getId());
		return stream(download);
	}


	private ResponseEntity<InputStreamResource> stream(ProfileService.Download download) {
		// InputStreamResource: Spring streams the body and closes the S3 stream
		return ResponseEntity.ok()
			.contentType(MediaType.parseMediaType(download.contentType()))
			.contentLength(download.media().contentLength())
			.body(new InputStreamResource(download.media().content()));
	}
}
