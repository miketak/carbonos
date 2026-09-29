package com.carbonos.user.internal;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;

/** Spec 01.9's limits, and a fresh 15-minute window is a fresh budget. */
class PasswordRateLimiterTest {

	private final MutableClock clock = new MutableClock(Instant.parse("2026-09-29T10:00:00Z"));

	private final PasswordRateLimiter limiter = new PasswordRateLimiter(clock);

	@Test
	void theFourthRequestForOneAddressIsRefusedUntilTheWindowCloses() {
		for (int i = 0; i < PasswordRateLimiter.RESET_PER_EMAIL; i++) {
			limiter.checkResetRequest("kofi@ecoriv.com", "client-" + i);
		}
		assertThatThrownBy(() -> limiter.checkResetRequest("kofi@ecoriv.com", "client-9"))
			.isInstanceOf(PasswordRateLimitedException.class);
		assertThatCode(() -> limiter.checkResetRequest("ama@ecoriv.com", "client-9")).doesNotThrowAnyException();

		clock.advance(PasswordRateLimiter.WINDOW);
		assertThatCode(() -> limiter.checkResetRequest("kofi@ecoriv.com", "client-9")).doesNotThrowAnyException();
	}

	@Test
	void theEleventhRequestFromOneClientIsRefusedWhateverTheAddress() {
		for (int i = 0; i < PasswordRateLimiter.RESET_PER_CLIENT; i++) {
			limiter.checkResetRequest("person" + i + "@ecoriv.com", "client-a");
		}
		assertThatThrownBy(() -> limiter.checkResetRequest("another@ecoriv.com", "client-a"))
			.isInstanceOf(PasswordRateLimitedException.class);
		assertThatCode(() -> limiter.checkResetRequest("another@ecoriv.com", "client-b")).doesNotThrowAnyException();
	}

	@Test
	void theSixthChangeInAWindowIsRefused() {
		for (int i = 0; i < PasswordRateLimiter.CHANGE_PER_ACCOUNT; i++) {
			limiter.checkChange("user-1");
		}
		assertThatThrownBy(() -> limiter.checkChange("user-1")).isInstanceOf(PasswordRateLimitedException.class);
		assertThatCode(() -> limiter.checkChange("user-2")).doesNotThrowAnyException();
	}

	@Test
	void theSweepDropsClosedWindows() {
		for (int i = 0; i < PasswordRateLimiter.CHANGE_PER_ACCOUNT; i++) {
			limiter.checkChange("user-1");
		}
		clock.advance(Duration.ofMinutes(16));
		limiter.sweep();
		assertThatCode(() -> limiter.checkChange("user-1")).doesNotThrowAnyException();
	}

	private static final class MutableClock extends Clock {

		private Instant now;

		MutableClock(Instant now) {
			this.now = now;
		}

		void advance(Duration duration) {
			now = now.plus(duration);
		}

		@Override
		public ZoneId getZone() {
			return ZoneOffset.UTC;
		}

		@Override
		public Clock withZone(ZoneId zone) {
			return this;
		}

		@Override
		public Instant instant() {
			return now;
		}
	}
}
