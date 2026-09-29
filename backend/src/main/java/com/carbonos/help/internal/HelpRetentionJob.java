package com.carbonos.help.internal;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.time.ZoneOffset;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Trims the help record to its retention every night at 03:30 (spec 09):
 * votes after 365 days, misses not seen for 180, day counters after 400. The
 * record measures the help, not the readers, so nothing in it needs to
 * outlive the question it answers.
 */
@Component
public class HelpRetentionJob {

	static final Duration FEEDBACK_RETENTION = Duration.ofDays(365);

	static final Duration MISS_RETENTION = Duration.ofDays(180);

	static final Period DAY_RETENTION = Period.ofDays(400);

	private static final Logger log = LoggerFactory.getLogger(HelpRetentionJob.class);

	private final HelpFeedbackRepository feedback;

	private final HelpSearchMissRepository misses;

	private final HelpSearchDayRepository days;

	HelpRetentionJob(HelpFeedbackRepository feedback, HelpSearchMissRepository misses, HelpSearchDayRepository days) {
		this.feedback = feedback;
		this.misses = misses;
		this.days = days;
	}

	@Scheduled(cron = "0 30 3 * * *")
	@Transactional
	public void run() {
		var now = Instant.now();
		var votes = feedback.deleteByCreatedAtBefore(now.minus(FEEDBACK_RETENTION));
		var missed = misses.deleteByLastSeenBefore(now.minus(MISS_RETENTION));
		var counted = days.deleteByDayBefore(LocalDate.now(ZoneOffset.UTC).minus(DAY_RETENTION));
		if (votes + missed + counted > 0) {
			log.info("Help retention removed {} vote(s), {} missed search(es) and {} day counter(s)", votes, missed,
					counted);
		}
	}
}
