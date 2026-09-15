package com.carbonos.ghg;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

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
import com.carbonos.ghg.internal.OrganizationMemberRepository;
import com.carbonos.ghg.internal.OrganizationRepository;
import com.carbonos.ghg.internal.SupportAccessRepository;
import com.carbonos.ghg.internal.SupportAccessService;
import com.carbonos.user.AuthenticatedUser;
import com.carbonos.user.internal.User;
import com.carbonos.user.internal.UserRepository;
import com.carbonos.user.internal.UserRole;
import com.carbonos.user.internal.UserService;

import com.jayway.jsonpath.JsonPath;

/**
 * What the deployment's policy actually changes (spec 01.5): how long support
 * access lasts, who may create an organization and who ends up owning it.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class PlatformPolicyIntegrationTests {

	@Autowired
	MockMvc mvc;

	@Autowired
	UserService userService;

	@Autowired
	UserRepository users;

	@Autowired
	OrganizationRepository organizations;

	@Autowired
	OrganizationMemberRepository members;

	@Autowired
	SupportAccessRepository grants;

	@Autowired
	SupportAccessService supportAccess;

	@Autowired
	JdbcTemplate jdbc;

	User admin;

	User client;

	@BeforeEach
	void reset() {
		grants.deleteAll();
		members.deleteAll();
		organizations.deleteAll();
		jdbc.update("DELETE FROM platform_setting_changes");
		jdbc.update("UPDATE platform_settings SET support_access_window_hours = 24, "
				+ "organization_creation = 'EVERYONE', updated_by = NULL WHERE id = 1");
		users.deleteAll();
		admin = userService.create("policy-admin@ecoriv.com", "Ama Support", UserRole.ADMIN, "support-passw0rd");
		client = userService.create("policy-owner@sankofa.test", "Kojo Owner", UserRole.MEMBER, "client-passw0rd1");
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
				+ "organization_creation = 'EVERYONE', updated_by = NULL WHERE id = 1");
	}

	RequestPostProcessor as(User account) {
		return user(new AuthenticatedUser(account.getId(), account.getEmail(), "irrelevant",
				account.getRole().name(), true));
	}

	private void setPolicy(String windowHours, String creation, String reason) throws Exception {
		mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/admin/settings")
			.with(as(admin))
			.with(csrf())
			.contentType("application/json")
			.content("""
					{"supportAccessWindowHours":%s,"organizationCreation":"%s","reason":"%s"}"""
				.formatted(windowHours, creation, reason)))
			.andExpect(status().isOk());
	}

	private String createOrganizationAs(User account, String name, String ownerEmail) throws Exception {
		var owner = ownerEmail == null ? "" : ",\"ownerEmail\":\"%s\"".formatted(ownerEmail);
		var result = mvc
			.perform(post("/api/ghg/organizations").with(as(account)).with(csrf()).contentType("application/json")
				.content("{\"name\":\"%s\"%s}".formatted(name, owner)))
			.andExpect(status().isCreated())
			.andReturn();
		return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
	}

	// --- the support-access window (decision D-02) ---------------------------

	@Test
	void aGrantLastsTheWindowInForceAndKeepsItWhenTheSettingMovesAgain() throws Exception {
		setPolicy("2", "EVERYONE", "tightening after the Q3 review");
		var orgId = createOrganizationAs(client, "Sankofa Gold plc", null);

		var before = Instant.now();
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/support-access").with(as(admin)).with(csrf())
			.contentType("application/json").content("""
					{"reason":"ticket 4512, preparer cannot open the run"}"""))
			.andExpect(status().isCreated());

		var grant = grants.findAll().getFirst();
		assertThat(Duration.between(grant.getGrantedAt(), grant.getExpiresAt())).isEqualTo(Duration.ofHours(2));
		assertThat(grant.getExpiresAt()).isAfter(before);

		// widening the window afterwards must not extend access already in force
		setPolicy("48", "EVERYONE", "relaxing again for a long migration");
		assertThat(grants.findAll().getFirst().getExpiresAt()).isEqualTo(grant.getExpiresAt());
	}

	@Test
	void theExpiryLineStatesTheDurationThatElapsedNotTheSettingInForce() throws Exception {
		setPolicy("2", "EVERYONE", "tightening after the Q3 review");
		var orgId = createOrganizationAs(client, "Sankofa Gold plc", null);
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/support-access").with(as(admin)).with(csrf())
			.contentType("application/json").content("""
					{"reason":"ticket 4512, preparer cannot open the run"}"""))
			.andExpect(status().isCreated());

		// age the whole grant into the past, keeping its own 2-hour window intact,
		// then widen the setting before the sweep runs
		var now = Instant.now();
		jdbc.update("UPDATE ghg_support_access SET granted_at = ?, expires_at = ?",
				java.sql.Timestamp.from(now.minusSeconds(3 * 3600)),
				java.sql.Timestamp.from(now.minusSeconds(3600)));
		setPolicy("48", "EVERYONE", "relaxing again for a long migration");
		supportAccess.expireGrants();

		// a 2-hour grant must not be described as a 48-hour one afterwards
		mvc.perform(get("/api/ghg/organizations/" + UUID.fromString(orgId) + "/events").with(as(client)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[?(@.action=='ADMIN_ACCESS_EXPIRED')].reason")
				.value("support access expired after 2 hours"));
	}

	// --- who may create an organization (decision D-03) ----------------------

	@Test
	void whileCreationIsOpenTheCreatorIsTheOwner() throws Exception {
		mvc.perform(get("/api/ghg/organizations/capabilities").with(as(client)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.mayCreateOrganization").value(true));

		var orgId = createOrganizationAs(client, "Sankofa Gold plc", null);
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/members").with(as(client)))
			.andExpect(jsonPath("$.length()").value(1))
			.andExpect(jsonPath("$[0].email").value("policy-owner@sankofa.test"))
			.andExpect(jsonPath("$[0].role").value("OWNER"));
	}

	@Test
	void whileCreationIsReservedAMemberIsRefusedAndTheScreenIsTold() throws Exception {
		setPolicy("24", "ADMINISTRATORS", "hosted deployment, we onboard clients");

		mvc.perform(get("/api/ghg/organizations/capabilities").with(as(client)))
			.andExpect(jsonPath("$.mayCreateOrganization").value(false));
		mvc.perform(get("/api/ghg/organizations/capabilities").with(as(admin)))
			.andExpect(jsonPath("$.mayCreateOrganization").value(true));

		mvc.perform(post("/api/ghg/organizations").with(as(client)).with(csrf()).contentType("application/json")
			.content("""
					{"name":"Sankofa Gold plc"}"""))
			.andExpect(status().isForbidden())
			.andExpect(jsonPath("$.detail").value("This action needs a platform administrator."));

		assertThat(organizations.count()).isZero();
	}

	@Test
	void anAdministratorSeatsTheNamedClientAsOwnerAndIsNotAMemberThemselves() throws Exception {
		setPolicy("24", "ADMINISTRATORS", "hosted deployment, we onboard clients");
		var orgId = createOrganizationAs(admin, "Sankofa Gold plc", "policy-owner@sankofa.test");

		// the client owns it
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/members").with(as(client)))
			.andExpect(jsonPath("$.length()").value(1))
			.andExpect(jsonPath("$[0].email").value("policy-owner@sankofa.test"))
			.andExpect(jsonPath("$[0].role").value("OWNER"));

		// and the administrator is an outsider again, as spec 01.3 requires: standing
		// membership of every client's organization is the access that spec abolishes
		mvc.perform(get("/api/ghg/organizations/" + orgId).with(as(admin))).andExpect(status().isNotFound());
		mvc.perform(get("/api/ghg/organizations").with(as(admin))).andExpect(jsonPath("$.length()").value(0));

		// the organization's own history records who created it and for whom
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/events").with(as(client)))
			.andExpect(jsonPath("$[?(@.action=='ORGANIZATION_CREATED')].reason")
				.value("created by a platform administrator for policy-owner@sankofa.test"));
	}

	@Test
	void namingAnEmailWithNoAccountIsRefused() throws Exception {
		setPolicy("24", "ADMINISTRATORS", "hosted deployment, we onboard clients");

		mvc.perform(post("/api/ghg/organizations").with(as(admin)).with(csrf()).contentType("application/json")
			.content("""
					{"name":"Sankofa Gold plc","ownerEmail":"nobody@nowhere.test"}"""))
			.andExpect(status().isNotFound());

		assertThat(organizations.count()).isZero();
	}
}
