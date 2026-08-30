package com.carbonos.user;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import com.carbonos.TestcontainersConfiguration;
import com.carbonos.user.internal.User;
import com.carbonos.user.internal.UserRepository;
import com.carbonos.user.internal.UserRole;
import com.carbonos.user.internal.UserService;
import com.carbonos.user.AuthenticatedUser;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class UserAdminApiIntegrationTests {

	@Autowired
	MockMvc mvc;

	@Autowired
	UserService userService;

	@Autowired
	UserRepository users;

	User admin;

	@BeforeEach
	void resetUsers() {
		users.deleteAll();
		admin = userService.create("admin@ecoriv.com", "Ama Admin", UserRole.ADMIN, "correct-horse");
	}

	RequestPostProcessor asUser(User u) {
		return user(new AuthenticatedUser(u.getId(), u.getEmail(), u.getPasswordHash(), u.getRole().name(), true));
	}

	@Test
	void adminCanCrudUsers() throws Exception {
		var created = mvc
			.perform(post("/api/admin/users").with(asUser(admin)).with(csrf()).contentType("application/json")
				.content("""
						{"email": "kofi@ecoriv.com", "displayName": "Kofi Mensah",
						 "role": "MEMBER", "temporaryPassword": "temporary-1"}"""))
			.andExpect(status().isCreated())
			.andExpect(header().exists("Location"))
			.andExpect(jsonPath("$.email").value("kofi@ecoriv.com"))
			.andReturn();
		var id = com.jayway.jsonpath.JsonPath.<String>read(created.getResponse().getContentAsString(), "$.id");

		mvc.perform(get("/api/admin/users").with(asUser(admin)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.length()").value(2));

		mvc.perform(get("/api/admin/users/" + id).with(asUser(admin)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.displayName").value("Kofi Mensah"));

		mvc.perform(put("/api/admin/users/" + id).with(asUser(admin)).with(csrf()).contentType("application/json")
			.content("""
					{"displayName": "Kofi A. Mensah", "role": "ADMIN", "status": "ACTIVE"}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.role").value("ADMIN"));

		mvc.perform(delete("/api/admin/users/" + id).with(asUser(admin)).with(csrf()))
			.andExpect(status().isNoContent());
		mvc.perform(get("/api/admin/users/" + id).with(asUser(admin))).andExpect(status().isNotFound());
	}

	@Test
	void duplicateEmailIs409() throws Exception {
		mvc.perform(post("/api/admin/users").with(asUser(admin)).with(csrf()).contentType("application/json")
			.content("""
					{"email": "ADMIN@ecoriv.com", "displayName": "Copy Cat",
					 "role": "MEMBER", "temporaryPassword": "temporary-1"}"""))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.title").value("Duplicate email"));
	}

	@Test
	void unknownUserIs404() throws Exception {
		mvc.perform(get("/api/admin/users/" + UUID.randomUUID()).with(asUser(admin)))
			.andExpect(status().isNotFound());
	}

	@Test
	void invalidCreateIs422WithFieldErrors() throws Exception {
		mvc.perform(post("/api/admin/users").with(asUser(admin)).with(csrf()).contentType("application/json")
			.content("""
					{"email": "not-an-email", "displayName": "", "role": "MEMBER", "temporaryPassword": "short"}"""))
			.andExpect(status().isUnprocessableContent())
			.andExpect(jsonPath("$.errors.email").exists())
			.andExpect(jsonPath("$.errors.displayName").exists())
			.andExpect(jsonPath("$.errors.temporaryPassword").exists());
	}

	@Test
	void memberIsForbidden() throws Exception {
		var member = userService.create("kwame@ecoriv.com", "Kwame", UserRole.MEMBER, "password-123");
		mvc.perform(get("/api/admin/users").with(asUser(member)))
			.andExpect(status().isForbidden())
			.andExpect(jsonPath("$.status").value(403));
	}

	@Test
	void anonymousIs401() throws Exception {
		mvc.perform(get("/api/admin/users")).andExpect(status().isUnauthorized());
	}

	@Test
	void adminCannotDeleteThemselves() throws Exception {
		mvc.perform(delete("/api/admin/users/" + admin.getId()).with(asUser(admin)).with(csrf()))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.detail").value("You cannot delete your own account."));
	}

	@Test
	void adminCannotDemoteThemselves() throws Exception {
		mvc.perform(put("/api/admin/users/" + admin.getId()).with(asUser(admin)).with(csrf())
			.contentType("application/json")
			.content("""
					{"displayName": "Ama Admin", "role": "MEMBER", "status": "ACTIVE"}"""))
			.andExpect(status().isConflict());
	}

	@Test
	void lastActiveAdminCannotBeDisabled() throws Exception {
		var secondAdmin = userService.create("admin2@ecoriv.com", "Second Admin", UserRole.ADMIN, "password-123");
		// second admin tries to disable the only *other* admin after demoting themselves is not
		// possible; instead: second admin disables first, then nobody may disable the last one
		mvc.perform(put("/api/admin/users/" + admin.getId()).with(asUser(secondAdmin)).with(csrf())
			.contentType("application/json")
			.content("""
					{"displayName": "Ama Admin", "role": "ADMIN", "status": "DISABLED"}"""))
			.andExpect(status().isOk());

		mvc.perform(delete("/api/admin/users/" + secondAdmin.getId()).with(asUser(admin)).with(csrf()))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.detail").value("At least one active administrator must remain."));
	}
}
