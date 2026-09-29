package com.carbonos.help.internal;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;

/** Ten a minute per voter per endpoint, and a fresh minute is a fresh budget (spec 09). */
class HelpRateLimiterTest {

	private final MutableClock clock = new MutableClock(Instant.parse("2026-09-28T10:00:00Z"));

	private final HelpRateLimiter limiter = new HelpRateLimiter(clock);

	@Test
	void theEleventhRequestInAMinuteIsRefusedAndTheNextMinuteIsNot() {
		for (int i = 0; i < HelpRateLimiter.LIMIT; i++) {
			limiter.check("feedback", "voter-a");
		}
		assertThatThrownBy(() -> limiter.check("feedback", "voter-a")).isInstanceOf(HelpRateLimitedException.class);

		// each endpoint and each voter has its own budget
		assertThatCode(() -> limiter.check("searches", "voter-a")).doesNotThrowAnyException();
		assertThatCode(() -> limiter.check("feedback", "voter-b")).doesNotThrowAnyException();

		clock.advance(Duration.ofMinutes(1));
		assertThatCode(() -> limiter.check("feedback", "voter-a")).doesNotThrowAnyException();
	}

	@Test
	void theSweepDropsClosedWindowsWithoutTouchingTheOpenOne() {
		for (int i = 0; i < HelpRateLimiter.LIMIT; i++) {
			limiter.check("feedback", "voter-a");
		}
		limiter.sweep();
		assertThatThrownBy(() -> limiter.check("feedback", "voter-a")).isInstanceOf(HelpRateLimitedException.class);

		clock.advance(Duration.ofMinutes(1));
		limiter.sweep();
		assertThatCode(() -> limiter.check("feedback", "voter-a")).doesNotThrowAnyException();
	}

	private static final class MutableClock extends Clock {

		private Instant now;

		MutableClock(Instant now) {
			this.now = now;
		}

		void advance(Duration by) {
			now = now.plus(by);
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
