package com.carbonos.platform;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import com.carbonos.TestcontainersConfiguration;
import com.carbonos.platform.internal.PlatformSettingChangeRepository;
import com.carbonos.platform.internal.PlatformSettingsService;
import com.carbonos.user.AuthenticatedUser;
import com.carbonos.user.internal.User;
import com.carbonos.user.internal.UserRepository;
import com.carbonos.user.internal.UserRole;
import com.carbonos.user.internal.UserService;

/**
 * The deployment's policy and the record of every change to it (spec 01.5).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class PlatformSettingsApiIntegrationTests {

	@Autowired
	MockMvc mvc;

	@Autowired
	UserService userService;

	@Autowired
	UserRepository users;

	@Autowired
	PlatformSettingsService settings;

	@Autowired
	PlatformSettingChangeRepository changes;

	@Autowired
	JdbcTemplate jdbc;

	User admin;

	User member;

	@BeforeEach
	void reset() {
		// straight back to the shipped defaults; the service deliberately offers no
		// way to rewrite the policy without recording why
		changes.deleteAll();
		jdbc.update("UPDATE platform_settings SET support_access_window_hours = 24, "
				+ "organization_creation = 'EVERYONE', editions_in_published_periods = 'BLOCKED', "
				+ "updated_by = NULL WHERE id = 1");
		users.deleteAll();
		admin = userService.create("admin@ecoriv.com", "Ama Admin", UserRole.ADMIN, "correct-horse-1");
		member = userService.create("member@ecoriv.com", "Kofi Member", UserRole.MEMBER, "correct-horse-1");
	}

	/**
	 * The settings are one row shared by the whole deployment, so a test class
	 * that changes them must put them back. Leaving creation reserved to
	 * administrators would refuse every organization the later test classes
	 * create.
	 */
	@AfterEach
	void restoreTheDefaults() {
		jdbc.update("DELETE FROM platform_setting_changes");
		jdbc.update("UPDATE platform_settings SET support_access_window_hours = 24, "
				+ "organization_creation = 'EVERYONE', editions_in_published_periods = 'BLOCKED', "
				+ "updated_by = NULL WHERE id = 1");
	}

	RequestPostProcessor as(User u) {
		return user(new AuthenticatedUser(u.getId(), u.getEmail(), u.getPasswordHash(), u.getRole().name(), true));
	}

	@Test
	void theDefaultsAreTodaysBehaviour() throws Exception {
		mvc.perform(get("/api/admin/settings").with(as(admin)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.supportAccessWindowHours").value(24))
			.andExpect(jsonPath("$.organizationCreation").value("EVERYONE"))
			// spec 02.6 rule 1: a published period blocks an edition until an administrator says otherwise
			.andExpect(jsonPath("$.editionsInPublishedPeriods").value("BLOCKED"));
		assertThat(settings.editionsInPublishedPeriods())
			.isEqualTo(PlatformSettings.EditionsInPublishedPeriods.BLOCKED);
	}

	@Test
	void allowingEditionsInsidePublishedPeriodsIsRecordedWithItsReason() throws Exception {
		// only the setting that moves is sent; the others are left as they are
		mvc.perform(put("/api/admin/settings").with(as(admin)).with(csrf()).contentType("application/json")
			.content("""
					{"editionsInPublishedPeriods":"ALLOWED",
					 "reason":"published runs keep their factors; owner decision 2026-09-29"}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.editionsInPublishedPeriods").value("ALLOWED"))
			.andExpect(jsonPath("$.supportAccessWindowHours").value(24))
			.andExpect(jsonPath("$.organizationCreation").value("EVERYONE"));

		assertThat(settings.editionsInPublishedPeriods())
			.isEqualTo(PlatformSettings.EditionsInPublishedPeriods.ALLOWED);
		mvc.perform(get("/api/admin/settings/history").with(as(admin)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.length()").value(1))
			.andExpect(jsonPath("$[0].setting").value("editionsInPublishedPeriods"))
			.andExpect(jsonPath("$[0].oldValue").value("BLOCKED"))
			.andExpect(jsonPath("$[0].newValue").value("ALLOWED"))
			.andExpect(jsonPath("$[0].reason").value("published runs keep their factors; owner decision 2026-09-29"))
			.andExpect(jsonPath("$[0].actorEmail").value("admin@ecoriv.com"));

		// and like every other setting, it does not move without a reason
		mvc.perform(put("/api/admin/settings").with(as(admin)).with(csrf()).contentType("application/json")
			.content("""
					{"editionsInPublishedPeriods":"BLOCKED","reason":"undo"}"""))
			.andExpect(status().isUnprocessableEntity())
			.andExpect(jsonPath("$.errors.reason").exists());
		assertThat(settings.editionsInPublishedPeriods())
			.isEqualTo(PlatformSettings.EditionsInPublishedPeriods.ALLOWED);
		assertThat(changes.count()).isEqualTo(1);
	}

	@Test
	void anAdministratorChangesThePolicyAndTheChangeIsRecorded() throws Exception {
		mvc.perform(put("/api/admin/settings").with(as(admin)).with(csrf()).contentType("application/json")
			.content("""
					{"supportAccessWindowHours":2,"organizationCreation":"ADMINISTRATORS",
					 "reason":"tightening after the Q3 review"}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.supportAccessWindowHours").value(2))
			.andExpect(jsonPath("$.organizationCreation").value("ADMINISTRATORS"))
			.andExpect(jsonPath("$.updatedBy").value("admin@ecoriv.com"));

		assertThat(settings.supportAccessWindow()).isEqualTo(Duration.ofHours(2));
		assertThat(settings.organizationCreation()).isEqualTo(PlatformSettings.OrganizationCreation.ADMINISTRATORS);

		// one entry per setting that moved, each carrying what it moved from and why
		mvc.perform(get("/api/admin/settings/history").with(as(admin)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.length()").value(2))
			.andExpect(jsonPath("$[?(@.setting=='supportAccessWindowHours')].oldValue").value("24"))
			.andExpect(jsonPath("$[?(@.setting=='supportAccessWindowHours')].newValue").value("2"))
			.andExpect(jsonPath("$[?(@.setting=='organizationCreation')].newValue").value("ADMINISTRATORS"))
			.andExpect(jsonPath("$[0].reason").value("tightening after the Q3 review"))
			.andExpect(jsonPath("$[0].actorEmail").value("admin@ecoriv.com"));
	}

	@Test
	void aWindowOutsideOneToSeventyTwoHoursIsRefused() throws Exception {
		mvc.perform(put("/api/admin/settings").with(as(admin)).with(csrf()).contentType("application/json")
			.content("""
					{"supportAccessWindowHours":0,"organizationCreation":"EVERYONE","reason":"far too short"}"""))
			.andExpect(status().isUnprocessableEntity())
			.andExpect(jsonPath("$.errors.supportAccessWindowHours").exists());

		// a week of owner-equivalent access is standing access, not break-glass
		mvc.perform(put("/api/admin/settings").with(as(admin)).with(csrf()).contentType("application/json")
			.content("""
					{"supportAccessWindowHours":168,"organizationCreation":"EVERYONE","reason":"a whole week"}"""))
			.andExpect(status().isUnprocessableEntity())
			.andExpect(jsonPath("$.errors.supportAccessWindowHours").exists());

		assertThat(changes.count()).isZero();
	}

	@Test
	void aChangeWithoutAReasonIsRefused() throws Exception {
		mvc.perform(put("/api/admin/settings").with(as(admin)).with(csrf()).contentType("application/json")
			.content("""
					{"supportAccessWindowHours":8,"organizationCreation":"EVERYONE","reason":"short"}"""))
			.andExpect(status().isUnprocessableEntity())
			.andExpect(jsonPath("$.errors.reason").exists());

		assertThat(settings.supportAccessWindow()).isEqualTo(Duration.ofHours(24));
		assertThat(changes.count()).isZero();
	}

	@Test
	void aRequestThatChangesNothingIsRefusedRatherThanRecorded() throws Exception {
		mvc.perform(put("/api/admin/settings").with(as(admin)).with(csrf()).contentType("application/json")
			.content("""
					{"supportAccessWindowHours":24,"organizationCreation":"EVERYONE","reason":"no change at all"}"""))
			.andExpect(status().isUnprocessableEntity());

		assertThat(changes.count()).isZero();
	}

	@Test
	void theWindowInForceIsReadableByAnySignedInUser() throws Exception {
		mvc.perform(get("/api/platform/settings").with(as(member)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.supportAccessWindowHours").value(24));
	}

	@Test
	void aMemberCannotReadOrChangeThePolicy() throws Exception {
		mvc.perform(get("/api/admin/settings").with(as(member))).andExpect(status().isForbidden());
		mvc.perform(put("/api/admin/settings").with(as(member)).with(csrf()).contentType("application/json")
			.content("""
					{"supportAccessWindowHours":2,"organizationCreation":"EVERYONE","reason":"not my call"}"""))
			.andExpect(status().isForbidden());
	}

	@Test
	void anonymousIsUnauthorized() throws Exception {
		mvc.perform(get("/api/admin/settings")).andExpect(status().isUnauthorized());
		mvc.perform(get("/api/platform/settings")).andExpect(status().isUnauthorized());
	}
}
