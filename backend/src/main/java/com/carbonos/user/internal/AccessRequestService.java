package com.carbonos.user.internal;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.carbonos.user.AccessRequestApproved;
import com.carbonos.user.AccessRequestDenied;

/**
 * The self-service registration loop (spec 01.1): visitors submit requests,
 * admins decide, approved requests carry a single-use 7-day setup token that
 * turns into an ACTIVE MEMBER account when the password is set.
 */
@Service
@Transactional
public class AccessRequestService {

	private static final Duration TOKEN_TTL = Duration.ofDays(7);
	private static final SecureRandom RANDOM = new SecureRandom();

	private final AccessRequestRepository requests;
	private final UserRepository users;
	private final UserService userService;
	private final ApplicationEventPublisher events;

	AccessRequestService(AccessRequestRepository requests, UserRepository users, UserService userService,
			ApplicationEventPublisher events) {
		this.requests = requests;
		this.users = users;
		this.userService = userService;
		this.events = events;
	}

	public AccessRequest submit(String email, String displayName, String company) {
		var normalized = UserService.normalize(email);
		if (users.existsByEmail(normalized) || requests.existsByEmailAndStatus(normalized, AccessRequestStatus.PENDING)) {
			throw new DuplicateAccessRequestException(normalized);
		}
		try {
			return requests.saveAndFlush(new AccessRequest(normalized, displayName, company));
		}
		catch (DataIntegrityViolationException ex) {
			throw new DuplicateAccessRequestException(normalized);
		}
	}

	@Transactional(readOnly = true)
	public List<AccessRequest> list() {
		return requests.findAllByOrderByCreatedAtDesc();
	}

	public AccessRequest approve(UUID id, UUID actorId) {
		var request = getPending(id);
		var token = newToken();
		request.approve(token, Instant.now().plus(TOKEN_TTL), actorId);
		events.publishEvent(new AccessRequestApproved(request.getId(), request.getEmail(),
				request.getDisplayName(), token));
		return request;
	}

	public AccessRequest deny(UUID id, UUID actorId) {
		var request = getPending(id);
		request.deny(actorId);
		events.publishEvent(new AccessRequestDenied(request.getId(), request.getEmail(),
				request.getDisplayName()));
		return request;
	}

	@Transactional(readOnly = true)
	public AccessRequest getBySetupToken(String token) {
		return findLiveByToken(token);
	}

	/** Sets the password: creates the account and consumes the token. */
	public User complete(String token, String rawPassword) {
		var request = findLiveByToken(token);
		var user = userService.create(request.getEmail(), request.getDisplayName(), UserRole.MEMBER, rawPassword);
		request.complete();
		return user;
	}

	private AccessRequest findLiveByToken(String token) {
		return requests.findBySetupToken(token)
			.filter(request -> request.getStatus() == AccessRequestStatus.APPROVED)
			.filter(request -> request.getTokenExpiresAt() != null
					&& request.getTokenExpiresAt().isAfter(Instant.now()))
			.orElseThrow(InvalidSetupTokenException::new);
	}

	private AccessRequest getPending(UUID id) {
		var request = requests.findById(id).orElseThrow(() -> new AccessRequestNotFoundException(id));
		if (request.getStatus() != AccessRequestStatus.PENDING) {
			throw new UserRuleViolationException(
					"This request was already decided (" + request.getStatus() + ").");
		}
		return request;
	}

	private static String newToken() {
		var bytes = new byte[32];
		RANDOM.nextBytes(bytes);
		return HexFormat.of().formatHex(bytes);
	}
}
