package com.carbonos.user.internal;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.carbonos.user.PasswordChanged;
import com.carbonos.user.PasswordResetRequested;
import com.carbonos.user.internal.UserSecurityEvent.Action;
import com.carbonos.user.internal.security.UserSessions;

/**
 * Changing and resetting a password (spec 01.9). A signed-in user changes
 * their own with the current one; anyone may ask for a reset link by email,
 * and the answer never says whether the account exists; an administrator
 * sends the same link from Users. Links are single use, valid for one hour,
 * and stored as a SHA-256 hash. A new password voids the account's open
 * links, ends its other sessions, is recorded in its security history, and
 * is announced to the account holder by email.
 */
@Service
@Transactional
public class PasswordService {

	static final Duration LINK_TTL = Duration.ofHours(1);

	/** Who asked for a self-service link: nobody is signed in, and anybody may type an address. */
	static final String ANONYMOUS = "anonymous (sign-in page)";

	private static final SecureRandom RANDOM = new SecureRandom();

	private final UserRepository users;
	private final PasswordResetTokenRepository tokens;
	private final UserSecurityEventRepository history;
	private final PasswordEncoder passwordEncoder;
	private final PasswordRateLimiter rateLimiter;
	private final UserSessions sessions;
	private final ApplicationEventPublisher events;

	PasswordService(UserRepository users, PasswordResetTokenRepository tokens, UserSecurityEventRepository history,
			PasswordEncoder passwordEncoder, PasswordRateLimiter rateLimiter, UserSessions sessions,
			ApplicationEventPublisher events) {
		this.users = users;
		this.tokens = tokens;
		this.history = history;
		this.passwordEncoder = passwordEncoder;
		this.rateLimiter = rateLimiter;
		this.sessions = sessions;
		this.events = events;
	}

	/** The profile's change: the current password proves it is the holder, not just the session. */
	public void change(UUID userId, String currentPassword, String newPassword, String currentSessionId) {
		rateLimiter.checkChange(userId.toString());
		var user = users.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
		if (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
			throw new WrongCurrentPasswordException();
		}
		if (!PasswordPolicy.accepts(newPassword)) {
			throw new WeakPasswordException("newPassword");
		}
		if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
			throw new SamePasswordException();
		}
		setPassword(user, newPassword, currentSessionId);
		history.save(new UserSecurityEvent(user, Action.PASSWORD_CHANGED, user.getId(), user.getEmail()));
		events.publishEvent(new PasswordChanged(user.getId(), user.getEmail(), user.getDisplayName(),
				PasswordChanged.How.CHANGED_ON_PROFILE, Instant.now()));
	}

	/**
	 * The sign-in page's request. Counted against the address and the client
	 * first, whatever the address is; then an ACTIVE account gets a link and
	 * anything else gets nothing, and the caller answers the same either way.
	 */
	public void requestReset(String email, String clientAddress) {
		var normalized = UserService.normalize(email);
		rateLimiter.checkResetRequest(normalized, clientAddress);
		users.findByEmail(normalized).filter(user -> user.getStatus() == UserStatus.ACTIVE).ifPresent(user -> {
			issue(user, null, false);
			history.save(new UserSecurityEvent(user, Action.PASSWORD_RESET_REQUESTED, null, ANONYMOUS));
		});
	}

	/** The administrator's action on Users: sends the link; the current password keeps working until it is used. */
	public void sendResetByAdministrator(UUID userId, UUID actorId) {
		var user = users.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
		if (user.getStatus() == UserStatus.PENDING) {
			throw new UserRuleViolationException(
					"This account has not set its first password yet; the link in its approval email still works.");
		}
		if (user.getStatus() != UserStatus.ACTIVE) {
			throw new UserRuleViolationException("Enable the account before sending a password reset link.");
		}
		var actor = users.findById(actorId).map(User::getEmail).orElse("unknown administrator");
		issue(user, actorId, true);
		history.save(new UserSecurityEvent(user, Action.PASSWORD_RESET_SENT_BY_ADMIN, actorId, actor));
	}

	/** What the reset page shows before the new password is chosen: whose account the link opens. */
	@Transactional(readOnly = true)
	public User inspect(String rawToken) {
		return users.findById(live(rawToken).getUserId()).orElseThrow(InvalidResetLinkException::unknown);
	}

	/** Sets the new password from a link, spends the link and every other open one, and ends every session. */
	public User completeReset(String rawToken, String newPassword) {
		var token = live(rawToken);
		var user = users.findById(token.getUserId())
			.filter(u -> u.getStatus() == UserStatus.ACTIVE)
			.orElseThrow(InvalidResetLinkException::unknown);
		if (!PasswordPolicy.accepts(newPassword)) {
			throw new WeakPasswordException();
		}
		setPassword(user, newPassword, null);
		history.save(new UserSecurityEvent(user, Action.PASSWORD_RESET_COMPLETED, user.getId(), user.getEmail()));
		events.publishEvent(new PasswordChanged(user.getId(), user.getEmail(), user.getDisplayName(),
				PasswordChanged.How.RESET_BY_LINK, Instant.now()));
		return user;
	}

	private void setPassword(User user, String newPassword, String keepSessionId) {
		user.changePassword(passwordEncoder.encode(newPassword));
		tokens.voidOpenLinks(user.getId(), Instant.now());
		sessions.endSessions(user.getId(), keepSessionId);
	}

	private void issue(User user, UUID requestedBy, boolean byAdministrator) {
		var raw = newToken();
		tokens.save(new PasswordResetToken(user.getId(), hash(raw), Instant.now().plus(LINK_TTL), requestedBy));
		events.publishEvent(new PasswordResetRequested(user.getId(), user.getEmail(), user.getDisplayName(), raw,
				LINK_TTL, byAdministrator));
	}

	private PasswordResetToken live(String rawToken) {
		if (rawToken == null || rawToken.isBlank()) {
			throw InvalidResetLinkException.unknown();
		}
		var token = tokens.findByTokenHash(hash(rawToken)).orElseThrow(InvalidResetLinkException::unknown);
		if (token.isUsed()) {
			throw InvalidResetLinkException.used();
		}
		if (token.isExpired(Instant.now())) {
			throw InvalidResetLinkException.expired();
		}
		return token;
	}

	static String hash(String rawToken) {
		try {
			var digest = MessageDigest.getInstance("SHA-256").digest(rawToken.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(digest);
		}
		catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException("SHA-256 is part of every Java runtime", ex);
		}
	}

	private static String newToken() {
		var bytes = new byte[32];
		RANDOM.nextBytes(bytes);
		return HexFormat.of().formatHex(bytes);
	}
}
