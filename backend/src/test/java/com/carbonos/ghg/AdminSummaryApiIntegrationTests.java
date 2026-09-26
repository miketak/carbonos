package com.carbonos.ghg;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.assertj.core.api.Assertions;
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
import com.carbonos.user.AuthenticatedUser;
import com.carbonos.user.internal.AccessRequestService;
import com.carbonos.user.internal.User;
import com.carbonos.user.internal.UserRepository;
import com.carbonos.user.internal.UserRole;
import com.carbonos.user.internal.UserService;

/**
 * The administration panel's landing figures (spec 01.5). Two endpoints, one
 * per module, so neither module has to learn about the other.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class AdminSummaryApiIntegrationTests {

	@Autowired
	MockMvc mvc;

	@Autowired
	UserService userService;

	@Autowired
	UserRepository users;

	@Autowired
	AccessRequestService accessRequests;

	@Autowired
	OrganizationRepository organizations;

	@Autowired
	OrganizationMemberRepository members;

	@Autowired
	SupportAccessRepository grants;

	@Autowired
	JdbcTemplate jdbc;

	User admin;

	User client;

	@BeforeEach
	void reset() {
		grants.deleteAll();
		members.deleteAll();
		organizations.deleteAll();
		jdbc.update("DELETE FROM access_requests");
		users.deleteAll();
		admin = userService.create("summary-admin@ecoriv.com", "Ama Support", UserRole.ADMIN, "support-passw0rd");
		client = userService.create("summary-owner@sankofa.test", "Kojo Owner", UserRole.MEMBER, "client-passw0rd1");
	}

	/**
	 * The catalogue is shared by the whole test database, so a pack this class
	 * authors must not outlive it whether its test passes or fails.
	 */
	@AfterEach
	void removeTheTestPack() {
		jdbc.update("DELETE FROM ghg_factor_pack_rows WHERE edition_id = 'qa-2026'");
		jdbc.update("DELETE FROM ghg_factor_pack_editions WHERE edition_id = 'qa-2026'");
		jdbc.update("DELETE FROM ghg_factor_packs WHERE pack_key = 'qa'");
	}

	RequestPostProcessor as(User account) {
		return user(new AuthenticatedUser(account.getId(), account.getEmail(), "irrelevant",
				account.getRole().name(), true));
	}

	@Test
	void theAccountsSummaryCountsUsersAndTheRequestsStillWaiting() throws Exception {
		accessRequests.submit("newcomer@example.com", "Abena Owusu", "Asante Gold");

		mvc.perform(get("/api/admin/summary/accounts").with(as(admin)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.usersTotal").value(2))
			.andExpect(jsonPath("$.usersActive").value(2))
			.andExpect(jsonPath("$.administrators").value(1))
			.andExpect(jsonPath("$.accessRequestsPending").value(1));
	}

	@Test
	void thePlatformSummaryCountsOrganizationsAndTheGrantsInForce() throws Exception {
		mvc.perform(post("/api/ghg/organizations").with(as(client)).with(csrf()).contentType("application/json")
			.content("""
					{"name":"Sankofa Gold plc"}""")).andExpect(status().isCreated());
		var orgId = organizations.findAll().getFirst().getId();
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/support-access").with(as(admin)).with(csrf())
			.contentType("application/json").content("""
					{"reason":"ticket 4512, preparer cannot open the run"}"""))
			.andExpect(status().isCreated());

		mvc.perform(get("/api/admin/summary/platform").with(as(admin)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.organizations").value(1))
			.andExpect(jsonPath("$.grants.length()").value(1))
			.andExpect(jsonPath("$.grants[0].organizationName").value("Sankofa Gold plc"))
			.andExpect(jsonPath("$.grants[0].organizationAccountNo").isNumber())
			.andExpect(jsonPath("$.grants[0].adminEmail").value("summary-admin@ecoriv.com"))
			.andExpect(jsonPath("$.grants[0].mine").value(true))
			.andExpect(jsonPath("$.grants[0].reason").value("ticket 4512, preparer cannot open the run"));
	}

	@Test
	void aDraftTheCallerCuratedIsNotOfferedToThemForApproval() throws Exception {
		mvc.perform(post("/api/admin/factor-packs").with(as(admin)).with(csrf()).contentType("application/json")
			.content("""
					{"packKey":"qa","name":"QA pack","kind":"SOURCE","summary":"A pack for the summary test."}"""))
			.andExpect(status().isCreated());
		mvc.perform(post("/api/admin/factor-packs/qa/editions").with(as(admin)).with(csrf())
			.contentType("application/json").content("""
					{"editionId":"qa-2026","name":"QA 2026","source":"QA tables, 2026",
					 "sourceUrl":"https://example.test/qa-2026.xlsx","publicationYear":2026,
					 "gwpBasis":"AR5","license":"Test licence","retrieved":"2026-01-04",
					 "notes":"For the tests.","appliesFrom":"2026-01-01"}"""))
			.andExpect(status().isCreated());

		// spec 02.5: an approver may not be the curator, so the queue never offers
		// the curator work that publication would refuse
		mvc.perform(get("/api/admin/summary/platform").with(as(admin)))
			.andExpect(jsonPath("$.draftEditions[?(@.editionId=='qa-2026')].mayApprove").value(false))
			.andExpect(jsonPath("$.draftEditions[?(@.editionId=='qa-2026')].curatorEmail")
				.value("summary-admin@ecoriv.com"));

		var second = userService.create("summary-second@ecoriv.com", "Kofi Admin", UserRole.ADMIN, "second-passw0rd");
		mvc.perform(get("/api/admin/summary/platform").with(as(second)))
			.andExpect(jsonPath("$.draftEditions[?(@.editionId=='qa-2026')].mayApprove").value(true));

	}

	/**
	 * Spec 01.5 draws the same line spec 01.3 does: an administrator is an
	 * outsider to an organization until they assume logged access, so the panel
	 * may count a client but never describe its inventory.
	 */
	@Test
	void theSummaryCarriesNoTenantInventoryData() throws Exception {
		mvc.perform(post("/api/ghg/organizations").with(as(client)).with(csrf()).contentType("application/json")
			.content("""
					{"name":"Sankofa Gold plc"}""")).andExpect(status().isCreated());

		var payload = mvc.perform(get("/api/admin/summary/platform").with(as(admin)))
			.andExpect(status().isOk())
			.andExpect(content().contentTypeCompatibleWith("application/json"))
			.andReturn()
			.getResponse()
			.getContentAsString();

		// a bare total of open notices, never a per-organization breakdown: a notice
		// states a movement computed from that organization's own activity data
		Assertions.assertThat(payload).contains("\"openNotices\"");
		Assertions.assertThat(payload).doesNotContain("facilityCount", "inventory", "Inventory", "kgCo2e",
				"estimatedKgCo2eDelta", "rowsOverThreshold", "totalKgCo2e");
	}

	@Test
	void bothSummariesAreForAdministratorsOnly() throws Exception {
		mvc.perform(get("/api/admin/summary/accounts").with(as(client))).andExpect(status().isForbidden());
		mvc.perform(get("/api/admin/summary/platform").with(as(client))).andExpect(status().isForbidden());
		mvc.perform(get("/api/admin/summary/accounts")).andExpect(status().isUnauthorized());
		mvc.perform(get("/api/admin/summary/platform")).andExpect(status().isUnauthorized());
	}
}
