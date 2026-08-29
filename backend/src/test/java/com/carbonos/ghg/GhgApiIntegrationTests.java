package com.carbonos.ghg;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import com.carbonos.TestcontainersConfiguration;
import com.carbonos.ghg.internal.ActivityRecordRepository;
import com.carbonos.ghg.internal.FacilityRepository;
import com.carbonos.ghg.internal.GhgRunRepository;
import com.carbonos.ghg.internal.OrganizationRepository;
import com.carbonos.user.internal.security.AuthenticatedUser;
import com.jayway.jsonpath.JsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class GhgApiIntegrationTests {

	@Autowired
	MockMvc mvc;

	@Autowired
	GhgRunRepository runs;

	@Autowired
	ActivityRecordRepository activities;

	@Autowired
	FacilityRepository facilities;

	@Autowired
	OrganizationRepository organizations;

	@BeforeEach
	void resetGhgData() {
		runs.deleteAll();
		activities.deleteAll();
		facilities.deleteAll();
		organizations.deleteAll();
	}

	RequestPostProcessor asMember() {
		return user(new AuthenticatedUser(UUID.randomUUID(), "kojo@ecoriv.com", "irrelevant", "MEMBER", true));
	}

	String createOrganization(String name, String approach) throws Exception {
		var result = mvc
			.perform(post("/api/ghg/organizations").with(asMember()).with(csrf()).contentType("application/json")
				.content("""
						{"name": "%s", "consolidationApproach": "%s"}""".formatted(name, approach)))
			.andExpect(status().isCreated())
			.andExpect(header().exists("Location"))
			.andReturn();
		return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
	}

	String createFacility(String orgId, String name, String equityShare, boolean controlled) throws Exception {
		var result = mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/facilities").with(asMember()).with(csrf())
				.contentType("application/json")
				.content("""
						{"name": "%s", "location": "Accra, Ghana",
						 "equitySharePercent": %s, "controlled": %s}""".formatted(name, equityShare, controlled)))
			.andExpect(status().isCreated())
			.andReturn();
		return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
	}

	String factorIdByName(String name) throws Exception {
		var body = mvc.perform(get("/api/ghg/emission-factors").with(asMember()))
			.andExpect(status().isOk())
			.andReturn()
			.getResponse()
			.getContentAsString();
		return JsonPath.<java.util.List<String>>read(body, "$[?(@.name == '%s')].id".formatted(name)).getFirst();
	}

	void createActivity(String orgId, String facilityId, String factorId, String quantity, String date)
			throws Exception {
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/activities").with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"facilityId": "%s", "emissionFactorId": "%s",
					 "quantity": %s, "activityDate": "%s"}""".formatted(facilityId, factorId, quantity, date)))
			.andExpect(status().isCreated());
	}

	BigDecimal decimalAt(String json, String path) {
		return new BigDecimal(JsonPath.read(json, path).toString());
	}

	@Test
	void fullWorkflowUnderEquityShareWeighsFacilitiesByOwnership() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings", "EQUITY_SHARE");
		var owned = createFacility(orgId, "Accra HQ", "100", true);
		var jointVenture = createFacility(orgId, "Tema JV plant", "40", false);

		createActivity(orgId, owned, factorIdByName("Diesel"), "1000", "2026-03-15");
		createActivity(orgId, jointVenture, factorIdByName("Grid electricity (Ghana)"), "2000", "2026-06-01");

		var run = mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/runs").with(asMember()).with(csrf())
				.contentType("application/json")
				.content("""
						{"label": "FY2026 inventory", "periodStart": "2026-01-01", "periodEnd": "2026-12-31"}"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.run.activityCount").value(2))
			.andExpect(jsonPath("$.lines.length()").value(2))
			.andReturn()
			.getResponse()
			.getContentAsString();

		// diesel: 1000 L x 2.66 x 100% = 2660; electricity: 2000 kWh x 0.441 x 40% = 352.8
		assertThat(decimalAt(run, "$.run.scope1KgCo2e")).isEqualByComparingTo("2660");
		assertThat(decimalAt(run, "$.run.scope2KgCo2e")).isEqualByComparingTo("352.8");
		assertThat(decimalAt(run, "$.run.scope3KgCo2e")).isEqualByComparingTo("0");
		assertThat(decimalAt(run, "$.run.totalKgCo2e")).isEqualByComparingTo("3012.8");

		String runId = JsonPath.read(run, "$.run.id");
		mvc.perform(get("/api/ghg/runs/" + runId).with(asMember()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.run.label").value("FY2026 inventory"))
			.andExpect(jsonPath("$.lines.length()").value(2));

		mvc.perform(get("/api/ghg/organizations/" + orgId + "/runs").with(asMember()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.length()").value(1));
	}

	@Test
	void operationalControlCountsAllOrNothing() throws Exception {
		var orgId = createOrganization("Control Corp", "OPERATIONAL_CONTROL");
		var uncontrolled = createFacility(orgId, "Minority stake site", "40", false);
		createActivity(orgId, uncontrolled, factorIdByName("Diesel"), "1000", "2026-03-15");

		var run = mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/runs").with(asMember()).with(csrf())
				.contentType("application/json")
				.content("""
						{"label": "FY2026", "periodStart": "2026-01-01", "periodEnd": "2026-12-31"}"""))
			.andExpect(status().isCreated())
			.andReturn()
			.getResponse()
			.getContentAsString();

		assertThat(decimalAt(run, "$.run.totalKgCo2e")).isEqualByComparingTo("0");
		assertThat(decimalAt(run, "$.lines[0].weight")).isEqualByComparingTo("0");
	}

	@Test
	void runOnlyIncludesActivitiesInsideThePeriod() throws Exception {
		var orgId = createOrganization("Periodic Ltd", "OPERATIONAL_CONTROL");
		var site = createFacility(orgId, "Site", "100", true);
		var diesel = factorIdByName("Diesel");
		createActivity(orgId, site, diesel, "100", "2025-12-31");
		createActivity(orgId, site, diesel, "100", "2026-01-01");

		mvc.perform(post("/api/ghg/organizations/" + orgId + "/runs").with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"label": "FY2026", "periodStart": "2026-01-01", "periodEnd": "2026-12-31"}"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.run.activityCount").value(1));
	}

	@Test
	void runsAreImmutableSnapshots() throws Exception {
		var orgId = createOrganization("Snapshot SA", "OPERATIONAL_CONTROL");
		var site = createFacility(orgId, "Site", "100", true);
		createActivity(orgId, site, factorIdByName("Diesel"), "100", "2026-02-01");

		var run = mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/runs").with(asMember()).with(csrf())
				.contentType("application/json")
				.content("""
						{"label": "Before edits", "periodStart": "2026-01-01", "periodEnd": "2026-12-31"}"""))
			.andExpect(status().isCreated())
			.andReturn()
			.getResponse()
			.getContentAsString();
		String runId = JsonPath.read(run, "$.run.id");
		String activityId = JsonPath.read(run, "$.lines[0].activityId");

		mvc.perform(delete("/api/ghg/activities/" + activityId).with(asMember()).with(csrf()))
			.andExpect(status().isNoContent());

		var after = mvc.perform(get("/api/ghg/runs/" + runId).with(asMember()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.lines.length()").value(1))
			.andReturn()
			.getResponse()
			.getContentAsString();
		assertThat(decimalAt(after, "$.run.totalKgCo2e")).isEqualByComparingTo("266");
	}

	@Test
	void invalidPeriodIs422() throws Exception {
		var orgId = createOrganization("Backwards Inc", "EQUITY_SHARE");
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/runs").with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"label": "FY2026", "periodStart": "2026-12-31", "periodEnd": "2026-01-01"}"""))
			.andExpect(status().isUnprocessableContent())
			.andExpect(jsonPath("$.errors.periodEnd").exists());
	}

	@Test
	void duplicateOrganizationIs409() throws Exception {
		createOrganization("Ecoriv Holdings", "EQUITY_SHARE");
		mvc.perform(post("/api/ghg/organizations").with(asMember()).with(csrf()).contentType("application/json")
			.content("""
					{"name": "ecoriv holdings", "consolidationApproach": "EQUITY_SHARE"}"""))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.title").value("Duplicate organization"));
	}

	@Test
	void invalidFacilityIs422WithFieldErrors() throws Exception {
		var orgId = createOrganization("Validation SA", "EQUITY_SHARE");
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/facilities").with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"name": "", "location": "", "equitySharePercent": 150, "controlled": true}"""))
			.andExpect(status().isUnprocessableContent())
			.andExpect(jsonPath("$.errors.name").exists())
			.andExpect(jsonPath("$.errors.location").exists())
			.andExpect(jsonPath("$.errors.equitySharePercent").exists());
	}

	@Test
	void activityAgainstAnotherOrganizationsFacilityIs404() throws Exception {
		var orgId = createOrganization("Org A", "EQUITY_SHARE");
		var otherOrgId = createOrganization("Org B", "EQUITY_SHARE");
		var foreignFacility = createFacility(otherOrgId, "B site", "100", true);

		mvc.perform(post("/api/ghg/organizations/" + orgId + "/activities").with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"facilityId": "%s", "emissionFactorId": "%s",
					 "quantity": 10, "activityDate": "2026-01-01"}"""
				.formatted(foreignFacility, factorIdByName("Diesel"))))
			.andExpect(status().isNotFound());
	}

	@Test
	void unknownOrganizationIs404() throws Exception {
		mvc.perform(get("/api/ghg/organizations/" + UUID.randomUUID()).with(asMember()))
			.andExpect(status().isNotFound());
	}

	@Test
	void anonymousIs401() throws Exception {
		mvc.perform(get("/api/ghg/organizations")).andExpect(status().isUnauthorized());
	}

	@Test
	void seededFactorLibraryCoversAllThreeScopes() throws Exception {
		var body = mvc.perform(get("/api/ghg/emission-factors").with(asMember()))
			.andExpect(status().isOk())
			.andReturn()
			.getResponse()
			.getContentAsString();
		assertThat(JsonPath.<java.util.List<String>>read(body, "$[*].scope"))
			.contains("SCOPE_1", "SCOPE_2", "SCOPE_3");
	}

	@Test
	void deletingAnOrganizationCascades() throws Exception {
		var orgId = createOrganization("Ephemeral GmbH", "OPERATIONAL_CONTROL");
		var site = createFacility(orgId, "Site", "100", true);
		createActivity(orgId, site, factorIdByName("Diesel"), "10", "2026-01-15");
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/runs").with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"label": "FY2026", "periodStart": "2026-01-01", "periodEnd": "2026-12-31"}"""))
			.andExpect(status().isCreated());

		mvc.perform(delete("/api/ghg/organizations/" + orgId).with(asMember()).with(csrf()))
			.andExpect(status().isNoContent());

		assertThat(organizations.count()).isZero();
		assertThat(facilities.count()).isZero();
		assertThat(activities.count()).isZero();
		assertThat(runs.count()).isZero();
	}
}
