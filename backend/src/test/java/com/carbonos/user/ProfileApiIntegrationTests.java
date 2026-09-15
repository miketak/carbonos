package com.carbonos.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Base64;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import com.carbonos.TestcontainersConfiguration;
import com.carbonos.user.internal.UserRepository;
import com.carbonos.user.internal.UserRole;
import com.carbonos.user.internal.UserService;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class ProfileApiIntegrationTests {

	/** 1x1 PNG — real magic bytes for the sniffer. */
	private static final byte[] PNG = Base64.getDecoder()
		.decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==");

	@Autowired
	MockMvc mvc;

	@Autowired
	UserService userService;

	@Autowired
	UserRepository users;

	@BeforeEach
	void resetUsers() {
		users.deleteAll();
		userService.create("member@ecoriv.com", "Mem Ber", UserRole.MEMBER, "correct-horse");
	}

	MockHttpSession login() throws Exception {
		var result = mvc.perform(post("/api/auth/login").with(csrf()).contentType("application/json").content("""
				{"email": "member@ecoriv.com", "password": "correct-horse"}""")).andReturn();
		return (MockHttpSession) result.getRequest().getSession(false);
	}

	@Test
	void profileRequiresAuthentication() throws Exception {
		mvc.perform(get("/api/profile")).andExpect(status().isUnauthorized());
	}

	@Test
	void updateDisplayNamePersists() throws Exception {
		var session = login();
		mvc.perform(put("/api/profile").with(csrf()).session(session).contentType("application/json").content("""
				{"displayName": "New Name"}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.displayName").value("New Name"));

		mvc.perform(get("/api/profile").session(session))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.displayName").value("New Name"))
			.andExpect(jsonPath("$.email").value("member@ecoriv.com"))
			.andExpect(jsonPath("$.hasAvatar").value(false));
	}

	@Test
	void blankDisplayNameIs422WithFieldError() throws Exception {
		var session = login();
		mvc.perform(put("/api/profile").with(csrf()).session(session).contentType("application/json").content("""
				{"displayName": "  "}"""))
			.andExpect(status().isUnprocessableContent())
			.andExpect(jsonPath("$.errors.displayName").exists());
	}

	@Test
	void avatarUploadRoundTrips() throws Exception {
		var session = login();
		var file = new MockMultipartFile("file", "me.png", "image/png", PNG);
		mvc.perform(multipart(HttpMethod.PUT, "/api/profile/avatar").file(file).with(csrf()).session(session))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.hasAvatar").value(true));

		var result = mvc.perform(get("/api/profile/avatar").session(session))
			.andExpect(status().isOk())
			.andExpect(content().contentType("image/png"))
			.andReturn();
		assertThat(result.getResponse().getContentAsByteArray()).isEqualTo(PNG);
	}

	@Test
	void avatarUploadWithWrongTypeIs422() throws Exception {
		var session = login();
		var file = new MockMultipartFile("file", "notes.txt", "image/png", "just text".getBytes());
		mvc.perform(multipart(HttpMethod.PUT, "/api/profile/avatar").file(file).with(csrf()).session(session))
			.andExpect(status().isUnprocessableContent())
			.andExpect(jsonPath("$.errors.file").exists());
	}

	/**
	 * Spec 01.6 retired the resume upload. The endpoints are gone and V49 dropped
	 * the columns; this pins both so the experiment does not quietly come back.
	 */
	@Test
	void theRetiredResumeEndpointsAreGone() throws Exception {
		var session = login();
		mvc.perform(get("/api/profile/resume").session(session)).andExpect(status().isNotFound());

		var file = new MockMultipartFile("file", "portfolio.psd", "application/octet-stream",
				"8BPSfake-photoshop-content".getBytes());
		mvc.perform(multipart(HttpMethod.PUT, "/api/profile/resume").file(file).with(csrf()).session(session))
			.andExpect(status().isNotFound());

		mvc.perform(get("/api/profile").session(session))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.hasResume").doesNotExist())
			.andExpect(jsonPath("$.resumeFilename").doesNotExist());
	}

	/**
	 * V49 drops three columns from a table the avatar shares, and the replay is
	 * done by hand; this is the automated half of that check.
	 */
	@Test
	void anAvatarStillRoundTripsAfterTheResumeColumnsWereDropped() throws Exception {
		var session = login();
		var file = new MockMultipartFile("file", "me.png", "image/png", PNG);
		mvc.perform(multipart(HttpMethod.PUT, "/api/profile/avatar").file(file).with(csrf()).session(session))
			.andExpect(status().isOk());

		var result = mvc.perform(get("/api/profile/avatar").session(session)).andExpect(status().isOk()).andReturn();
		assertThat(result.getResponse().getContentAsByteArray()).isEqualTo(PNG);
	}
}
