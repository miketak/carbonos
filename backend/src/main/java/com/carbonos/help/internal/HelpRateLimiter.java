package com.carbonos.help.internal;

import java.time.Clock;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Ten requests a minute per voter per endpoint (spec 09), counted in memory
 * in fixed one-minute windows. In memory is enough: one backend instance per
 * environment today, and the limit exists to stop a script, not to meter a
 * reader. A sweep drops the windows that have closed so the map cannot grow
 * with every address that ever voted.
 */
@Component
public class HelpRateLimiter {

	static final int LIMIT = 10;

	static final Duration WINDOW = Duration.ofMinutes(1);

	private final Clock clock;

	private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

	@Autowired
	public HelpRateLimiter() {
		this(Clock.systemUTC());
	}

	/** The clock is injectable so a test can close a window without sleeping. */
	HelpRateLimiter(Clock clock) {
		this.clock = clock;
	}

	/** Counts one request; throws once the voter is past the limit for this window. */
	public void check(String endpoint, String voterHash) {
		var minute = currentWindow();
		var window = windows.compute(endpoint + ':' + voterHash,
				(key, current) -> current == null || current.minute != minute ? new Window(minute) : current);
		if (window.count.incrementAndGet() > LIMIT) {
			throw new HelpRateLimitedException();
		}
	}

	@Scheduled(fixedDelayString = "PT1M", initialDelayString = "PT1M")
	void sweep() {
		var minute = currentWindow();
		windows.values().removeIf(window -> window.minute != minute);
	}

	/** Forgets every window; for tests that share one address across cases. */
	public void clear() {
		windows.clear();
	}

	private long currentWindow() {
		return clock.millis() / WINDOW.toMillis();
	}

	private static final class Window {

		final long minute;

		final AtomicInteger count = new AtomicInteger();

		Window(long minute) {
			this.minute = minute;
		}
	}
}
