package com.carbonos.user.internal;

import java.time.Clock;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * The password limits of spec 01.9, counted in memory in fixed 15-minute
 * windows (the pattern of the help centre's limiter): three reset requests
 * per email address, ten per client address, and five password changes per
 * account. In memory is enough: one backend instance per environment, and the
 * limits exist to stop a script from flooding an inbox or guessing a current
 * password, not to meter a person. A sweep drops closed windows.
 */
@Component
public class PasswordRateLimiter {

	static final Duration WINDOW = Duration.ofMinutes(15);

	static final int RESET_PER_EMAIL = 3;

	static final int RESET_PER_CLIENT = 10;

	static final int CHANGE_PER_ACCOUNT = 5;

	private final Clock clock;

	private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

	@Autowired
	public PasswordRateLimiter() {
		this(Clock.systemUTC());
	}

	/** The clock is injectable so a test can close a window without sleeping. */
	PasswordRateLimiter(Clock clock) {
		this.clock = clock;
	}

	/** Counts one reset request against both the address asked for and the client asking. */
	void checkResetRequest(String normalizedEmail, String clientAddress) {
		// both counters move, so a client cannot spread one address's quota across addresses
		var emailOver = count("reset-email:" + normalizedEmail) > RESET_PER_EMAIL;
		var clientOver = count("reset-client:" + clientAddress) > RESET_PER_CLIENT;
		if (emailOver || clientOver) {
			throw new PasswordRateLimitedException(
					"Too many password reset requests. Try again in 15 minutes.");
		}
	}

	/** Counts one attempt to change the signed-in account's password. */
	void checkChange(String userId) {
		if (count("change:" + userId) > CHANGE_PER_ACCOUNT) {
			throw new PasswordRateLimitedException("Too many attempts to change the password. Try again in 15 minutes.");
		}
	}

	private int count(String key) {
		var slot = currentWindow();
		var window = windows.compute(key,
				(k, current) -> current == null || current.slot != slot ? new Window(slot) : current);
		return window.count.incrementAndGet();
	}

	@Scheduled(fixedDelayString = "PT15M", initialDelayString = "PT15M")
	void sweep() {
		var slot = currentWindow();
		windows.values().removeIf(window -> window.slot != slot);
	}

	/** Forgets every window; for tests that share one address across cases. */
	public void clear() {
		windows.clear();
	}

	private long currentWindow() {
		return clock.millis() / WINDOW.toMillis();
	}

	private static final class Window {

		final long slot;

		final AtomicInteger count = new AtomicInteger();

		Window(long slot) {
			this.slot = slot;
		}
	}
}
