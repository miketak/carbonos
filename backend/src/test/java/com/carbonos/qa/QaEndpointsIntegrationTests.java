package com.carbonos.qa;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import com.carbonos.TestcontainersConfiguration;
import com.carbonos.user.AuthenticatedUser;
import com.carbonos.user.UserDirectory;

/** The QA hooks with {@code carbonos.qa.endpoints=true}: the catalogue, the reset, the digest. */
@SpringBootTest(properties = { "carbonos.qa.endpoints=true", "carbonos.admin.email=qa-admin@example.test",
		"carbonos.admin.password=Qa-admin-pass-2026" })
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class QaEndpointsIntegrationTests {

	@Autowired
	MockMvc mvc;

	@Autowired
	UserDirectory users;

	RequestPostProcessor asAdmin() {
		return user(new AuthenticatedUser(UUID.randomUUID(), "admin@example.test", "n/a", "ADMIN", true));
	}

	RequestPostProcessor asMember() {
		return user(new AuthenticatedUser(UUID.randomUUID(), "member@example.test", "n/a", "MEMBER", true));
	}

	@Test
	void theCatalogueListsEveryModulesRulesOnce() throws Exception {
		mvc.perform(get("/api/qa/rules").with(asAdmin()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.sha256").isNotEmpty())
			.andExpect(jsonPath("$.rules[?(@.id == 'user.email.duplicate')].module", contains("user")))
			.andExpect(jsonPath("$.rules[?(@.id == 'platform.reason-too-short')].field", contains("reason")))
			.andExpect(jsonPath("$.rules[?(@.id == 'user.password.weak')]", hasSize(1)));
	}

	@Test
	void theHooksNeedThePlatformAdministrator() throws Exception {
		mvc.perform(get("/api/qa/rules").with(asMember())).andExpect(status().isForbidden());
		mvc.perform(post("/api/qa/reset").with(asMember()).with(csrf())).andExpect(status().isForbidden());
	}

	@Test
	void resetReplaysTheMigrationsAndSeedsTheAdministrator() throws Exception {
		mvc.perform(post("/api/qa/reset").with(asAdmin()).with(csrf())).andExpect(status().isNoContent());
		assertThat(users.findByEmail("qa-admin@example.test")).isPresent();
		mvc.perform(get("/api/qa/digest").with(asAdmin()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.counts.users").value(1))
			.andExpect(jsonPath("$.counts.platform_settings").value(1))
			.andExpect(jsonPath("$.sha256").isNotEmpty());
	}
}
