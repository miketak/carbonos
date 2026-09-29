package com.carbonos.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse.BodyHandlers;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

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
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.testcontainers.containers.GenericContainer;

import com.carbonos.TestcontainersConfiguration;
import com.carbonos.user.internal.PasswordRateLimiter;
import com.carbonos.user.internal.User;
import com.carbonos.user.internal.UserRepository;
import com.carbonos.user.internal.UserRole;
import com.carbonos.user.internal.UserSecurityEvent;
import com.carbonos.user.internal.UserSecurityEventRepository;
import com.carbonos.user.internal.UserService;
import com.carbonos.user.internal.UserStatus;
import com.jayway.jsonpath.JsonPath;

/**
 * Spec 01.9 end to end: changing a password on the profile, the forgotten
 * password link, the administrator's reset, the history each leaves and the
 * emails each sends (through Mailpit).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class PasswordApiIntegrationTests {

	private static final HttpClient HTTP = HttpClient.newHttpClient();

	private static final Pattern LINK = Pattern.compile("/reset-password\\?token=([0-9a-f]{64})");

	@Autowired
	MockMvc mvc;

	@Autowired
	UserRepository users;

	@Autowired
	UserService userService;

	@Autowired
	UserSecurityEventRepository history;

	@Autowired
	PasswordRateLimiter rateLimiter;

	@Autowired
	JdbcTemplate jdbc;

	@Autowired
	GenericContainer<?> mailpitContainer;

	User admin;

	User member;

	@BeforeEach
	void setUp() throws Exception {
		users.deleteAll();
		history.deleteAll();
		rateLimiter.clear();
		admin = userService.create("admin@ecoriv.com", "Ama Admin", UserRole.ADMIN, "correct-horse-1");
		member = userService.create("kofi@ecoriv.com", "Kofi Mensah", UserRole.MEMBER, "old-password-12");
		clearMailbox();
	}

	// --- change on the profile ---

	@Test
	void changeRefusesAWrongCurrentPasswordOnItsField() throws Exception {
		var session = signIn("kofi@ecoriv.com", "old-password-12");
		changePassword(session, "not-my-password-1", "new-password-34")
			.andExpect(status().is(422))
			.andExpect(jsonPath("$.errors.currentPassword").value("The current password is not correct."));

		// still signed in: a wrong current password is not a 401
		mvc.perform(get("/api/auth/me").session(session)).andExpect(status().isOk());
		signInExpecting("kofi@ecoriv.com", "old-password-12", 200);
		assertThat(history.findByUserIdOrderByCreatedAtAsc(member.getId())).isEmpty();
	}

	@Test
	void changeAppliesThePolicyAndRefusesTheSamePassword() throws Exception {
		var session = signIn("kofi@ecoriv.com", "old-password-12");
		changePassword(session, "old-password-12", "short1")
			.andExpect(status().is(422))
			.andExpect(jsonPath("$.errors.newPassword").value("At least 12 characters, with a letter and a digit."));
		changePassword(session, "old-password-12", "no-digits-at-all")
			.andExpect(status().is(422))
			.andExpect(jsonPath("$.errors.newPassword").value("At least 12 characters, with a letter and a digit."));
		changePassword(session, "old-password-12", "old-password-12")
			.andExpect(status().is(422))
			.andExpect(jsonPath("$.errors.newPassword").value("Choose a password different from your current one."));
	}

	@Test
	void changeKeepsThisSessionEndsTheOthersRecordsAndEmails() throws Exception {
		var laptop = signIn("kofi@ecoriv.com", "old-password-12");
		var phone = signIn("kofi@ecoriv.com", "old-password-12");

		changePassword(laptop, "old-password-12", "new-password-34").andExpect(status().isNoContent());

		mvc.perform(get("/api/auth/me").session(laptop)).andExpect(status().isOk());
		mvc.perform(get("/api/auth/me").session(phone))
			.andExpect(status().isUnauthorized())
			.andExpect(content().contentTypeCompatibleWith("application/problem+json"));

		signInExpecting("kofi@ecoriv.com", "old-password-12", 401);
		signInExpecting("kofi@ecoriv.com", "new-password-34", 200);

		var events = history.findByUserIdOrderByCreatedAtAsc(member.getId());
		assertThat(events).extracting(UserSecurityEvent::getAction)
			.containsExactly(UserSecurityEvent.Action.PASSWORD_CHANGED);
		assertThat(events.getFirst().getActor()).isEqualTo("kofi@ecoriv.com");

		assertThat(waitForEmail("kofi@ecoriv.com", "Your CarbonOS password was changed"))
			.contains("from your profile")
			.contains("/forgot-password");
	}

	@Test
	void changeIsLimitedToFiveAttemptsPerWindow() throws Exception {
		var session = signIn("kofi@ecoriv.com", "old-password-12");
		for (int attempt = 0; attempt < 5; attempt++) {
			changePassword(session, "wrong-guess-" + attempt + "x", "new-password-34").andExpect(status().is(422));
		}
		changePassword(session, "old-password-12", "new-password-34")
			.andExpect(status().isTooManyRequests())
			.andExpect(header().string("Retry-After", "900"));
	}

	@Test
	void changeNeedsASessionAndCsrf() throws Exception {
		mvc.perform(put("/api/profile/password").with(csrf())
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"currentPassword": "old-password-12", "newPassword": "new-password-34"}"""))
			.andExpect(status().isUnauthorized());
		var session = signIn("kofi@ecoriv.com", "old-password-12");
		mvc.perform(put("/api/profile/password").session(session)
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"currentPassword": "old-password-12", "newPassword": "new-password-34"}"""))
			.andExpect(status().isForbidden());
	}

	// --- the forgotten password ---

	@Test
	void theRequestAnswersTheSameWhetherOrNotTheAccountExists() throws Exception {
		var disabled = userService.create("gone@ecoriv.com", "Gone Away", UserRole.MEMBER, "gone-password-1");
		userService.update(disabled.getId(), disabled.getDisplayName(), disabled.getRole(), UserStatus.DISABLED,
				admin.getId());

		var known = requestReset("Kofi@Ecoriv.com");
		var unknown = requestReset("nobody@ecoriv.com");
		var off = requestReset("gone@ecoriv.com");

		for (var answer : List.of(unknown, off)) {
			assertThat(answer.status()).isEqualTo(known.status()).isEqualTo(202);
			assertThat(answer.body()).isEqualTo(known.body()).isEmpty();
		}

		// only the ACTIVE account gets a link, and only its request is recorded
		assertThat(waitForEmail("kofi@ecoriv.com", "Reset your CarbonOS password"))
			.contains("valid for 1 hour and works once");
		Thread.sleep(1000);
		assertThat(mailboxListing()).doesNotContain("nobody@ecoriv.com").doesNotContain("gone@ecoriv.com");
		assertThat(history.findAll()).extracting(UserSecurityEvent::getUserEmail, UserSecurityEvent::getAction)
			.containsExactly(org.assertj.core.groups.Tuple.tuple("kofi@ecoriv.com",
					UserSecurityEvent.Action.PASSWORD_RESET_REQUESTED));
	}

	@Test
	void theLinkSetsANewPasswordOnceEndsEverySessionAndIsStoredHashed() throws Exception {
		var phone = signIn("kofi@ecoriv.com", "old-password-12");
		requestReset("kofi@ecoriv.com");
		var token = tokenFrom(waitForEmail("kofi@ecoriv.com", "Reset your CarbonOS password"));

		// the database holds the hash of the token, never the token
		var stored = jdbc.queryForList("select token_hash from password_reset_tokens", String.class);
		assertThat(stored).containsExactly(sha256(token)).doesNotContain(token);

		mvc.perform(get("/api/auth/password-reset/" + token))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.email").value("kofi@ecoriv.com"));

		completeReset(token, "weak").andExpect(status().is(422)).andExpect(jsonPath("$.errors.password").exists());
		completeReset(token, "reset-password-56").andExpect(status().isNoContent());

		mvc.perform(get("/api/auth/me").session(phone)).andExpect(status().isUnauthorized());
		signInExpecting("kofi@ecoriv.com", "old-password-12", 401);
		signInExpecting("kofi@ecoriv.com", "reset-password-56", 200);

		// used: refused with its own sentence, on reading and on setting
		mvc.perform(get("/api/auth/password-reset/" + token))
			.andExpect(status().isGone())
			.andExpect(jsonPath("$.detail").value("This reset link has already been used."));
		completeReset(token, "another-password-78").andExpect(status().isGone())
			.andExpect(jsonPath("$.detail").value("This reset link has already been used."));

		assertThat(history.findByUserIdOrderByCreatedAtAsc(member.getId())).extracting(UserSecurityEvent::getAction)
			.containsExactly(UserSecurityEvent.Action.PASSWORD_RESET_REQUESTED,
					UserSecurityEvent.Action.PASSWORD_RESET_COMPLETED);
		assertThat(waitForEmail("kofi@ecoriv.com", "Your CarbonOS password was changed"))
			.contains("with a password reset link");
	}

	@Test
	void usingOneLinkSpendsTheOtherOpenLinks() throws Exception {
		requestReset("kofi@ecoriv.com");
		var first = tokenFrom(waitForEmail("kofi@ecoriv.com", "Reset your CarbonOS password"));
		clearMailbox();
		requestReset("kofi@ecoriv.com");
		var second = tokenFrom(waitForEmail("kofi@ecoriv.com", "Reset your CarbonOS password"));
		assertThat(second).isNotEqualTo(first);

		completeReset(second, "reset-password-56").andExpect(status().isNoContent());
		completeReset(first, "another-password-78").andExpect(status().isGone());
	}

	@Test
	void anExpiredLinkIsRefusedWithItsOwnSentence() throws Exception {
		requestReset("kofi@ecoriv.com");
		var token = tokenFrom(waitForEmail("kofi@ecoriv.com", "Reset your CarbonOS password"));
		jdbc.update("update password_reset_tokens set expires_at = now() - interval '1 minute'");

		mvc.perform(get("/api/auth/password-reset/" + token))
			.andExpect(status().isGone())
			.andExpect(jsonPath("$.detail").value("This reset link has expired. Reset links are valid for 1 hour."));
		completeReset(token, "reset-password-56").andExpect(status().isGone());
		signInExpecting("kofi@ecoriv.com", "old-password-12", 200);
	}

	@Test
	void anUnknownLinkIsNotFound() throws Exception {
		mvc.perform(get("/api/auth/password-reset/" + "ab".repeat(32)))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.detail").value("This reset link is not valid."));
		completeReset("not-a-token", "reset-password-56").andExpect(status().isNotFound());
	}

	@Test
	void theRequestIsLimitedPerEmailWhetherOrNotItExists() throws Exception {
		for (var email : List.of("kofi@ecoriv.com", "nobody@ecoriv.com")) {
			for (int i = 0; i < 3; i++) {
				assertThat(requestReset(email).status()).isEqualTo(202);
			}
			mvc.perform(resetRequest(email, "10.0.0.9"))
				.andExpect(status().isTooManyRequests())
				.andExpect(header().string("Retry-After", "900"))
				.andExpect(jsonPath("$.detail").value("Too many password reset requests. Try again in 15 minutes."));
		}
	}

	@Test
	void theRequestIsLimitedPerClient() throws Exception {
		for (int i = 0; i < 10; i++) {
			mvc.perform(resetRequest("someone" + i + "@ecoriv.com", "10.0.0.7")).andExpect(status().isAccepted());
		}
		mvc.perform(resetRequest("someone-else@ecoriv.com", "10.0.0.7")).andExpect(status().isTooManyRequests());
		// another client is not held back by the first
		mvc.perform(resetRequest("someone-else@ecoriv.com", "10.0.0.8")).andExpect(status().isAccepted());
	}

	@Test
	void theRequestNeedsCsrfButNoSession() throws Exception {
		mvc.perform(post("/api/auth/password-reset").contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"email": "kofi@ecoriv.com"}"""))
			.andExpect(status().isForbidden());
		mvc.perform(post("/api/auth/password-reset/complete").contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"token": "x", "password": "reset-password-56"}"""))
			.andExpect(status().isForbidden());
	}

	// --- the administrator's reset ---

	@Test
	void anAdministratorSendsTheLinkAndTheCurrentPasswordStandsUntilItIsUsed() throws Exception {
		mvc.perform(post("/api/admin/users/" + member.getId() + "/password-reset").with(asUser(admin)).with(csrf()))
			.andExpect(status().isAccepted());

		var mail = waitForEmail("kofi@ecoriv.com", "Reset your CarbonOS password");
		assertThat(mail).contains("A CarbonOS administrator sent you this link");
		signInExpecting("kofi@ecoriv.com", "old-password-12", 200);

		var events = history.findByUserIdOrderByCreatedAtAsc(member.getId());
		assertThat(events).extracting(UserSecurityEvent::getAction)
			.containsExactly(UserSecurityEvent.Action.PASSWORD_RESET_SENT_BY_ADMIN);
		assertThat(events.getFirst().getActorUserId()).isEqualTo(admin.getId());
		assertThat(events.getFirst().getActor()).isEqualTo("admin@ecoriv.com");

		completeReset(tokenFrom(mail), "reset-password-56").andExpect(status().isNoContent());
		signInExpecting("kofi@ecoriv.com", "reset-password-56", 200);
	}

	@Test
	void theAdministratorsResetRefusesPendingAndDisabledAccountsAndMembers() throws Exception {
		var pending = userService.createPending("new@ecoriv.com", "New Person");
		mvc.perform(post("/api/admin/users/" + pending.getId() + "/password-reset").with(asUser(admin)).with(csrf()))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.detail").value(
					"This account has not set its first password yet; the link in its approval email still works."));

		userService.update(member.getId(), member.getDisplayName(), member.getRole(), UserStatus.DISABLED,
				admin.getId());
		mvc.perform(post("/api/admin/users/" + member.getId() + "/password-reset").with(asUser(admin)).with(csrf()))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.detail").value("Enable the account before sending a password reset link."));

		var other = userService.create("ama@ecoriv.com", "Ama Member", UserRole.MEMBER, "member-password-1");
		mvc.perform(post("/api/admin/users/" + admin.getId() + "/password-reset").with(asUser(other)).with(csrf()))
			.andExpect(status().isForbidden());
	}

	// --- helpers ---

	private record Answer(int status, String body) {
	}

	private Answer requestReset(String email) throws Exception {
		var response = mvc.perform(resetRequest(email, "127.0.0.1")).andReturn().getResponse();
		return new Answer(response.getStatus(), response.getContentAsString());
	}

	private org.springframework.test.web.servlet.RequestBuilder resetRequest(String email, String client) {
		return post("/api/auth/password-reset").with(csrf()).with(request -> {
			request.setRemoteAddr(client);
			return request;
		}).contentType(MediaType.APPLICATION_JSON).content("""
				{"email": "%s"}""".formatted(email));
	}

	private org.springframework.test.web.servlet.ResultActions completeReset(String token, String password)
			throws Exception {
		return mvc.perform(post("/api/auth/password-reset/complete").with(csrf())
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"token": "%s", "password": "%s"}""".formatted(token, password)));
	}

	private org.springframework.test.web.servlet.ResultActions changePassword(MockHttpSession session,
			String current, String next) throws Exception {
		return mvc.perform(put("/api/profile/password").session(session).with(csrf())
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"currentPassword": "%s", "newPassword": "%s"}""".formatted(current, next)));
	}

	private MockHttpSession signIn(String email, String password) throws Exception {
		var result = mvc.perform(post("/api/auth/login").with(csrf())
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"email": "%s", "password": "%s"}""".formatted(email, password)))
			.andExpect(status().isOk())
			.andReturn();
		return (MockHttpSession) result.getRequest().getSession(false);
	}

	private void signInExpecting(String email, String password, int expected) throws Exception {
		mvc.perform(post("/api/auth/login").with(csrf())
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"email": "%s", "password": "%s"}""".formatted(email, password)))
			.andExpect(status().is(expected));
	}

	private RequestPostProcessor asUser(User user) {
		return user(new AuthenticatedUser(user.getId(), user.getEmail(), user.getPasswordHash(),
				user.getRole().name(), true));
	}

	private static String tokenFrom(String mail) {
		var matcher = LINK.matcher(mail);
		assertThat(matcher.find()).as("a reset link in: %s", mail).isTrue();
		return matcher.group(1);
	}

	private static String sha256(String value) throws Exception {
		return HexFormat.of()
			.formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
	}

	private String mailpitUrl(String path) {
		return "http://" + mailpitContainer.getHost() + ":" + mailpitContainer.getMappedPort(8025) + path;
	}

	private void clearMailbox() throws Exception {
		HTTP.send(HttpRequest.newBuilder(URI.create(mailpitUrl("/api/v1/messages"))).DELETE().build(),
				BodyHandlers.discarding());
	}

	private String mailboxListing() throws Exception {
		return HTTP.send(HttpRequest.newBuilder(URI.create(mailpitUrl("/api/v1/messages"))).build(),
				BodyHandlers.ofString()).body();
	}

	/** The mail listener is async; poll Mailpit until a message to the recipient with the subject lands. */
	private String waitForEmail(String recipient, String subject) throws Exception {
		for (int attempt = 0; attempt < 40; attempt++) {
			List<Map<String, Object>> messages = JsonPath.read(mailboxListing(), "$.messages");
			for (var message : messages) {
				var to = String.valueOf(message.get("To"));
				if (to.contains(recipient) && subject.equals(message.get("Subject"))) {
					var body = HTTP
						.send(HttpRequest.newBuilder(URI.create(mailpitUrl("/api/v1/message/" + message.get("ID"))))
							.build(), BodyHandlers.ofString())
						.body();
					return JsonPath.read(body, "$.Text");
				}
			}
			Thread.sleep(250);
		}
		throw new AssertionError("No email '" + subject + "' to " + recipient + " arrived in Mailpit");
	}
}
