package com.carbonos.user.internal.web;

import java.nio.charset.StandardCharsets;

import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.carbonos.user.internal.ProfileService;
import com.carbonos.user.internal.security.AuthenticatedUser;
import com.carbonos.user.internal.web.dto.ProfileResponse;
import com.carbonos.user.internal.web.dto.UpdateProfileRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/profile")
class ProfileController {

	private final ProfileService profile;

	ProfileController(ProfileService profile) {
		this.profile = profile;
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

	@PutMapping(path = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	ProfileResponse uploadAvatar(@AuthenticationPrincipal AuthenticatedUser principal,
			@RequestPart("file") MultipartFile file) {
		return ProfileResponse.from(profile.storeAvatar(principal.getId(), file));
	}

	@GetMapping("/avatar")
	ResponseEntity<InputStreamResource> avatar(@AuthenticationPrincipal AuthenticatedUser principal) {
		var download = profile.avatar(principal.getId());
		return stream(download, false);
	}

	@PutMapping(path = "/resume", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	ProfileResponse uploadResume(@AuthenticationPrincipal AuthenticatedUser principal,
			@RequestPart("file") MultipartFile file) {
		return ProfileResponse.from(profile.storeResume(principal.getId(), file));
	}

	@GetMapping("/resume")
	ResponseEntity<InputStreamResource> resume(@AuthenticationPrincipal AuthenticatedUser principal) {
		var download = profile.resume(principal.getId());
		return stream(download, true);
	}

	private ResponseEntity<InputStreamResource> stream(ProfileService.Download download, boolean attachment) {
		var builder = ResponseEntity.ok()
			.contentType(MediaType.parseMediaType(download.contentType()))
			.contentLength(download.media().contentLength());
		if (attachment) {
			var filename = download.filename() != null ? download.filename() : "download";
			builder.header(HttpHeaders.CONTENT_DISPOSITION,
					ContentDisposition.attachment().filename(filename, StandardCharsets.UTF_8).build().toString());
		}
		// InputStreamResource: Spring streams the body and closes the S3 stream
		return builder.body(new InputStreamResource(download.media().content()));
	}
}
