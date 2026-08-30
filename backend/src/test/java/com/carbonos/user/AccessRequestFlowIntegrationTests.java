package com.carbonos.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse.BodyHandlers;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.testcontainers.containers.GenericContainer;

import com.carbonos.TestcontainersConfiguration;
import com.carbonos.user.internal.AccessRequestRepository;
import com.carbonos.user.internal.AccessRequestStatus;
import com.carbonos.user.internal.User;
import com.carbonos.user.internal.UserRepository;
import com.carbonos.user.internal.UserRole;
import com.carbonos.user.internal.UserService;
import com.carbonos.user.AuthenticatedUser;
import com.jayway.jsonpath.JsonPath;

/** Spec 002 end to end: request → approve/deny (+ emails via Mailpit) → set password → session. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class AccessRequestFlowIntegrationTests {

	private static final HttpClient HTTP = HttpClient.newHttpClient();

	@Autowired
	MockMvc mvc;

	@Autowired
	UserRepository users;

	@Autowired
	AccessRequestRepository accessRequests;

	@Autowired
	UserService userService;

	@Autowired
	GenericContainer<?> mailpitContainer;

	User admin;

	@BeforeEach
	void setUp() throws Exception {
		accessRequests.deleteAll();
		users.deleteAll();
		admin = userService.create("admin@ecoriv.com", "Ama Admin", UserRole.ADMIN, "correct-horse");
		clearMailbox();
	}

	@Test
	void approvalFlowCreatesAnAccountFromTheEmailedLink() throws Exception {
		mvc.perform(post("/api/access-requests").with(csrf())
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"email": "Kofi.Mensah@ecoriv.com", "displayName": "Kofi Mensah", "company": "EcoGhana"}
					"""))
			.andExpect(status().isAccepted());

		// one open request per address
		mvc.perform(post("/api/access-requests").with(csrf())
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"email": "kofi.mensah@ecoriv.com", "displayName": "Kofi Mensah"}
					"""))
			.andExpect(status().isConflict());

		var id = accessRequests.findAll().getFirst().getId();
		mvc.perform(post("/api/admin/access-requests/" + id + "/approve").with(asUser(admin)).with(csrf()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("APPROVED"));

		var token = accessRequests.findById(id).orElseThrow().getSetupToken();
		assertThat(token).isNotBlank();

		// the async listener delivers the setup link
		assertThat(waitForEmailTo("kofi.mensah@ecoriv.com")).contains("/set-password?token=" + token);

		mvc.perform(get("/api/access-requests/setup/" + token))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.email").value("kofi.mensah@ecoriv.com"))
			.andExpect(jsonPath("$.displayName").value("Kofi Mensah"));

		var result = mvc.perform(post("/api/access-requests/complete").with(csrf())
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"token": "%s", "password": "brand-new-secret"}
					""".formatted(token)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.email").value("kofi.mensah@ecoriv.com"))
			.andExpect(jsonPath("$.role").value("MEMBER"))
			.andExpect(jsonPath("$.status").value("ACTIVE"))
			.andReturn();

		// completing setup signs the user straight in
		var session = (MockHttpSession) result.getRequest().getSession(false);
		mvc.perform(get("/api/auth/me").session(session))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.email").value("kofi.mensah@ecoriv.com"));

		// the token is single-use
		mvc.perform(get("/api/access-requests/setup/" + token)).andExpect(status().isNotFound());
		assertThat(accessRequests.findById(id).orElseThrow().getStatus())
			.isEqualTo(AccessRequestStatus.COMPLETED);
	}

	@Test
	void denialSendsAnEmailAndAllowsANewRequest() throws Exception {
		mvc.perform(post("/api/access-requests").with(csrf())
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"email": "abena.owusu@ecoriv.com", "displayName": "Abena Owusu"}
					"""))
			.andExpect(status().isAccepted());

		var id = accessRequests.findAll().getFirst().getId();
		mvc.perform(post("/api/admin/access-requests/" + id + "/deny").with(asUser(admin)).with(csrf()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("DENIED"));

		assertThat(waitForEmailTo("abena.owusu@ecoriv.com")).contains("unable");

		// a decided request no longer blocks resubmission, but re-deciding it is rejected
		mvc.perform(post("/api/access-requests").with(csrf())
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"email": "abena.owusu@ecoriv.com", "displayName": "Abena Owusu"}
					"""))
			.andExpect(status().isAccepted());
		mvc.perform(post("/api/admin/access-requests/" + id + "/approve").with(asUser(admin)).with(csrf()))
			.andExpect(status().isConflict());
	}

	@Test
	void submitRejectsAnEmailThatAlreadyHasAnAccount() throws Exception {
		mvc.perform(post("/api/access-requests").with(csrf())
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"email": "ADMIN@ecoriv.com", "displayName": "Somebody Else"}
					"""))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.title").value("Duplicate request"));
	}

	@Test
	void unknownTokensAreNotFound() throws Exception {
		mvc.perform(get("/api/access-requests/setup/not-a-real-token")).andExpect(status().isNotFound());
		mvc.perform(post("/api/access-requests/complete").with(csrf())
			.contentType(MediaType.APPLICATION_JSON)
			.content("""
					{"token": "not-a-real-token", "password": "irrelevant-pass"}
					"""))
			.andExpect(status().isNotFound());
	}

	@Test
	void adminQueueRequiresAdminRole() throws Exception {
		var member = userService.create("kwame@ecoriv.com", "Kwame Boateng", UserRole.MEMBER, "member-pass");
		mvc.perform(get("/api/admin/access-requests").with(asUser(member))).andExpect(status().isForbidden());
		mvc.perform(get("/api/admin/access-requests").with(asUser(admin))).andExpect(status().isOk());
	}

	private RequestPostProcessor asUser(User user) {
		return user(new AuthenticatedUser(user.getId(), user.getEmail(), user.getPasswordHash(),
				user.getRole().name(), true));
	}

	private String mailpitUrl(String path) {
		return "http://" + mailpitContainer.getHost() + ":" + mailpitContainer.getMappedPort(8025) + path;
	}

	private void clearMailbox() throws Exception {
		HTTP.send(HttpRequest.newBuilder(URI.create(mailpitUrl("/api/v1/messages"))).DELETE().build(),
				BodyHandlers.discarding());
	}

	/** The mail listener is async; poll Mailpit until the message lands. */
	private String waitForEmailTo(String recipient) throws Exception {
		for (int attempt = 0; attempt < 40; attempt++) {
			var listing = HTTP
				.send(HttpRequest.newBuilder(URI.create(mailpitUrl("/api/v1/messages"))).build(),
						BodyHandlers.ofString())
				.body();
			if (listing.contains(recipient)) {
				String messageId = JsonPath.read(listing, "$.messages[0].ID");
				var message = HTTP
					.send(HttpRequest.newBuilder(URI.create(mailpitUrl("/api/v1/message/" + messageId))).build(),
							BodyHandlers.ofString())
					.body();
				return JsonPath.read(message, "$.Text");
			}
			Thread.sleep(250);
		}
		throw new AssertionError("No email to " + recipient + " arrived in Mailpit");
	}
}
