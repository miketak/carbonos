package com.carbonos.help.internal;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.carbonos.help.internal.HelpFeedbackRepository.PageStats;

import jakarta.persistence.criteria.Predicate;

/**
 * The help centre's record (spec 09): votes in, missed searches in, the
 * administrator's figures out. The rules that keep a person out of the
 * record live here rather than on the DTOs, because they act on the cleaned
 * value (a comment counts its length after control characters are gone) and
 * across fields (a reason goes only with a No).
 */
@Service
@Transactional
public class HelpService {

	static final Pattern SLUG = Pattern.compile("^(glossary|[a-z0-9-]{1,60}/[a-z0-9-]{1,100})$");

	static final int COMMENT_MAX_LENGTH = 500;

	static final int QUERY_MAX_LENGTH = 120;

	static final int QUERY_MIN_LENGTH = 2;

	static final int MIN_VOTES_FOR_TARGET = 5;

	static final double HELPFUL_TARGET = 0.8;

	static final int PAGE_SIZE_MAX = 200;

	private static final int SUMMARY_DAYS = 30;

	private static final int SUMMARY_LIMIT = 5;

	private static final Pattern EMAIL = Pattern.compile("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");

	private static final Pattern DIGIT_RUN = Pattern.compile("[0-9]{9,}");

	private static final Pattern LINE_BREAKS = Pattern.compile("[\\r\\n\\t]+");

	private static final Pattern CONTROL = Pattern.compile("\\p{Cc}");

	private static final Pattern PUNCTUATION = Pattern.compile("[\\p{P}\\p{S}]");

	private static final Pattern WHITESPACE = Pattern.compile("\\s+");

	/** The dashboard's figures: the last 30 days, plus the worst pages and the top misses. */
	public record Summary(long votes30d, long helpful30d, long searches30d, long misses30d,
			List<PageStats> pagesBelowTarget, List<HelpSearchMiss> topMisses) {
	}

	private final HelpFeedbackRepository feedback;

	private final HelpSearchMissRepository misses;

	private final HelpSearchDayRepository days;

	HelpService(HelpFeedbackRepository feedback, HelpSearchMissRepository misses, HelpSearchDayRepository days) {
		this.feedback = feedback;
		this.misses = misses;
		this.days = days;
	}

	/** Records a vote; a voter's earlier vote on the same article is replaced. */
	public void recordFeedback(String voterHash, String pageSlug, boolean helpful, HelpFeedbackReason reason,
			String comment) {
		if (pageSlug == null || !SLUG.matcher(pageSlug).matches()) {
			throw new HelpFieldException("pageSlug", "Not a help article.");
		}
		if (!helpful && reason == null) {
			throw new HelpFieldException("reason", "Choose a reason.");
		}
		if (helpful && reason != null) {
			throw new HelpFieldException("reason", "A reason goes only with No.");
		}
		var cleaned = cleanComment(comment);
		feedback.upsert(pageSlug, helpful, reason == null ? null : reason.name(), cleaned, voterHash, Instant.now());
	}

	/**
	 * Line breaks and tabs become spaces, other control characters go, and
	 * the result is measured and screened: no email address, no run of nine
	 * or more digits, so nobody leaves a phone number by accident.
	 */
	static String cleanComment(String comment) {
		if (comment == null) {
			return null;
		}
		var cleaned = CONTROL.matcher(LINE_BREAKS.matcher(comment).replaceAll(" ")).replaceAll("").strip();
		if (cleaned.isEmpty()) {
			return null;
		}
		if (cleaned.length() > COMMENT_MAX_LENGTH) {
			throw new HelpFieldException("comment", "Keep the comment to " + COMMENT_MAX_LENGTH + " characters.");
		}
		if (EMAIL.matcher(cleaned).find()) {
			throw new HelpFieldException("comment", "Don't include an email address.");
		}
		if (DIGIT_RUN.matcher(cleaned).find()) {
			throw new HelpFieldException("comment", "Don't include a phone number or another long number.");
		}
		return cleaned;
	}

	/**
	 * Counts a search on today's row and, when it found nothing, keeps its
	 * normalized text. A query shorter than two characters counts on the day
	 * but is not kept: it says nothing about what the reader wanted.
	 */
	public void recordSearch(boolean hit, String query) {
		if (hit) {
			days.count(today(), 0);
			return;
		}
		if (query == null) {
			throw new HelpFieldException("query", "Say what was searched for.");
		}
		days.count(today(), 1);
		var normalized = normalizeQuery(query);
		if (normalized.length() >= QUERY_MIN_LENGTH) {
			misses.upsert(normalized, Instant.now());
		}
	}

	/** Trimmed, lower case, punctuation gone, whitespace collapsed, at most 120 characters. */
	static String normalizeQuery(String query) {
		var normalized = CONTROL.matcher(query).replaceAll(" ");
		normalized = PUNCTUATION.matcher(normalized).replaceAll("");
		normalized = WHITESPACE.matcher(normalized.toLowerCase(Locale.ROOT)).replaceAll(" ").strip();
		if (normalized.length() > QUERY_MAX_LENGTH) {
			normalized = normalized.substring(0, QUERY_MAX_LENGTH).strip();
		}
		return normalized;
	}

	@Transactional(readOnly = true)
	public Summary summary30d() {
		var since = Instant.now().minus(SUMMARY_DAYS, ChronoUnit.DAYS);
		var sinceDay = today().minusDays(SUMMARY_DAYS);
		var belowTarget = feedback.pageStats()
			.stream()
			.filter(page -> page.getVotes() >= MIN_VOTES_FOR_TARGET
					&& rate(page.getHelpful(), page.getVotes()) < HELPFUL_TARGET)
			.sorted(Comparator.comparingDouble(page -> rate(page.getHelpful(), page.getVotes())))
			.limit(SUMMARY_LIMIT)
			.toList();
		return new Summary(feedback.countByCreatedAtGreaterThanEqual(since),
				feedback.countByHelpfulTrueAndCreatedAtGreaterThanEqual(since), days.searchesSince(sinceDay),
				days.missesSince(sinceDay), belowTarget, misses(SUMMARY_LIMIT));
	}

	/** Every article with a vote, most voted first. */
	@Transactional(readOnly = true)
	public List<PageStats> pages() {
		return feedback.pageStats();
	}

	/** Votes newest first, narrowed to an article and to Yes or No when asked. */
	@Transactional(readOnly = true)
	public Page<HelpFeedback> feedback(String pageSlug, Boolean helpful, int page, int size) {
		Specification<HelpFeedback> matching = (root, query, cb) -> {
			var predicates = new ArrayList<Predicate>();
			if (pageSlug != null && !pageSlug.isBlank()) {
				predicates.add(cb.equal(root.get("pageSlug"), pageSlug));
			}
			if (helpful != null) {
				predicates.add(cb.equal(root.get("helpful"), helpful));
			}
			return cb.and(predicates.toArray(Predicate[]::new));
		};
		var pageable = PageRequest.of(Math.max(page, 0), clampSize(size), Sort.by(Sort.Direction.DESC, "createdAt"));
		return feedback.findAll(matching, pageable);
	}

	/** The most frequent misses, at most {@code size}. */
	@Transactional(readOnly = true)
	public List<HelpSearchMiss> misses(int size) {
		return misses.findAllByOrderByCountDescLastSeenDesc(PageRequest.of(0, clampSize(size)));
	}

	/** A share as a fraction, or null when there is nothing to divide by. */
	public static Double rate(long numerator, long denominator) {
		return denominator == 0 ? null : (double) numerator / denominator;
	}

	private static int clampSize(int size) {
		return Math.min(Math.max(size, 1), PAGE_SIZE_MAX);
	}

	private static LocalDate today() {
		return LocalDate.now(ZoneOffset.UTC);
	}
}
