package com.carbonos.user;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;

import com.carbonos.TestcontainersConfiguration;
import com.carbonos.user.internal.UserRepository;
import com.carbonos.user.internal.UserRole;
import com.carbonos.user.internal.UserService;
import com.carbonos.user.internal.UserStatus;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class AuthApiIntegrationTests {

	@Autowired
	MockMvc mvc;

	@Autowired
	UserService userService;

	@Autowired
	UserRepository users;

	@BeforeEach
	void resetUsers() {
		users.deleteAll();
		userService.create("admin@ecoriv.com", "Ama Admin", UserRole.ADMIN, "correct-horse");
	}

	@Test
	void loginWithValidCredentialsStartsSession() throws Exception {
		var result = mvc
			.perform(post("/api/auth/login").with(csrf())
				.contentType("application/json")
				.content("""
						{"email": "Admin@Ecoriv.com", "password": "correct-horse"}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.email").value("admin@ecoriv.com"))
			.andExpect(jsonPath("$.role").value("ADMIN"))
			.andReturn();

		var session = (MockHttpSession) result.getRequest().getSession(false);
		mvc.perform(get("/api/auth/me").session(session))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.displayName").value("Ama Admin"));
	}

	@Test
	void loginWithWrongPasswordIs401Problem() throws Exception {
		mvc.perform(post("/api/auth/login").with(csrf()).contentType("application/json").content("""
				{"email": "admin@ecoriv.com", "password": "wrong"}"""))
			.andExpect(status().isUnauthorized())
			.andExpect(content().contentTypeCompatibleWith("application/problem+json"))
			.andExpect(jsonPath("$.title").value("Invalid credentials"));
	}

	@Test
	void loginAsDisabledUserIs401() throws Exception {
		var member = userService.create("out@ecoriv.com", "Off Boarded", UserRole.MEMBER, "password-123");
		var admin = users.findByEmail("admin@ecoriv.com").orElseThrow();
		userService.update(member.getId(), member.getDisplayName(), member.getRole(), UserStatus.DISABLED,
				admin.getId());

		mvc.perform(post("/api/auth/login").with(csrf()).contentType("application/json").content("""
				{"email": "out@ecoriv.com", "password": "password-123"}"""))
			.andExpect(status().isUnauthorized())
			.andExpect(jsonPath("$.title").value("Invalid credentials"));
	}

	@Test
	void meWithoutSessionIs401ProblemJson() throws Exception {
		mvc.perform(get("/api/auth/me"))
			.andExpect(status().isUnauthorized())
			.andExpect(content().contentTypeCompatibleWith("application/problem+json"));
	}

	@Test
	void logoutInvalidatesSession() throws Exception {
		var result = mvc.perform(post("/api/auth/login").with(csrf()).contentType("application/json").content("""
				{"email": "admin@ecoriv.com", "password": "correct-horse"}""")).andReturn();
		var session = (MockHttpSession) result.getRequest().getSession(false);

		mvc.perform(post("/api/auth/logout").with(csrf()).session(session)).andExpect(status().isNoContent());
		mvc.perform(get("/api/auth/me").session(session)).andExpect(status().isUnauthorized());
	}
}
