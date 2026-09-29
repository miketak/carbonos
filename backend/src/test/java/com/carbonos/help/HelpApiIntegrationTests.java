package com.carbonos.help;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.closeTo;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import com.carbonos.TestcontainersConfiguration;
import com.carbonos.help.internal.HelpFeedbackReason;
import com.carbonos.help.internal.HelpFeedbackRepository;
import com.carbonos.help.internal.HelpRateLimiter;
import com.carbonos.help.internal.HelpRetentionJob;
import com.carbonos.help.internal.HelpSearchDayRepository;
import com.carbonos.help.internal.HelpSearchMissRepository;
import com.carbonos.user.AuthenticatedUser;
import com.carbonos.user.internal.User;
import com.carbonos.user.internal.UserRole;
import com.carbonos.user.internal.UserService;

/**
 * Spec 09 end to end: votes and missed searches in from a visitor, the
 * administrator's figures out, and nothing about the voter in either.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class HelpApiIntegrationTests {

	private static final String ARTICLE = "inventories/clear-the-pre-flight-findings";

	private static final String HASH_PREFIX = "a".repeat(60);

	@Autowired
	MockMvc mvc;

	@Autowired
	JdbcTemplate jdbc;

	@Autowired
	HelpFeedbackRepository feedback;

	@Autowired
	HelpSearchMissRepository misses;

	@Autowired
	HelpSearchDayRepository days;

	@Autowired
	HelpRateLimiter limiter;

	@Autowired
	HelpRetentionJob retention;

	@Autowired
	UserService userService;

	@BeforeEach
	void reset() {
		jdbc.update("DELETE FROM help_feedback");
		jdbc.update("DELETE FROM help_search_misses");
		jdbc.update("DELETE FROM help_search_days");
		jdbc.update("DELETE FROM users WHERE email LIKE 'help-%@ecoriv.com'");
		// every anonymous request in this class arrives from the same address
		limiter.clear();
	}

	@Test
	void aVisitorsVoteWithTheCsrfTokenIsStoredWithoutIdentifyingThem() throws Exception {
		vote(null, """
				{"pageSlug": "%s", "helpful": true}""".formatted(ARTICLE)).andExpect(status().isNoContent());

		var rows = feedback.findAll();
		assertThat(rows).hasSize(1);
		assertThat(rows.getFirst().getPageSlug()).isEqualTo(ARTICLE);
		assertThat(rows.getFirst().isHelpful()).isTrue();
		assertThat(rows.getFirst().getReason()).isNull();
		assertThat(rows.getFirst().getCreatedAt()).isNotNull();
		// the row carries a salted digest, never the address itself
		var hash = jdbc.queryForObject("SELECT voter_hash FROM help_feedback", String.class);
		assertThat(hash).matches("[0-9a-f]{64}");
	}

	@Test
	void aVoteWithoutTheCsrfTokenIsForbidden() throws Exception {
		mvc.perform(post("/api/help/feedback").contentType(MediaType.APPLICATION_JSON).content("""
				{"pageSlug": "%s", "helpful": true}""".formatted(ARTICLE))).andExpect(status().isForbidden());
		assertThat(feedback.count()).isZero();
	}

	@Test
	void aVoteThatBreaksARuleIsRefusedWithTheFieldNamed() throws Exception {
		// a No needs its reason, a Yes refuses one
		vote(null, """
				{"pageSlug": "%s", "helpful": false}""".formatted(ARTICLE)).andExpect(status().is(422))
			.andExpect(jsonPath("$.errors.reason").exists());
		vote(null, """
				{"pageSlug": "%s", "helpful": true, "reason": "NOT_CLEAR"}""".formatted(ARTICLE))
			.andExpect(status().is(422))
			.andExpect(jsonPath("$.errors.reason").exists());
		vote(null, """
				{"pageSlug": "%s", "helpful": false, "reason": "MEH"}""".formatted(ARTICLE))
			.andExpect(status().is(422));

		// the comment: too long, an email address, a phone number
		vote(null, """
				{"pageSlug": "%s", "helpful": false, "reason": "NOT_CLEAR", "comment": "%s"}"""
			.formatted(ARTICLE, "x".repeat(501))).andExpect(status().is(422))
			.andExpect(jsonPath("$.errors.comment").exists());
		vote(null, """
				{"pageSlug": "%s", "helpful": false, "reason": "NOT_CLEAR", "comment": "write to kofi@example.com"}"""
			.formatted(ARTICLE)).andExpect(status().is(422))
			.andExpect(jsonPath("$.errors.comment").exists());
		vote(null, """
				{"pageSlug": "%s", "helpful": false, "reason": "NOT_CLEAR", "comment": "call me on 0244123456"}"""
			.formatted(ARTICLE)).andExpect(status().is(422))
			.andExpect(jsonPath("$.title").value("Invalid request"))
			.andExpect(jsonPath("$.errors.comment").exists());

		// the slug
		vote(null, """
				{"pageSlug": "Not A Slug", "helpful": true}""").andExpect(status().is(422))
			.andExpect(jsonPath("$.errors.pageSlug").exists());
		vote(null, """
				{"pageSlug": "", "helpful": true}""").andExpect(status().is(422))
			.andExpect(jsonPath("$.errors.pageSlug").exists());

		assertThat(feedback.count()).isZero();

		// 500 characters plus a control character is 500 characters once cleaned
		vote(null, """
				{"pageSlug": "%s", "helpful": false, "reason": "NOT_CLEAR", "comment": "%s\\u0007"}"""
			.formatted(ARTICLE, "x".repeat(500))).andExpect(status().isNoContent());
		assertThat(feedback.findAll().getFirst().getComment()).hasSize(500);
	}

	@Test
	void aSecondVoteFromTheSameBrowserReplacesTheFirst() throws Exception {
		var browser = new MockHttpSession();
		vote(browser, """
				{"pageSlug": "%s", "helpful": false, "reason": "NOT_CLEAR", "comment": "Step 3 is missing."}"""
			.formatted(ARTICLE)).andExpect(status().isNoContent());
		vote(browser, """
				{"pageSlug": "%s", "helpful": true}""".formatted(ARTICLE)).andExpect(status().isNoContent());

		var rows = feedback.findAll();
		assertThat(rows).hasSize(1);
		assertThat(rows.getFirst().isHelpful()).isTrue();
		assertThat(rows.getFirst().getReason()).isNull();
		assertThat(rows.getFirst().getComment()).isNull();

		// another browser is another voter on the same article
		vote(new MockHttpSession(), """
				{"pageSlug": "%s", "helpful": false, "reason": "NOT_RELEVANT"}""".formatted(ARTICLE))
			.andExpect(status().isNoContent());
		assertThat(feedback.count()).isEqualTo(2);
	}

	@Test
	void theEleventhRequestWithinAMinuteIsRefusedAndNotStored() throws Exception {
		var browser = new MockHttpSession();
		for (int i = 0; i < 10; i++) {
			vote(browser, """
					{"pageSlug": "tasks/article-%d", "helpful": true}""".formatted(i)).andExpect(status().isNoContent());
		}
		vote(browser, """
				{"pageSlug": "tasks/article-10", "helpful": true}""").andExpect(status().is(429))
			.andExpect(header().string("Retry-After", "60"))
			.andExpect(jsonPath("$.title").value("Too many requests"));
		assertThat(feedback.count()).isEqualTo(10);

		// the searches endpoint has a budget of its own
		search(browser, """
				{"hit": true}""").andExpect(status().isNoContent());
	}

	@Test
	void aMissedSearchIsCountedOnceAsAQueryAndOnceOnTheDay() throws Exception {
		search(null, """
				{"hit": false, "query": "  Recalcuation!  "}""").andExpect(status().isNoContent());
		search(null, """
				{"hit": false, "query": "recalcuation"}""").andExpect(status().isNoContent());
		search(null, """
				{"hit": true, "query": "base year"}""").andExpect(status().isNoContent());
		// too short to say anything: counted on the day, not kept as a query
		search(null, """
				{"hit": false, "query": "a"}""").andExpect(status().isNoContent());
		search(null, """
				{"hit": false}""").andExpect(status().is(422)).andExpect(jsonPath("$.errors.query").exists());

		var missed = misses.findAll();
		assertThat(missed).hasSize(1);
		assertThat(missed.getFirst().getQueryNormalized()).isEqualTo("recalcuation");
		assertThat(missed.getFirst().getCount()).isEqualTo(2);
		assertThat(missed.getFirst().getFirstSeen()).isBeforeOrEqualTo(missed.getFirst().getLastSeen());

		var today = days.findById(LocalDate.now(ZoneOffset.UTC)).orElseThrow();
		assertThat(today.getSearches()).isEqualTo(4);
		assertThat(today.getMisses()).isEqualTo(3);
	}

	@Test
	void theFiguresAreForAdministratorsOnly() throws Exception {
		var member = userService.create("help-member@ecoriv.com", "Kwame Boateng", UserRole.MEMBER, "member-passw0rd");
		var admin = userService.create("help-admin@ecoriv.com", "Ama Admin", UserRole.ADMIN, "admin-passw0rd1");

		mvc.perform(get("/api/admin/summary/help")).andExpect(status().isUnauthorized());
		mvc.perform(get("/api/admin/summary/help").with(as(member))).andExpect(status().isForbidden());
		mvc.perform(get("/api/admin/help/pages").with(as(member))).andExpect(status().isForbidden());
		mvc.perform(get("/api/admin/help/feedback").with(as(member))).andExpect(status().isForbidden());
		mvc.perform(get("/api/admin/help/search-misses").with(as(member))).andExpect(status().isForbidden());

		// an empty help centre has no rate, not a rate of zero
		mvc.perform(get("/api/admin/summary/help").with(as(admin)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.feedback.votes30d").value(0))
			.andExpect(jsonPath("$.feedback.helpful30d").value(0))
			.andExpect(jsonPath("$.feedback.helpfulRate30d").value(nullValue()))
			.andExpect(jsonPath("$.search.searches30d").value(0))
			.andExpect(jsonPath("$.search.misses30d").value(0))
			.andExpect(jsonPath("$.search.missRate30d").value(nullValue()))
			.andExpect(jsonPath("$.pagesBelowTarget").isEmpty())
			.andExpect(jsonPath("$.topMisses").isEmpty());
	}

	@Test
	void theSummaryComputesItsRatesFromTheRows() throws Exception {
		var admin = userService.create("help-admin@ecoriv.com", "Ama Admin", UserRole.ADMIN, "admin-passw0rd1");
		var now = OffsetDateTime.now(ZoneOffset.UTC);
		// six votes, two helpful: below target
		for (int i = 0; i < 6; i++) {
			seedVote("tasks/below", i < 2, i < 2 ? null : HelpFeedbackReason.NOT_CLEAR, "comment " + i, "b" + i,
					now.minusDays(i));
		}
		// five votes, all helpful: on target
		for (int i = 0; i < 5; i++) {
			seedVote("tasks/fine", true, null, null, "f" + i, now.minusDays(i));
		}
		// two votes, none helpful: too few to judge
		seedVote("tasks/young", false, HelpFeedbackReason.NOT_RELEVANT, null, "y0", now);
		seedVote("tasks/young", false, HelpFeedbackReason.NOT_ACCURATE, null, "y1", now);
		// outside the window
		seedVote("tasks/old", true, null, null, "o0", now.minusDays(40));
		seedDay(LocalDate.now(ZoneOffset.UTC), 20, 4);
		seedDay(LocalDate.now(ZoneOffset.UTC).minusDays(40), 100, 50);
		seedMiss("recalcuation", 3, now.minusDays(1), now);
		seedMiss("scope 2 market", 1, now, now);

		mvc.perform(get("/api/admin/summary/help").with(as(admin)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.feedback.votes30d").value(13))
			.andExpect(jsonPath("$.feedback.helpful30d").value(7))
			.andExpect(jsonPath("$.feedback.helpfulRate30d").value(closeTo(7.0 / 13, 1e-6)))
			.andExpect(jsonPath("$.search.searches30d").value(20))
			.andExpect(jsonPath("$.search.misses30d").value(4))
			.andExpect(jsonPath("$.search.missRate30d").value(closeTo(0.2, 1e-6)))
			.andExpect(jsonPath("$.pagesBelowTarget.length()").value(1))
			.andExpect(jsonPath("$.pagesBelowTarget[0].pageSlug").value("tasks/below"))
			.andExpect(jsonPath("$.pagesBelowTarget[0].votes").value(6))
			.andExpect(jsonPath("$.pagesBelowTarget[0].helpfulRate").value(closeTo(2.0 / 6, 1e-6)))
			.andExpect(jsonPath("$.topMisses.length()").value(2))
			.andExpect(jsonPath("$.topMisses[0].query").value("recalcuation"))
			.andExpect(jsonPath("$.topMisses[0].count").value(3))
			.andExpect(jsonPath("$.topMisses[0].lastSeen").exists());

		mvc.perform(get("/api/admin/help/pages").with(as(admin)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.length()").value(4))
			.andExpect(jsonPath("$[0].pageSlug").value("tasks/below"))
			.andExpect(jsonPath("$[0].votes").value(6))
			.andExpect(jsonPath("$[0].helpful").value(2))
			.andExpect(jsonPath("$[0].helpfulRate").value(closeTo(2.0 / 6, 1e-6)))
			.andExpect(jsonPath("$[0].lastVoteAt").exists())
			.andExpect(jsonPath("$[1].pageSlug").value("tasks/fine"))
			.andExpect(jsonPath("$[1].helpfulRate").value(1.0));

		var listing = mvc.perform(get("/api/admin/help/feedback?slug=tasks/below&helpful=false").with(as(admin)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.total").value(4))
			.andExpect(jsonPath("$.items.length()").value(4))
			.andExpect(jsonPath("$.items[0].pageSlug").value("tasks/below"))
			.andExpect(jsonPath("$.items[0].helpful").value(false))
			.andExpect(jsonPath("$.items[0].reason").value("NOT_CLEAR"))
			.andExpect(jsonPath("$.items[0].comment").value("comment 2"))
			.andExpect(jsonPath("$.items[0].createdAt").exists())
			.andReturn()
			.getResponse()
			.getContentAsString();
		// the voter hash leaves the module through no endpoint
		assertThat(listing).doesNotContain("voter", HASH_PREFIX);

		mvc.perform(get("/api/admin/help/feedback?page=0&size=2").with(as(admin)))
			.andExpect(jsonPath("$.total").value(14))
			.andExpect(jsonPath("$.items.length()").value(2));

		mvc.perform(get("/api/admin/help/search-misses").with(as(admin)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.length()").value(2))
			.andExpect(jsonPath("$[0].query").value("recalcuation"))
			.andExpect(jsonPath("$[0].count").value(3))
			.andExpect(jsonPath("$[0].firstSeen").exists())
			.andExpect(jsonPath("$[1].query").value("scope 2 market"));
	}

	@Test
	void theRetentionJobDeletesWhatIsPastItsWindow() {
		var now = OffsetDateTime.now(ZoneOffset.UTC);
		seedVote(ARTICLE, true, null, null, "r0", now.minusDays(366));
		seedVote(ARTICLE, true, null, null, "r1", now.minusDays(364));
		seedMiss("stale", 1, now.minusDays(200), now.minusDays(181));
		seedMiss("recent", 1, now.minusDays(200), now.minusDays(179));
		seedDay(LocalDate.now(ZoneOffset.UTC).minusDays(401), 1, 0);
		seedDay(LocalDate.now(ZoneOffset.UTC).minusDays(399), 1, 0);

		retention.run();

		assertThat(feedback.count()).isEqualTo(1);
		assertThat(misses.findById("stale")).isEmpty();
		assertThat(misses.findById("recent")).isPresent();
		assertThat(days.count()).isEqualTo(1);
	}

	private ResultActions vote(MockHttpSession browser, String body) throws Exception {
		var request = post("/api/help/feedback").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(body);
		if (browser != null) {
			request.session(browser);
		}
		return mvc.perform(request);
	}

	private ResultActions search(MockHttpSession browser, String body) throws Exception {
		var request = post("/api/help/searches").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(body);
		if (browser != null) {
			request.session(browser);
		}
		return mvc.perform(request);
	}

	private RequestPostProcessor as(User account) {
		return user(new AuthenticatedUser(account.getId(), account.getEmail(), "irrelevant",
				account.getRole().name(), true));
	}

	private void seedVote(String slug, boolean helpful, HelpFeedbackReason reason, String comment, String voter,
			OffsetDateTime at) {
		jdbc.update("INSERT INTO help_feedback (page_slug, helpful, reason, comment, voter_hash, created_at) "
				+ "VALUES (?, ?, ?, ?, ?, ?)", slug, helpful, reason == null ? null : reason.name(), comment,
				HASH_PREFIX + String.format("%4s", voter).replace(' ', '0'), at);
	}

	private void seedMiss(String query, int count, OffsetDateTime firstSeen, OffsetDateTime lastSeen) {
		jdbc.update("INSERT INTO help_search_misses (query_normalized, count, first_seen, last_seen) "
				+ "VALUES (?, ?, ?, ?)", query, count, firstSeen, lastSeen);
	}

	private void seedDay(LocalDate day, int searches, int misses) {
		jdbc.update("INSERT INTO help_search_days (day, searches, misses) VALUES (?, ?, ?)", day, searches, misses);
	}
}
