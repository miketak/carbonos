package com.carbonos.ghg;

import static org.assertj.core.api.Assertions.assertThat;
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
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import com.carbonos.TestcontainersConfiguration;
import com.carbonos.ghg.internal.ActivityRecordRepository;
import com.carbonos.ghg.internal.BoundaryTreatmentRepository;
import com.carbonos.ghg.internal.EmissionFactorRepository;
import com.carbonos.ghg.internal.FacilityRepository;
import com.carbonos.ghg.internal.GhgRunRepository;
import com.carbonos.ghg.internal.InventoryAssignmentRepository;
import com.carbonos.ghg.internal.InventoryRepository;
import com.carbonos.ghg.internal.OrganizationRepository;
import com.carbonos.ghg.internal.UnitConverter;
import com.carbonos.user.AuthenticatedUser;
import com.jayway.jsonpath.JsonPath;

/** Spec 003: facts vs. views — inventories, boundaries, assignments, gates, runs. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class GhgApiIntegrationTests {

	// the seeded Diesel factor: SCOPE_1, litre, 2.66 kgCO2e/litre
	private static final String DIESEL_FACTOR = "c4a1f001-0000-4000-8000-000000000003";
	// the seeded Ghana grid electricity factor: SCOPE_2, kWh, 0.441 kgCO2e/kWh
	private static final String GRID_FACTOR = "c4a1f001-0000-4000-8000-000000000006";

	@Autowired
	MockMvc mvc;

	@Autowired
	GhgRunRepository runs;

	@Autowired
	InventoryAssignmentRepository assignments;

	@Autowired
	BoundaryTreatmentRepository boundaryTreatments;

	@Autowired
	InventoryRepository inventories;

	@Autowired
	ActivityRecordRepository activities;

	@Autowired
	FacilityRepository facilities;

	@Autowired
	OrganizationRepository organizations;

	@Autowired
	EmissionFactorRepository emissionFactors;

	@Autowired
	UnitConverter unitConverter;

	@BeforeEach
	void resetGhgData() {
		runs.deleteAll();
		assignments.deleteAll();
		boundaryTreatments.deleteAll();
		inventories.deleteAll();
		activities.deleteAll();
		facilities.deleteAll();
		organizations.deleteAll();
	}

	// spec 004: data is tenant-scoped, so every call in a test acts as one stable owner
	private final UUID ownerId = UUID.randomUUID();

	RequestPostProcessor asMember() {
		return user(new AuthenticatedUser(ownerId, "kojo@ecoriv.com", "irrelevant", "MEMBER", true));
	}

	RequestPostProcessor asOutsider() {
		return user(new AuthenticatedUser(UUID.randomUUID(), "efua@ecoriv.com", "irrelevant", "MEMBER", true));
	}

	RequestPostProcessor asAdmin() {
		return user(new AuthenticatedUser(UUID.randomUUID(), "ama@ecoriv.com", "irrelevant", "ADMIN", true));
	}

	// --- helpers ------------------------------------------------------------

	String createOrganization(String name) throws Exception {
		var result = mvc
			.perform(post("/api/ghg/organizations").with(asMember()).with(csrf()).contentType("application/json")
				.content("""
						{"name": "%s"}""".formatted(name)))
			.andExpect(status().isCreated())
			.andExpect(header().exists("Location"))
			.andReturn();
		return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
	}

	String createFacility(String orgId, String name) throws Exception {
		var result = mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/facilities").with(asMember()).with(csrf())
				.contentType("application/json")
				.content("""
						{"name": "%s", "location": "Tema, Ghana", "equitySharePercent": 100, "controlled": true}"""
					.formatted(name)))
			.andExpect(status().isCreated())
			.andReturn();
		return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
	}

	String createActivity(String orgId, String facilityId, String type, String quantity, String unit, String date)
			throws Exception {
		var result = mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/activities").with(asMember()).with(csrf())
				.contentType("application/json")
				.content("""
						{"facilityId": "%s", "activityType": "%s", "quantity": %s, "unit": "%s",
						 "activityDate": "%s", "dataSource": "Fuel invoice", "evidenceRef": "INV-2938",
						 "dataQuality": "MEASURED"}""".formatted(facilityId, type, quantity, unit, date)))
			.andExpect(status().isCreated())
			.andReturn();
		return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
	}

	String createInventory(String orgId, String name, String approach) throws Exception {
		var result = mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/inventories").with(asMember()).with(csrf())
				.contentType("application/json")
				.content("""
						{"name": "%s", "periodStart": "2025-01-01", "periodEnd": "2025-12-31",
						 "purpose": "Corporate reporting", "consolidationApproach": "%s"}"""
					.formatted(name, approach)))
			.andExpect(status().isCreated())
			.andReturn();
		return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
	}

	void putBoundary(String inventoryId, String facilityId, String ownership, boolean financial, boolean operational)
			throws Exception {
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/boundary/" + facilityId).with(asMember())
			.with(csrf())
			.contentType("application/json")
			.content("""
					{"ownershipPercent": %s, "financialControl": %s, "operationalControl": %s}"""
				.formatted(ownership, financial, operational)))
			.andExpect(status().isOk());
	}

	String syncAndGetAssignmentId(String inventoryId, String activityId) throws Exception {
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/assignments/sync").with(asMember()).with(csrf()))
			.andExpect(status().isOk());
		var listing = mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember()))
			.andExpect(status().isOk())
			.andReturn()
			.getResponse()
			.getContentAsString();
		java.util.List<String> ids = JsonPath.read(listing, "$[?(@.activityId == '" + activityId + "')].id");
		return ids.getFirst();
	}

	void classify(String assignmentId, String factorId) throws Exception {
		mvc.perform(put("/api/ghg/assignments/" + assignmentId + "/classify").with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"emissionFactorId": "%s"}""".formatted(factorId)))
			.andExpect(status().isOk());
	}

	// --- facts --------------------------------------------------------------

	@Test
	void activityRecordsAreFactsWithoutAccountingTreatment() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var facilityId = createFacility(orgId, "Tema Plant");
		createActivity(orgId, facilityId, "Diesel consumption", "12500", "litre", "2025-03-15");

		mvc.perform(get("/api/ghg/organizations/" + orgId + "/activities").with(asMember()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].activityType").value("Diesel consumption"))
			.andExpect(jsonPath("$[0].unit").value("litre"))
			.andExpect(jsonPath("$[0].dataSource").value("Fuel invoice"))
			.andExpect(jsonPath("$[0].evidenceRef").value("INV-2938"))
			.andExpect(jsonPath("$[0].dataQuality").value("MEASURED"))
			.andExpect(jsonPath("$[0].scope").doesNotExist());
	}

	@Test
	void duplicateOrganizationNamesAreRejected() throws Exception {
		createOrganization("Ecoriv Holdings");
		mvc.perform(post("/api/ghg/organizations").with(asMember()).with(csrf()).contentType("application/json")
			.content("""
					{"name": "ecoriv holdings"}"""))
			.andExpect(status().isConflict());
	}

	// --- inventories and boundary ------------------------------------------

	@Test
	void multipleInventoriesMayCoverTheSamePeriod() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		createInventory(orgId, "2025 Corporate Inventory", "OPERATIONAL_CONTROL");
		createInventory(orgId, "2025 Equity-Share Inventory", "EQUITY_SHARE");

		mvc.perform(get("/api/ghg/organizations/" + orgId + "/inventories").with(asMember()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.length()").value(2));
	}

	@Test
	void boundaryDerivesAccountingShareFromTheApproach() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var facilityId = createFacility(orgId, "Tema Plant");
		var equityInventory = createInventory(orgId, "Equity view", "EQUITY_SHARE");
		putBoundary(equityInventory, facilityId, "40", false, true);

		mvc.perform(get("/api/ghg/inventories/" + equityInventory + "/boundary").with(asMember()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].inBoundary").value(true))
			.andExpect(jsonPath("$[0].accountingShare").value(0.40));

		var controlInventory = createInventory(orgId, "Control view", "OPERATIONAL_CONTROL");
		putBoundary(controlInventory, facilityId, "40", false, true);
		mvc.perform(get("/api/ghg/inventories/" + controlInventory + "/boundary").with(asMember()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].accountingShare").value(1));
	}

	// --- assignments ---------------------------------------------------------

	@Test
	void syncAutoExcludesOutsidePeriodAndBoundaryWithDocumentedReasons() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var inPlant = createFacility(orgId, "Tema Plant");
		var outPlant = createFacility(orgId, "Kumasi Plant");
		var inActivity = createActivity(orgId, inPlant, "Diesel consumption", "100", "litre", "2025-03-15");
		var lateActivity = createActivity(orgId, inPlant, "Diesel consumption", "50", "litre", "2026-02-01");
		var strayActivity = createActivity(orgId, outPlant, "Diesel consumption", "70", "litre", "2025-05-01");

		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, inPlant, "100", true, true);
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/assignments/sync").with(asMember()).with(csrf()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.created").value(3));

		var listing = mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember()))
			.andExpect(status().isOk())
			.andReturn()
			.getResponse()
			.getContentAsString();
		assertThat(JsonPath.<java.util.List<Boolean>>read(listing,
				"$[?(@.activityId == '" + inActivity + "')].included").getFirst()).isTrue();
		assertThat(JsonPath.<java.util.List<String>>read(listing,
				"$[?(@.activityId == '" + lateActivity + "')].exclusionReason").getFirst())
			.isEqualTo("OUTSIDE_PERIOD");
		assertThat(JsonPath.<java.util.List<String>>read(listing,
				"$[?(@.activityId == '" + strayActivity + "')].exclusionReason").getFirst())
			.isEqualTo("OUTSIDE_BOUNDARY");
	}

	@Test
	void classificationDerivesScopeAndCategoryWithoutTouchingTheFact() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var facilityId = createFacility(orgId, "Tema Plant");
		var activityId = createActivity(orgId, facilityId, "Diesel consumption", "100", "litre", "2025-03-15");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, facilityId, "100", true, true);
		var assignmentId = syncAndGetAssignmentId(inventoryId, activityId);

		mvc.perform(put("/api/ghg/assignments/" + assignmentId + "/classify").with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"emissionFactorId": "%s"}""".formatted(DIESEL_FACTOR)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.scope").value("SCOPE_1"))
			.andExpect(jsonPath("$.category").value("MOBILE_COMBUSTION"));

		// invariant 2: the underlying fact is unchanged
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/activities").with(asMember()))
			.andExpect(jsonPath("$[0].scope").doesNotExist())
			.andExpect(jsonPath("$[0].activityType").value("Diesel consumption"));
	}

	// --- validation gates ----------------------------------------------------

	@Test
	void validationBlocksUnclassifiedIncludedActivitiesAndUnitMismatches() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var facilityId = createFacility(orgId, "Tema Plant");
		var activityId = createActivity(orgId, facilityId, "Electricity", "500", "kWh", "2025-06-01");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");

		// empty boundary + unreviewed data
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.ready").value(false))
			.andExpect(jsonPath("$.gates[0].status").value("BLOCKED"));

		putBoundary(inventoryId, facilityId, "100", true, true);
		var assignmentId = syncAndGetAssignmentId(inventoryId, activityId);

		// included but unclassified
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.ready").value(false))
			.andExpect(jsonPath("$.gates[2].status").value("BLOCKED"));

		// wrong-unit factor: Diesel expects litres, the fact is in kWh
		classify(assignmentId, DIESEL_FACTOR);
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.ready").value(false))
			.andExpect(jsonPath("$.gates[3].status").value("BLOCKED"));

		// matching factor clears every gate
		classify(assignmentId, GRID_FACTOR);
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.ready").value(true));
	}

	@Test
	void runCreationIsRefusedWhileValidationBlocks() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");

		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/runs").with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"label": "Run 001"}"""))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.title").value("Validation failing"));
	}

	// --- runs -----------------------------------------------------------------

	@Test
	void runSnapshotsTheViewAndCanBeMarkedFinal() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var facilityId = createFacility(orgId, "Tema Plant");
		var activityId = createActivity(orgId, facilityId, "Diesel consumption", "1000", "litre", "2025-03-15");
		var inventoryId = createInventory(orgId, "2025 Equity View", "EQUITY_SHARE");
		putBoundary(inventoryId, facilityId, "40", false, false);
		classify(syncAndGetAssignmentId(inventoryId, activityId), DIESEL_FACTOR);

		// 1000 L x 2.66 kg/L x 40% = 1064 kg
		var result = mvc
			.perform(post("/api/ghg/inventories/" + inventoryId + "/runs").with(asMember()).with(csrf())
				.contentType("application/json")
				.content("""
						{"label": "Run 001"}"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.run.totalKgCo2e").value(1064.0))
			.andExpect(jsonPath("$.run.scope1KgCo2e").value(1064.0))
			.andExpect(jsonPath("$.lines[0].weight").value(0.40))
			.andExpect(jsonPath("$.lines[0].factorName").value("Diesel"))
			.andReturn();
		String runId = JsonPath.read(result.getResponse().getContentAsString(), "$.run.id");

		mvc.perform(post("/api/ghg/runs/" + runId + "/finalize").with(asMember()).with(csrf()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.finalRunId").value(runId));
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/runs").with(asMember()))
			.andExpect(jsonPath("$[0].isFinal").value(true));

		mvc.perform(delete("/api/ghg/runs/" + runId).with(asMember()).with(csrf()))
			.andExpect(status().isNoContent());
		assertThat(inventories.findById(UUID.fromString(inventoryId)).orElseThrow().getFinalRunId()).isNull();
	}

	@Test
	void twoInventoriesAccountTheSameFactDifferently() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var facilityId = createFacility(orgId, "Tema Plant");
		var activityId = createActivity(orgId, facilityId, "Diesel consumption", "1000", "litre", "2025-03-15");

		var corporate = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(corporate, facilityId, "40", false, true);
		classify(syncAndGetAssignmentId(corporate, activityId), DIESEL_FACTOR);

		var equity = createInventory(orgId, "2025 Equity", "EQUITY_SHARE");
		putBoundary(equity, facilityId, "40", false, true);
		classify(syncAndGetAssignmentId(equity, activityId), DIESEL_FACTOR);

		// operational control: 100% -> 2660 kg; equity share: 40% -> 1064 kg
		mvc.perform(post("/api/ghg/inventories/" + corporate + "/runs").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"label": "Run 001"}"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.run.totalKgCo2e").value(2660.0));
		mvc.perform(post("/api/ghg/inventories/" + equity + "/runs").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"label": "Run 001"}"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.run.totalKgCo2e").value(1064.0));

		// the physical fact remains 1000 L in both cases
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/activities").with(asMember()))
			.andExpect(jsonPath("$[0].quantity").value(1000.0));
	}

	// --- unit conversion (spec 005) ------------------------------------------

	@Test
	void everySeededFactorUnitIsAConvertibleUnit() {
		assertThat(emissionFactors.findAllByOrderByScopeAscNameAsc()).allSatisfy(factor -> assertThat(
				unitConverter.dimensionOf(factor.getUnit()))
			.as("factor '%s' unit '%s' must be a registered unit", factor.getName(), factor.getUnit())
			.isPresent());
	}

	@Test
	void anActivityIsConvertedIntoTheFactorsUnitBeforeCalculating() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var facilityId = createFacility(orgId, "Tema Plant");
		// diesel metered in US gallons; the seeded Diesel factor is per litre
		var activityId = createActivity(orgId, facilityId, "Diesel consumption", "10000", "US-gallon", "2025-03-15");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, facilityId, "100", true, true);
		classify(syncAndGetAssignmentId(inventoryId, activityId), DIESEL_FACTOR);

		// 10,000 US-gal x 3.785411784 = 37,854.11784 L x 2.66 x 100% = 100,691.953 kg (HALF_UP)
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/runs").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"label": "Run 001"}"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.run.totalKgCo2e").value(100691.953))
			// the line snapshots both the original fact and the converted quantity
			.andExpect(jsonPath("$.lines[0].unit").value("US-gallon"))
			.andExpect(jsonPath("$.lines[0].quantity").value(10000.0))
			.andExpect(jsonPath("$.lines[0].factorUnit").value("litre"))
			.andExpect(jsonPath("$.lines[0].convertedQuantity").value(37854.11784));
	}

	@Test
	void crossDimensionUnitsCannotBeReconciledAndBlockTheRun() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var facilityId = createFacility(orgId, "Tema Plant");
		// diesel recorded in kg (mass) against a per-litre (volume) factor — no conversion
		var activityId = createActivity(orgId, facilityId, "Diesel consumption", "800", "kg", "2025-03-15");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, facilityId, "100", true, true);
		classify(syncAndGetAssignmentId(inventoryId, activityId), DIESEL_FACTOR);

		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.ready").value(false))
			.andExpect(jsonPath("$.gates[3].status").value("BLOCKED"));
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/runs").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"label": "Run 001"}"""))
			.andExpect(status().isConflict());
	}

	// --- spec 004: tenant isolation (AUTH-01) --------------------------------

	@Test
	void organizationsAreInvisibleToNonOwners() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var facilityId = createFacility(orgId, "Tema Plant");
		var activityId = createActivity(orgId, facilityId, "Diesel consumption", "1000", "litre", "2025-03-15");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, facilityId, "100", true, true);
		classify(syncAndGetAssignmentId(inventoryId, activityId), DIESEL_FACTOR);
		var runResult = mvc
			.perform(post("/api/ghg/inventories/" + inventoryId + "/runs").with(asMember()).with(csrf())
				.contentType("application/json").content("""
						{"label": "Run 001"}"""))
			.andExpect(status().isCreated())
			.andReturn();
		String runId = JsonPath.read(runResult.getResponse().getContentAsString(), "$.run.id");

		// an unrelated member sees nothing and can touch nothing — always 404, never 403
		mvc.perform(get("/api/ghg/organizations").with(asOutsider()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.length()").value(0));
		mvc.perform(get("/api/ghg/organizations/" + orgId).with(asOutsider())).andExpect(status().isNotFound());
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/activities").with(asOutsider()))
			.andExpect(status().isNotFound());
		mvc.perform(get("/api/ghg/inventories/" + inventoryId).with(asOutsider())).andExpect(status().isNotFound());
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/runs").with(asOutsider()).with(csrf())
			.contentType("application/json").content("""
					{"label": "Stranger run"}"""))
			.andExpect(status().isNotFound());
		mvc.perform(delete("/api/ghg/runs/" + runId).with(asOutsider()).with(csrf()))
			.andExpect(status().isNotFound());

		// platform admins retain oversight
		mvc.perform(get("/api/ghg/organizations/" + orgId).with(asAdmin())).andExpect(status().isOk());
		mvc.perform(get("/api/ghg/runs/" + runId).with(asAdmin())).andExpect(status().isOk());
	}

	// --- audit-trail guards (TRACE-01/02) ------------------------------------

	@Test
	void factsAndFacilitiesReferencedByHistoryCannotBeDeleted() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var facilityId = createFacility(orgId, "Tema Plant");
		var activityId = createActivity(orgId, facilityId, "Diesel consumption", "1000", "litre", "2025-03-15");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, facilityId, "100", true, true);
		classify(syncAndGetAssignmentId(inventoryId, activityId), DIESEL_FACTOR);
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/runs").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"label": "Run 001"}"""))
			.andExpect(status().isCreated());

		mvc.perform(delete("/api/ghg/activities/" + activityId).with(asMember()).with(csrf()))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.title").value("Operation not allowed"));
		mvc.perform(delete("/api/ghg/facilities/" + facilityId).with(asMember()).with(csrf()))
			.andExpect(status().isConflict());
	}

	// --- fact correction (CORRECT-01) ----------------------------------------

	@Test
	void factsAreCorrectedInPlaceWithoutRewritingRuns() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var facilityId = createFacility(orgId, "Tema Plant");
		var activityId = createActivity(orgId, facilityId, "Diesel consumption", "1000", "litre", "2025-03-15");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, facilityId, "100", true, true);
		classify(syncAndGetAssignmentId(inventoryId, activityId), DIESEL_FACTOR);
		var runResult = mvc
			.perform(post("/api/ghg/inventories/" + inventoryId + "/runs").with(asMember()).with(csrf())
				.contentType("application/json").content("""
						{"label": "Run 001"}"""))
			.andExpect(status().isCreated())
			.andReturn();
		String runId = JsonPath.read(runResult.getResponse().getContentAsString(), "$.run.id");

		mvc.perform(put("/api/ghg/activities/" + activityId).with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"facilityId": "%s", "activityType": "Diesel consumption", "quantity": 1200,
					 "unit": "litre", "activityDate": "2025-03-15", "evidenceRef": "INV-2938-corrected",
					 "dataQuality": "MEASURED"}""".formatted(facilityId)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.quantity").value(1200.0))
			.andExpect(jsonPath("$.evidenceRef").value("INV-2938-corrected"));

		// the past run is a snapshot: still the original 1000 L x 2.66
		mvc.perform(get("/api/ghg/runs/" + runId).with(asMember()))
			.andExpect(jsonPath("$.run.totalKgCo2e").value(2660.0));
	}

	// --- stale exclusions (RECON-01) -----------------------------------------

	@Test
	void reviewReinstatesAutoExclusionsWhoseReasonNoLongerHolds() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var facilityId = createFacility(orgId, "Tema Plant");
		var activityId = createActivity(orgId, facilityId, "Diesel consumption", "900", "litre", "2024-11-20");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, facilityId, "100", true, true);
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/assignments/sync").with(asMember()).with(csrf()))
			.andExpect(jsonPath("$.created").value(1));

		// widen the period so the 2024 fact is now covered; the stale exclusion is flagged...
		mvc.perform(put("/api/ghg/inventories/" + inventoryId).with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"name": "2025 Corporate", "periodStart": "2024-01-01", "periodEnd": "2025-12-31",
					 "consolidationApproach": "OPERATIONAL_CONTROL"}"""))
			.andExpect(status().isOk());
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.gates[1].status").value("WARNINGS"));

		// ...and re-running review reinstates it
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/assignments/sync").with(asMember()).with(csrf()))
			.andExpect(jsonPath("$.updated").value(1));
		var listing = mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember()))
			.andReturn()
			.getResponse()
			.getContentAsString();
		assertThat(JsonPath.<java.util.List<Boolean>>read(listing,
				"$[?(@.activityId == '" + activityId + "')].included").getFirst()).isTrue();
	}

	// --- date plausibility (PLAUS-01) ----------------------------------------

	@Test
	void futureDatedFactsAreRejected() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var facilityId = createFacility(orgId, "Tema Plant");
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/activities").with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"facilityId": "%s", "activityType": "Time travel diesel", "quantity": 10,
					 "unit": "litre", "activityDate": "2091-01-01", "dataQuality": "MEASURED"}"""
				.formatted(facilityId)))
			.andExpect(status().is(422))
			.andExpect(jsonPath("$.errors.activityDate").exists());
	}
}
