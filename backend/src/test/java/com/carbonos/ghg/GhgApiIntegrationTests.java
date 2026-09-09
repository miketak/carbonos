package com.carbonos.ghg;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
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
import com.carbonos.ghg.internal.BaseYearRepository;
import com.carbonos.ghg.internal.BoundaryTreatmentRepository;
import com.carbonos.ghg.internal.BoundaryVersionRepository;
import com.carbonos.ghg.internal.EmissionFactorRepository;
import com.carbonos.ghg.internal.FacilityRepository;
import com.carbonos.ghg.internal.GhgRunRepository;
import com.carbonos.ghg.internal.InventoryAssignmentRepository;
import com.carbonos.ghg.internal.InventoryRepository;
import com.carbonos.ghg.internal.LegalEntityRepository;
import com.carbonos.ghg.internal.MarketFactorRepository;
import com.carbonos.ghg.internal.OrganizationRepository;
import com.carbonos.ghg.internal.UnitConverter;
import com.carbonos.user.AuthenticatedUser;
import com.jayway.jsonpath.JsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class GhgApiIntegrationTests {

	// the seeded Diesel factor: scope 1 by default, scope-agnostic, litre, 2.66 kgCO2e/litre
	private static final String DIESEL_FACTOR = "c4a1f001-0000-4000-8000-000000000003";
	// the seeded Ghana grid electricity factor: scope 2, inherent, kWh, 0.441 kgCO2e/kWh
	private static final String GRID_FACTOR = "c4a1f001-0000-4000-8000-000000000006";
	// waste to landfill: scope 3, tonne, 446.2 = 12.2 CO2 + 15.5 CH4 x 28
	private static final String LANDFILL_FACTOR = "c4a1f001-0000-4000-8000-000000000012";
	// ANFO explosives: scope 1 process emission, tonne, 170
	private static final String ANFO_FACTOR = "c4a1f001-0000-4000-8000-000000000014";
	// wood pellets: biomass, tonne, 14.99 CO2e from CH4 and N2O plus 1800 biogenic CO2
	private static final String BIOMASS_FACTOR = "c4a1f001-0000-4000-8000-000000000016";
	// refrigerant R-410A: an HFC blend, 50% HFC-32 and 50% HFC-125 by mass: 1,923.5 kg CO2e/kg under AR5, 2,255.5 under AR6
	private static final String R410A_FACTOR = "c4a1f001-0000-4000-8000-000000000005";
	// district cooling: scope 2, kWh, 0.12
	private static final String COOLING_FACTOR = "c4a1f001-0000-4000-8000-000000000017";

	@Autowired
	MockMvc mvc;

	@Autowired
	GhgRunRepository runs;

	@Autowired
	InventoryAssignmentRepository assignments;

	@Autowired
	BoundaryTreatmentRepository boundaryTreatments;

	@Autowired
	BoundaryVersionRepository boundaryVersions;

	@Autowired
	MarketFactorRepository marketFactors;

	@Autowired
	BaseYearRepository baseYears;

	@Autowired
	InventoryRepository inventories;

	@Autowired
	ActivityRecordRepository activities;

	@Autowired
	FacilityRepository facilities;

	@Autowired
	LegalEntityRepository entities;

	@Autowired
	OrganizationRepository organizations;

	@Autowired
	EmissionFactorRepository emissionFactors;

	@Autowired
	UnitConverter unitConverter;

	@Autowired
	com.carbonos.user.internal.UserService userService;

	@BeforeEach
	void resetGhgData() {
		baseYears.deleteAll();
		runs.deleteAll();
		assignments.deleteAll();
		marketFactors.deleteAll();
		boundaryTreatments.deleteAll();
		boundaryVersions.deleteAll();
		inventories.deleteAll();
		activities.deleteAll();
		facilities.deleteAll();
		entities.deleteAll();
		organizations.deleteAll();
	}

	// spec 01: data is tenant-scoped, so every call in a test acts as one stable owner
	private final UUID ownerId = UUID.randomUUID();

	RequestPostProcessor asMember() {
		return user(new AuthenticatedUser(ownerId, "kojo@ecoriv.com", "irrelevant", "MEMBER", true));
	}

	/** A real platform account, so membership by email can resolve it (spec 01.2). */
	RequestPostProcessor as(com.carbonos.user.internal.User account) {
		return user(new AuthenticatedUser(account.getId(), account.getEmail(), "irrelevant", "MEMBER", true));
	}

	RequestPostProcessor asOutsider() {
		return user(new AuthenticatedUser(UUID.randomUUID(), "efua@ecoriv.com", "irrelevant", "MEMBER", true));
	}

	RequestPostProcessor asAdmin() {
		return user(new AuthenticatedUser(UUID.randomUUID(), "ama@ecoriv.com", "irrelevant", "ADMIN", true));
	}

	// --- helpers ------------------------------------------------------------

	String body(org.springframework.test.web.servlet.ResultActions actions) throws Exception {
		return actions.andReturn().getResponse().getContentAsString();
	}

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

	String createEntity(String orgId, String name, String relationship, String interest, boolean operated)
			throws Exception {
		var result = mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/entities").with(asMember()).with(csrf())
				.contentType("application/json")
				.content("""
						{"name": "%s", "relationshipType": "%s", "economicInterestPercent": %s,
						 "legalOwnershipPercent": %s, "operatedByCompany": %s}"""
					.formatted(name, relationship, interest, interest, operated)))
			.andExpect(status().isCreated())
			.andReturn();
		return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
	}

	/** A facility of the reporting company itself. */
	String createFacility(String orgId, String name) throws Exception {
		return createFacility(orgId, name, null);
	}

	String createFacility(String orgId, String name, String entityId) throws Exception {
		var entity = entityId == null ? "null" : "\"" + entityId + "\"";
		var result = mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/facilities").with(asMember()).with(csrf())
				.contentType("application/json")
				.content("""
						{"name": "%s", "location": "Tema, Ghana", "entityId": %s}""".formatted(name, entity)))
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
						 "periodStart": "%s", "periodEnd": "%s", "dataSource": "Fuel invoice",
						 "evidenceRef": "INV-2938", "dataQuality": "MEASURED"}"""
					.formatted(facilityId, type, quantity, unit, date, date)))
			.andExpect(status().isCreated())
			.andReturn();
		return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
	}

	String createInventory(String orgId, String name, String approach) throws Exception {
		return createInventory(orgId, name, approach, "2025-01-01", "2025-12-31");
	}

	String createInventory(String orgId, String name, String approach, String start, String end) throws Exception {
		var result = mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/inventories").with(asMember()).with(csrf())
				.contentType("application/json")
				.content("""
						{"name": "%s", "periodStart": "%s", "periodEnd": "%s",
						 "purpose": "Corporate reporting", "consolidationApproach": "%s"}"""
					.formatted(name, start, end, approach)))
			.andExpect(status().isCreated())
			.andReturn();
		return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
	}

	/** Ticks a facility into the boundary; its entity's treatment prefills from the entity's facts. */
	void putBoundary(String inventoryId, String facilityId) throws Exception {
		putBoundary(inventoryId, facilityId, "{}");
	}

	void putBoundary(String inventoryId, String facilityId, String json) throws Exception {
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/boundary/" + facilityId).with(asMember())
			.with(csrf())
			.contentType("application/json")
			.content(json)).andExpect(status().isOk());
	}

	/** Records why a facility is left out of the boundary (spec 07.2). */
	void excludeFacility(String inventoryId, String facilityId, String reason, String detail) throws Exception {
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/boundary/" + facilityId + "/exclude").with(asMember())
			.with(csrf())
			.contentType("application/json")
			.content("""
					{"reason": "%s", "detail": "%s"}""".formatted(reason, detail))).andExpect(status().isOk());
	}

	void freeze(String inventoryId) throws Exception {
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/freeze").with(asMember()).with(csrf()))
			.andExpect(status().isOk());
	}

	void reopen(String inventoryId) throws Exception {
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/reopen").with(asMember()).with(csrf()))
			.andExpect(status().isOk());
	}

	String syncAndGetAssignmentId(String inventoryId, String activityId) throws Exception {
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/assignments/sync").with(asMember()).with(csrf()))
			.andExpect(status().isOk());
		var listing = body(mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember()))
			.andExpect(status().isOk()));
		List<String> ids = JsonPath.read(listing, "$[?(@.activityId == '" + activityId + "')].id");
		return ids.getFirst();
	}

	/** Classifies with the factor's default scope and category. */
	void classify(String assignmentId, String factorId) throws Exception {
		mvc.perform(put("/api/ghg/assignments/" + assignmentId + "/classify").with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"emissionFactorId": "%s"}""".formatted(factorId))).andExpect(status().isOk());
	}

	org.springframework.test.web.servlet.ResultActions classifyAs(String assignmentId, String factorId, String scope,
			String category) throws Exception {
		return mvc.perform(put("/api/ghg/assignments/" + assignmentId + "/classify").with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"emissionFactorId": "%s", "scope": "%s", "category": "%s"}"""
				.formatted(factorId, scope, category)));
	}

	/** Reviews, classifies one record with the factor's defaults, and freezes: the inventory is ready to run. */
	void prepare(String inventoryId, String activityId, String factorId) throws Exception {
		classify(syncAndGetAssignmentId(inventoryId, activityId), factorId);
		freeze(inventoryId);
	}

	/** An entity's accounting share from a boundary listing; JsonPath yields Integer for 1 and Double otherwise. */
	static double share(String boundary, String entityName) {
		return JsonPath.<List<Number>>read(boundary, "$[?(@.entityName == '" + entityName + "')].accountingShare")
			.getFirst()
			.doubleValue();
	}

	org.springframework.test.web.servlet.ResultActions run(String inventoryId, String label) throws Exception {
		return mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/runs").with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"label": "%s"}""".formatted(label)));
	}

	String runAndGetId(String inventoryId, String label) throws Exception {
		return JsonPath.read(body(run(inventoryId, label).andExpect(status().isCreated())), "$.run.id");
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

	// --- legal entities (spec 03.1) -------------------------------------------

	@Test
	void anOrganizationOwnsItsReportingCompanyEntityAndFacilitiesDefaultToIt() throws Exception {
		var orgId = createOrganization("Sankofa Gold plc");
		var facilityId = createFacility(orgId, "Obuasi Ridge Open Pit");

		mvc.perform(get("/api/ghg/organizations/" + orgId + "/entities").with(asMember()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.length()").value(1))
			.andExpect(jsonPath("$[0].name").value("Sankofa Gold plc"))
			.andExpect(jsonPath("$[0].reportingCompany").value(true))
			.andExpect(jsonPath("$[0].relationshipType").value("SUBSIDIARY"))
			.andExpect(jsonPath("$[0].financialControlShare").value(1));
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/facilities").with(asMember()))
			.andExpect(jsonPath("$[0].id").value(facilityId))
			.andExpect(jsonPath("$[0].entityName").value("Sankofa Gold plc"));

		// the reporting company cannot be deleted; an entity with facilities cannot either
		var listing = body(mvc.perform(get("/api/ghg/organizations/" + orgId + "/entities").with(asMember())));
		String ownId = JsonPath.read(listing, "$[0].id");
		mvc.perform(delete("/api/ghg/entities/" + ownId).with(asMember()).with(csrf()))
			.andExpect(status().isConflict());
		var jv = createEntity(orgId, "Tarkwa Gold JV Ltd", "JOINT_VENTURE", "40", true);
		createFacility(orgId, "Tarkwa Processing Plant", jv);
		mvc.perform(delete("/api/ghg/entities/" + jv).with(asMember()).with(csrf()))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("still has facilities")));
	}

	@Test
	void retiredRelationshipNamesAreRefusedWithTheReplacementNamed() throws Exception {
		var orgId = createOrganization("Sankofa Gold plc");
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/entities").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"name": "Old style", "relationshipType": "WHOLLY_OWNED", "economicInterestPercent": 100,
					 "operatedByCompany": true}"""))
			.andExpect(status().is(422))
			.andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("renamed SUBSIDIARY")));
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/entities").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"name": "Old style", "relationshipType": "NON_INCORPORATED_JV", "economicInterestPercent": 40,
					 "operatedByCompany": true}"""))
			.andExpect(status().is(422))
			.andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("JOINT_VENTURE")));
		// control is a fact for franchises only; Table 1 settles it for every other row
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/entities").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"name": "Tema Associates", "relationshipType": "ASSOCIATE", "economicInterestPercent": 30,
					 "operatedByCompany": false, "controlledByCompany": true}"""))
			.andExpect(status().isConflict());
	}

	@Test
	void aFranchiseIsConsolidatedOnlyWhereTheFranchiserHoldsRightsOrControl() throws Exception {
		var orgId = createOrganization("Sankofa Gold plc");
		var pit = createFacility(orgId, "Obuasi Ridge Open Pit");
		// a franchised retail outlet: no equity rights, no control, not operated
		var outlet = body(mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/entities").with(asMember()).with(csrf())
				.contentType("application/json").content("""
						{"name": "Sankofa Gold Shop Kumasi", "relationshipType": "FRANCHISE",
						 "economicInterestPercent": 0, "operatedByCompany": false, "controlledByCompany": false}"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.equityShare").value(0))
			.andExpect(jsonPath("$.financialControlShare").value(0))
			.andExpect(jsonPath("$.operationalControlShare").value(0)));
		String outletId = JsonPath.read(outlet, "$.id");
		var shop = createFacility(orgId, "Kumasi shop", outletId);
		var shopPower = createActivity(orgId, shop, "Shop electricity", "100", "kWh", "2025-05-01");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, pit);
		putBoundary(inventoryId, shop);
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/boundary").with(asMember()))
			.andExpect(jsonPath("$[?(@.entityName == 'Sankofa Gold Shop Kumasi')].table1Row")
				.value("franchise; operational control: 0% (not the operator)"));
		// review treats it as any zero-share entity: outside the boundary under the approach
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/assignments/sync").with(asMember()).with(csrf()))
			.andExpect(status().isOk());
		var listing = body(mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember())));
		assertThat(JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + shopPower + "')].exclusionReason")
			.getFirst()).isEqualTo("OUTSIDE_BOUNDARY");
		// a franchise the company financially controls is a 100% operation under financial control
		mvc.perform(put("/api/ghg/entities/" + outletId).with(asMember()).with(csrf()).contentType("application/json")
			.content("""
					{"name": "Sankofa Gold Shop Kumasi", "relationshipType": "FRANCHISE",
					 "economicInterestPercent": 20, "operatedByCompany": false, "controlledByCompany": true}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.equityShare").value(0.2))
			.andExpect(jsonPath("$.financialControlShare").value(1))
			.andExpect(jsonPath("$.operationalControlShare").value(0));
	}

	/** The Standard's Holland Industries example: a 50% venture held by an 83% subsidiary. */
	@Test
	void anEntityHeldThroughAParentCarriesTheParentsShareAtEveryLevel() throws Exception {
		var orgId = createOrganization("Holland Industries");
		var hollandAmerica = createEntity(orgId, "Holland America", "SUBSIDIARY", "83", true);
		var bgb = body(mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/entities").with(asMember()).with(csrf())
				.contentType("application/json").content("""
						{"name": "BGB", "relationshipType": "JOINT_VENTURE", "economicInterestPercent": 50,
						 "operatedByCompany": false, "parentEntityId": "%s"}""".formatted(hollandAmerica)))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.parentEntityId").value(hollandAmerica))
			.andExpect(jsonPath("$.effectiveEconomicInterestPercent").value(41.5))
			.andExpect(jsonPath("$.chain[0]").value("Holland America"))
			.andExpect(jsonPath("$.equityShare").value(0.415))
			.andExpect(jsonPath("$.financialControlShare").value(0.5))
			.andExpect(jsonPath("$.operationalControlShare").value(0)));
		String bgbId = JsonPath.read(bgb, "$.id");
		// a chain cannot loop, and a parent cannot be deleted while it holds other entities
		mvc.perform(put("/api/ghg/entities/" + hollandAmerica).with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"name": "Holland America", "relationshipType": "SUBSIDIARY", "economicInterestPercent": 83,
					 "operatedByCompany": true, "parentEntityId": "%s"}""".formatted(bgbId)))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("cannot loop")));
		mvc.perform(delete("/api/ghg/entities/" + hollandAmerica).with(asMember()).with(csrf()))
			.andExpect(status().isConflict());
		// the boundary shows the chain and the effective interest, and the version copies both
		var plant = createFacility(orgId, "BGB plant", bgbId);
		var diesel = createActivity(orgId, plant, "Plant diesel", "1000", "litre", "2025-03-15");
		var equity = createInventory(orgId, "2025 Equity", "EQUITY_SHARE");
		putBoundary(equity, plant);
		var boundary = body(mvc.perform(get("/api/ghg/inventories/" + equity + "/boundary").with(asMember())));
		assertThat(share(boundary, "BGB")).isEqualTo(0.415);
		assertThat(JsonPath.<List<String>>read(boundary, "$[?(@.entityName == 'BGB')].table1Row").getFirst())
			.endsWith("; held through Holland America");
		assertThat(JsonPath.<List<Double>>read(boundary, "$[?(@.entityName == 'BGB')].effectiveEconomicInterestPercent")
			.getFirst()).isEqualTo(41.5);
		// 1000 L x 2.66 x 41.5% = 1103.9 kg
		prepare(equity, diesel, DIESEL_FACTOR);
		run(equity, "Run 001").andExpect(status().isCreated())
			.andExpect(jsonPath("$.run.totalKgCo2e").value(1103.9))
			.andExpect(jsonPath("$.lines[0].weight").value(0.415));
		var versions = body(mvc.perform(get("/api/ghg/inventories/" + equity + "/boundary/versions").with(asMember())));
		mvc.perform(get("/api/ghg/boundary-versions/" + JsonPath.read(versions, "$[0].id")).with(asMember()))
			.andExpect(jsonPath("$.entries[?(@.entityName == 'BGB')].chain[0]").value("Holland America"))
			.andExpect(jsonPath("$.entries[?(@.entityName == 'BGB')].effectiveEconomicInterestPercent").value(41.5))
			.andExpect(jsonPath("$.entries[?(@.entityName == 'BGB')].accountingShare").value(0.415));
		// under financial control the venture is 50% of the subsidiary's 100%
		var financial = createInventory(orgId, "2025 Financial", "FINANCIAL_CONTROL");
		putBoundary(financial, plant);
		assertThat(share(body(mvc.perform(get("/api/ghg/inventories/" + financial + "/boundary").with(asMember()))),
				"BGB")).isEqualTo(0.5);
	}

	@Test
	void sankofaGroupSharesFollowTable1UnderEveryApproach() throws Exception {
		var orgId = createOrganization("Sankofa Gold plc");
		var pit = createFacility(orgId, "Obuasi Ridge Open Pit");
		var jv = createEntity(orgId, "Tarkwa Gold JV Ltd", "JOINT_VENTURE", "40", true);
		var plant = createFacility(orgId, "Tarkwa Processing Plant", jv);
		var port = createEntity(orgId, "Takoradi Port Co", "ASSOCIATE", "30", false);
		var terminal = createFacility(orgId, "Takoradi Port Loadout", port);

		record Expectation(String approach, double pit, double plant, double terminal) {
		}
		for (var expected : List.of(new Expectation("FINANCIAL_CONTROL", 1, 0.40, 0),
				new Expectation("EQUITY_SHARE", 1, 0.40, 0.30), new Expectation("OPERATIONAL_CONTROL", 1, 1, 0))) {
			var inventoryId = createInventory(orgId, expected.approach() + " view", expected.approach());
			putBoundary(inventoryId, pit);
			putBoundary(inventoryId, plant);
			putBoundary(inventoryId, terminal);
			var boundary = body(mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/boundary").with(asMember()))
				.andExpect(status().isOk()));
			assertThat(share(boundary, "Sankofa Gold plc")).isEqualTo(expected.pit());
			assertThat(share(boundary, "Tarkwa Gold JV Ltd")).isEqualTo(expected.plant());
			assertThat(share(boundary, "Takoradi Port Co")).isEqualTo(expected.terminal());
			// the Table 1 row applied is spelled out for the verifier
			assertThat(JsonPath.<List<String>>read(boundary, "$[?(@.entityName == 'Tarkwa Gold JV Ltd')].table1Row")
				.getFirst()).startsWith("joint venture under joint financial control");
			assertThat(JsonPath.<List<String>>read(boundary, "$[?(@.entityName == 'Sankofa Gold plc')].table1Row")
				.getFirst()).startsWith("group company or subsidiary under financial control");
		}
	}

	@Test
	void tickingAFacilityInPrefillsItsEntityTreatmentAndOverridesApplyToTheEntity() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		// Tema JV: a 40% joint venture the company operates, with two sites
		var jv = createEntity(orgId, "Tema JV", "JOINT_VENTURE", "40", true);
		var plant = createFacility(orgId, "Tema Plant", jv);
		var depot = createFacility(orgId, "Tema Depot", jv);
		var equity = createInventory(orgId, "Equity view", "EQUITY_SHARE");
		var operational = createInventory(orgId, "Operational view", "OPERATIONAL_CONTROL");
		var financial = createInventory(orgId, "Financial view", "FINANCIAL_CONTROL");

		// an empty body copies the entity's facts into the treatment
		for (var inventoryId : List.of(equity, operational, financial)) {
			mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/boundary/" + plant).with(asMember()).with(csrf())
				.contentType("application/json").content("{}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.entityName").value("Tema JV"))
				.andExpect(jsonPath("$.relationshipType").value("JOINT_VENTURE"))
				.andExpect(jsonPath("$.economicInterestPercent").value(40.0))
				.andExpect(jsonPath("$.operatedByCompany").value(true))
				// one relationship, held once: the depot is listed under the same entity, not yet included
				.andExpect(jsonPath("$.facilities[?(@.facilityId == '" + depot + "')].inBoundary").value(false));
		}
		// and each approach derives its own share from the same facts, Table 1 style
		mvc.perform(get("/api/ghg/inventories/" + equity + "/boundary").with(asMember()))
			.andExpect(jsonPath("$[?(@.entityName == 'Tema JV')].accountingShare").value(0.40));
		mvc.perform(get("/api/ghg/inventories/" + operational + "/boundary").with(asMember()))
			.andExpect(jsonPath("$[?(@.entityName == 'Tema JV')].accountingShare").value(1));
		mvc.perform(get("/api/ghg/inventories/" + financial + "/boundary").with(asMember()))
			.andExpect(jsonPath("$[?(@.entityName == 'Tema JV')].accountingShare").value(0.40));

		// an explicit value overrides the facts, and a later partial update keeps the rest
		putBoundary(equity, plant, """
				{"economicInterestPercent": 35}""");
		mvc.perform(put("/api/ghg/inventories/" + equity + "/boundary/entities/" + jv).with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"operatedByCompany": false}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.economicInterestPercent").value(35.0))
			.andExpect(jsonPath("$.operatedByCompany").value(false))
			.andExpect(jsonPath("$.accountingShare").value(0.35));

		// adding the entity itself brings every facility of it in; removing the last facility removes the entity
		var whole = createInventory(orgId, "Whole-entity view", "OPERATIONAL_CONTROL");
		mvc.perform(put("/api/ghg/inventories/" + whole + "/boundary/entities/" + jv).with(asMember()).with(csrf())
			.contentType("application/json").content("{}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.facilities[?(@.facilityId == '" + plant + "')].inBoundary").value(true))
			.andExpect(jsonPath("$.facilities[?(@.facilityId == '" + depot + "')].inBoundary").value(true));
		// a version reads back one entry per entity, however many facilities sit beneath it
		var frozen = body(mvc
			.perform(post("/api/ghg/inventories/" + whole + "/freeze").with(asMember()).with(csrf()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.entries.length()").value(1))
			.andExpect(jsonPath("$.entries[0].facilities.length()").value(2)));
		mvc.perform(get("/api/ghg/boundary-versions/" + JsonPath.read(frozen, "$.version.id")).with(asMember()))
			.andExpect(jsonPath("$.entries.length()").value(1))
			.andExpect(jsonPath("$.entries[0].facilities.length()").value(2));
		// an override on an existing treatment leaves the facility subset alone
		mvc.perform(put("/api/ghg/inventories/" + operational + "/boundary/entities/" + jv).with(asMember())
			.with(csrf()).contentType("application/json").content("{}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.facilities[?(@.facilityId == '" + depot + "')].inBoundary").value(false));
		mvc.perform(delete("/api/ghg/inventories/" + financial + "/boundary/" + plant).with(asMember()).with(csrf()))
			.andExpect(status().isNoContent());
		mvc.perform(get("/api/ghg/inventories/" + financial + "/boundary").with(asMember()))
			.andExpect(jsonPath("$[?(@.entityName == 'Tema JV')].inBoundary").value(false));
	}

	@Test
	void editingTheEntityFlagsDriftWithoutTouchingTreatmentsOrVersions() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var jv = createEntity(orgId, "Tema JV", "JOINT_VENTURE", "40", true);
		var plant = createFacility(orgId, "Tema Plant", jv);
		var inventoryId = createInventory(orgId, "Equity view", "EQUITY_SHARE");
		putBoundary(inventoryId, plant);
		freeze(inventoryId);
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.gates[0].status").value("PASSED"));

		// the group buys more of the JV: the fact changes, the frozen decision does not
		mvc.perform(put("/api/ghg/entities/" + jv).with(asMember()).with(csrf()).contentType("application/json")
			.content("""
					{"name": "Tema JV", "relationshipType": "JOINT_VENTURE", "economicInterestPercent": 45,
					 "operatedByCompany": true}"""))
			.andExpect(status().isOk());
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.gates[0].status").value("WARNINGS"))
			.andExpect(jsonPath("$.gates[0].findings[0].message").value(
					"Tema JV's treatment (joint venture, 40%, operated) differs from the entity record "
							+ "(joint venture, 45%, operated). Review the boundary."));
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/boundary").with(asMember()))
			.andExpect(jsonPath("$[?(@.entityName == 'Tema JV')].economicInterestPercent").value(40.0));
		var versions = body(
				mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/boundary/versions").with(asMember())));
		String versionId = JsonPath.read(versions, "$[0].id");
		mvc.perform(get("/api/ghg/boundary-versions/" + versionId).with(asMember()))
			.andExpect(jsonPath("$.entries[0].economicInterestPercent").value(40.0))
			.andExpect(jsonPath("$.entries[0].facilities[0].facilityName").value("Tema Plant"));
	}

	// --- effective-dated membership (spec 03.2) --------------------------------

	@Test
	void aMembershipWindowExcludesRecordsOutsideItAndIsRecordedInTheVersion() throws Exception {
		var orgId = createOrganization("Sankofa Gold plc");
		var pit = createFacility(orgId, "Obuasi Ridge Open Pit");
		var port = createEntity(orgId, "Takoradi Port Co", "SUBSIDIARY", "100", true);
		var terminal = createFacility(orgId, "Takoradi Port Loadout", port);
		var january = createActivity(orgId, terminal, "Shiploader diesel", "1000", "litre", "2025-01-20");
		var september = createActivity(orgId, terminal, "Shiploader diesel", "1000", "litre", "2025-09-30");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, pit);
		// Takoradi was acquired on 1 July: a member from that date
		putBoundary(inventoryId, terminal, """
				{"effectiveFrom": "2025-07-01"}""");

		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/assignments/sync").with(asMember()).with(csrf()))
			.andExpect(status().isOk());
		var listing = body(mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember())));
		assertThat(JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + january + "')].exclusionReason")
			.getFirst()).isEqualTo("OUTSIDE_BOUNDARY");
		assertThat(JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + january + "')].exclusionDetail")
			.getFirst()).isEqualTo("Takoradi Port Co: member from 2025-07-01");
		assertThat(JsonPath.<List<Boolean>>read(listing, "$[?(@.activityId == '" + september + "')].included")
			.getFirst()).isTrue();

		// the gate says a partial-year membership out loud
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.gates[0].findings[?(@.severity == 'WARNING')].message")
				.value(org.hamcrest.Matchers.hasItem(org.hamcrest.Matchers
					.containsString("Takoradi Port Co is a member from 2025-07-01: a partial-period membership"))));

		// the run is at the full share for the September record, and the version carries the window
		classify(JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + september + "')].id").getFirst(),
				DIESEL_FACTOR);
		freeze(inventoryId);
		run(inventoryId, "Run 001").andExpect(status().isCreated())
			.andExpect(jsonPath("$.run.totalKgCo2e").value(2660.0))
			.andExpect(jsonPath("$.exclusions[0].exclusionDetail").value("Takoradi Port Co: member from 2025-07-01"));
		var versions = body(
				mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/boundary/versions").with(asMember())));
		mvc.perform(get("/api/ghg/boundary-versions/" + JsonPath.read(versions, "$[0].id")).with(asMember()))
			.andExpect(jsonPath("$.entries[?(@.entityName == 'Takoradi Port Co')].effectiveFrom")
				.value("2025-07-01"));

		// moving the window earlier and re-reviewing reconciles the January record
		reopen(inventoryId);
		putBoundary(inventoryId, terminal, """
				{"effectiveFrom": "2025-01-01"}""");
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.gates[1].status").value("WARNINGS"));
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/assignments/sync").with(asMember()).with(csrf()))
			.andExpect(jsonPath("$.updated").value(1));
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
		putBoundary(inventoryId, inPlant);
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/assignments/sync").with(asMember()).with(csrf()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.created").value(3));

		var listing = body(mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember()))
			.andExpect(status().isOk()));
		assertThat(JsonPath.<List<Boolean>>read(listing, "$[?(@.activityId == '" + inActivity + "')].included")
			.getFirst()).isTrue();
		assertThat(JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + lateActivity + "')].exclusionReason")
			.getFirst()).isEqualTo("OUTSIDE_PERIOD");
		assertThat(JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + strayActivity + "')].exclusionReason")
			.getFirst()).isEqualTo("OUTSIDE_BOUNDARY");
		assertThat(JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + strayActivity + "')].exclusionDetail")
			.getFirst()).isEqualTo("facility not in the boundary");

		// re-including and excluding by hand for the same reason keeps the detail
		String late = JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + lateActivity + "')].id").getFirst();
		mvc.perform(put("/api/ghg/assignments/" + late + "/include").with(asMember()).with(csrf()))
			.andExpect(status().isOk());
		mvc.perform(put("/api/ghg/assignments/" + late + "/exclude").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"reason": "OUTSIDE_PERIOD"}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.exclusionDetail").value("reporting period 2025-01-01 to 2025-12-31"));
	}

	// --- scope as an accounting decision (spec 04.1) -----------------------------

	@Test
	void theSameFactorLandsInScope1OrScope3ByTheAccountantsChoice() throws Exception {
		var orgId = createOrganization("Sankofa Gold plc");
		var pit = createFacility(orgId, "Obuasi Ridge Open Pit");
		var ownFleet = createActivity(orgId, pit, "Haul fleet diesel", "1000", "litre", "2025-06-30");
		var contractor = createActivity(orgId, pit, "Contractor mining fleet diesel", "2000", "litre", "2025-06-30");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, pit);
		var own = syncAndGetAssignmentId(inventoryId, ownFleet);
		var listing = body(mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember())));
		String hired = JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + contractor + "')].id").getFirst();

		// defaults: Diesel suggests scope 1 mobile combustion
		classify(own, DIESEL_FACTOR);
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember()))
			.andExpect(jsonPath("$[?(@.id == '" + own + "')].scope").value("SCOPE_1"))
			.andExpect(jsonPath("$[?(@.id == '" + own + "')].category").value("MOBILE_COMBUSTION"));
		// the contractor's diesel is the same physics in scope 3
		classifyAs(hired, DIESEL_FACTOR, "SCOPE_3", "PURCHASED_GOODS_SERVICES").andExpect(status().isOk())
			.andExpect(jsonPath("$.scope").value("SCOPE_3"))
			.andExpect(jsonPath("$.category").value("PURCHASED_GOODS_SERVICES"));
		// a category from the wrong scope is refused outright
		classifyAs(hired, DIESEL_FACTOR, "SCOPE_3", "MOBILE_COMBUSTION").andExpect(status().isConflict());
		// spec 04.3: the departure from the factor's default blocks until a reason is recorded, then it is silent
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.gates[2].status").value("BLOCKED"))
			.andExpect(jsonPath("$.gates[2].findings[0].message")
				.value(org.hamcrest.Matchers.containsString("'Diesel (100% mineral diesel)' defaults to scope 1. Record why")));
		mvc.perform(put("/api/ghg/assignments/" + hired + "/classify").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"emissionFactorId": "%s", "scope": "SCOPE_3", "category": "PURCHASED_GOODS_SERVICES",
					 "scopeJustification": "Contractor-owned and operated fleet; the company does not direct its operation"}"""
				.formatted(DIESEL_FACTOR)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.scopeJustification").value(org.hamcrest.Matchers.startsWith("Contractor-owned")));
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			// the scope 3 line warns that its category is not declared as covered (spec 07.6); nothing blocks
			.andExpect(jsonPath("$.gates[2].status").value("WARNINGS"))
			.andExpect(jsonPath("$.gates[2].findings[?(@.severity == 'ERROR')]").isEmpty())
			.andExpect(jsonPath("$.gates[2].findings[*].message")
				.value(org.hamcrest.Matchers.hasItem(org.hamcrest.Matchers.containsString("does not list it as covered"))));

		freeze(inventoryId);
		run(inventoryId, "Run 001").andExpect(status().isCreated())
			.andExpect(jsonPath("$.run.scope1KgCo2e").value(2660.0))
			.andExpect(jsonPath("$.run.scope3KgCo2e").value(5320.0))
			.andExpect(jsonPath("$.run.totalKgCo2e").value(7980.0));
	}

	@Test
	void aFactorInAnotherScopeThanItsDefaultNeedsAJustification() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var plant = createFacility(orgId, "Tema Plant");
		var activityId = createActivity(orgId, plant, "Electricity", "1000", "kWh", "2025-06-30");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, plant);
		var assignmentId = syncAndGetAssignmentId(inventoryId, activityId);

		// spec 04.3: no scope is inherent; a departure without a reason blocks the run
		classifyAs(assignmentId, GRID_FACTOR, "SCOPE_1", "STATIONARY_COMBUSTION").andExpect(status().isOk());
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.gates[2].status").value("BLOCKED"))
			.andExpect(jsonPath("$.gates[2].findings[0].message")
				.value(org.hamcrest.Matchers.containsString("'Grid electricity (Ghana, Ecoriv 2025)' defaults to scope 2")));
	}

	/** Audit findings F10, F26, F27, F30 (T-11): the stream register, the scope choice and proxy factors. */
	@Test
	void aStreamDrivesTheDefaultScopeAndAnyDepartureNeedsAJustification() throws Exception {
		var orgId = createOrganization("Asante Gold Resources");
		var pit = createFacility(orgId, "Obuom Pit");
		// the register: an owned genset stream, a contractor-operated fleet, the company's own landfill
		var gensets = body(mvc
			.perform(post("/api/ghg/facilities/" + pit + "/streams").with(asMember()).with(csrf())
				.contentType("application/json").content("""
						{"name": "Standby gensets", "kind": "STATIONARY_COMBUSTION", "fuel": "Diesel",
						 "meterOrSupplier": "Bulk tank dip", "contractorOperated": false}"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.defaultScope").value("SCOPE_1"))
			.andExpect(jsonPath("$.defaultCategory").value("STATIONARY_COMBUSTION")));
		String gensetsId = JsonPath.read(gensets, "$.id");
		var fleet = body(mvc
			.perform(post("/api/ghg/facilities/" + pit + "/streams").with(asMember()).with(csrf())
				.contentType("application/json").content("""
						{"name": "Contract mining fleet", "kind": "MOBILE_COMBUSTION", "fuel": "Diesel",
						 "meterOrSupplier": "Rocksure dispensing log", "contractorOperated": true}"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.defaultScope").value("SCOPE_3"))
			.andExpect(jsonPath("$.defaultCategory").value("UPSTREAM_TRANSPORT")));
		String fleetId = JsonPath.read(fleet, "$.id");
		var landfill = body(mvc
			.perform(post("/api/ghg/facilities/" + pit + "/streams").with(asMember()).with(csrf())
				.contentType("application/json").content("""
						{"name": "Camp landfill", "kind": "WASTE", "contractorOperated": false}"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.defaultScope").value("SCOPE_3"))
			.andExpect(jsonPath("$.allowedCategories").value(org.hamcrest.Matchers.hasItem("FUGITIVE_EMISSIONS"))));
		String landfillId = JsonPath.read(landfill, "$.id");
		// a duplicate name at the facility is refused; a stream of another facility cannot be named by a record
		mvc.perform(post("/api/ghg/facilities/" + pit + "/streams").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"name": "standby gensets", "kind": "STATIONARY_COMBUSTION", "contractorOperated": false}"""))
			.andExpect(status().isConflict());
		var otherSite = createFacility(orgId, "Nkran Camp");
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/activities").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"facilityId": "%s", "streamId": "%s", "activityType": "Genset diesel", "quantity": 100,
					 "unit": "litre", "periodStart": "2025-06-30", "periodEnd": "2025-06-30", "dataQuality": "MEASURED"}"""
				.formatted(otherSite, gensetsId)))
			.andExpect(status().isConflict());
		// records name their stream
		String gensetDiesel = JsonPath.read(body(mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/activities").with(asMember()).with(csrf())
				.contentType("application/json").content("""
						{"facilityId": "%s", "streamId": "%s", "activityType": "Genset diesel, June", "quantity": 1000,
						 "unit": "litre", "periodStart": "2025-06-01", "periodEnd": "2025-06-30", "evidenceRef": "TANK-6",
						 "dataQuality": "MEASURED"}""".formatted(pit, gensetsId)))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.streamName").value("Standby gensets"))), "$.id");
		String fleetDiesel = JsonPath.read(body(mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/activities").with(asMember()).with(csrf())
				.contentType("application/json").content("""
						{"facilityId": "%s", "streamId": "%s", "activityType": "Rocksure fleet diesel, June",
						 "quantity": 2000, "unit": "litre", "periodStart": "2025-06-01", "periodEnd": "2025-06-30",
						 "evidenceRef": "RS-06", "dataQuality": "MEASURED"}""".formatted(pit, fleetId)))
			.andExpect(status().isCreated())), "$.id");
		String waste = JsonPath.read(body(mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/activities").with(asMember()).with(csrf())
				.contentType("application/json").content("""
						{"facilityId": "%s", "streamId": "%s", "activityType": "Camp waste landfilled, June",
						 "quantity": 1, "unit": "tonne", "periodStart": "2025-06-01", "periodEnd": "2025-06-30",
						 "evidenceRef": "WB-06", "dataQuality": "MEASURED"}""".formatted(pit, landfillId)))
			.andExpect(status().isCreated())), "$.id");
		var inventoryId = createInventory(orgId, "FY2025", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, pit);
		excludeFacility(inventoryId, otherSite, "NOT_APPLICABLE", "No activity in 2025");
		var gensetAssignment = syncAndGetAssignmentId(inventoryId, gensetDiesel);
		var listing = body(mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember()))
			.andExpect(jsonPath("$[?(@.activityId == '" + fleetDiesel + "')].defaultScope").value("SCOPE_3"))
			.andExpect(jsonPath("$[?(@.activityId == '" + fleetDiesel + "')].contractorOperated").value(true)));
		String fleetAssignment = JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + fleetDiesel + "')].id").getFirst();
		String wasteAssignment = JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + waste + "')].id").getFirst();
		// the factor alone classifies each record in its stream's default: scope 1 for the gensets, scope 3 for the
		// contractor's fleet, with no warning about "suggests scope 1"
		classify(gensetAssignment, DIESEL_FACTOR);
		classify(fleetAssignment, DIESEL_FACTOR);
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember()))
			.andExpect(jsonPath("$[?(@.id == '" + gensetAssignment + "')].scope").value("SCOPE_1"))
			.andExpect(jsonPath("$[?(@.id == '" + gensetAssignment + "')].category").value("STATIONARY_COMBUSTION"))
			.andExpect(jsonPath("$[?(@.id == '" + fleetAssignment + "')].scope").value("SCOPE_3"))
			.andExpect(jsonPath("$[?(@.id == '" + fleetAssignment + "')].category").value("UPSTREAM_TRANSPORT"));
		// a category outside the stream's kind is refused; the landfill factor in scope 1 needs a reason
		classifyAs(wasteAssignment, LANDFILL_FACTOR, "SCOPE_3", "BUSINESS_TRAVEL").andExpect(status().isConflict());
		classifyAs(wasteAssignment, LANDFILL_FACTOR, "SCOPE_1", "FUGITIVE_EMISSIONS").andExpect(status().isOk());
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.gates[2].status").value("BLOCKED"))
			.andExpect(jsonPath("$.gates[2].findings[0].message")
				.value(org.hamcrest.Matchers.containsString("its stream 'Camp landfill' defaults to scope 3")));
		// a proxy factor needs its justification; with both reasons recorded the gate is silent
		mvc.perform(put("/api/ghg/assignments/" + wasteAssignment + "/classify").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"emissionFactorId": "%s", "scope": "SCOPE_1", "category": "FUGITIVE_EMISSIONS",
					 "scopeJustification": "Company-operated landfill on the mining lease: a direct source", "proxy": true}"""
				.formatted(LANDFILL_FACTOR)))
			.andExpect(status().isConflict());
		mvc.perform(put("/api/ghg/assignments/" + wasteAssignment + "/classify").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"emissionFactorId": "%s", "scope": "SCOPE_1", "category": "FUGITIVE_EMISSIONS",
					 "scopeJustification": "Company-operated landfill on the mining lease: a direct source",
					 "proxy": true, "proxyJustification": "DEFRA commercial waste to landfill stands in for an unlined site landfill"}"""
				.formatted(LANDFILL_FACTOR)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.proxy").value(true));
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			// the scope 3 line warns that its category is not declared as covered (spec 07.6); nothing blocks
			.andExpect(jsonPath("$.gates[2].status").value("WARNINGS"))
			.andExpect(jsonPath("$.gates[2].findings[?(@.severity == 'ERROR')]").isEmpty())
			.andExpect(jsonPath("$.gates[2].findings[*].message")
				.value(org.hamcrest.Matchers.hasItem(org.hamcrest.Matchers.containsString("does not list it as covered"))));
		freeze(inventoryId);
		// the lines carry the record's own description, the stream, the reasons and the proxy flag
		var detail = body(run(inventoryId, "Run 001").andExpect(status().isCreated())
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + fleetDiesel + "')].activityType").value("Rocksure fleet diesel, June"))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + fleetDiesel + "')].streamName").value("Contract mining fleet"))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + fleetDiesel + "')].scope").value("SCOPE_3"))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + waste + "')].proxy").value(true))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + waste + "')].scopeJustification")
				.value(org.hamcrest.Matchers.hasItem(org.hamcrest.Matchers.startsWith("Company-operated landfill"))))
			.andExpect(jsonPath("$.run.scope1KgCo2e").value(3106.2))
			.andExpect(jsonPath("$.run.scope3KgCo2e").value(5320.0)));
		mvc.perform(get("/api/ghg/runs/" + JsonPath.read(detail, "$.run.id") + "/report").with(asMember()))
			.andExpect(jsonPath("$.methodology.statement")
				.value(org.hamcrest.Matchers.containsString("1 line uses a proxy factor")));
		// a stream with records cannot be deleted; an empty one can
		mvc.perform(delete("/api/ghg/streams/" + gensetsId).with(asMember()).with(csrf())).andExpect(status().isConflict());
		String empty = JsonPath.read(body(mvc
			.perform(post("/api/ghg/facilities/" + pit + "/streams").with(asMember()).with(csrf())
				.contentType("application/json").content("""
						{"name": "Explosives", "kind": "PROCESS", "contractorOperated": false}"""))
			.andExpect(status().isCreated())), "$.id");
		mvc.perform(delete("/api/ghg/streams/" + empty).with(asMember()).with(csrf())).andExpect(status().isNoContent());
		mvc.perform(get("/api/ghg/facilities/" + pit + "/streams").with(asOutsider())).andExpect(status().isNotFound());
	}

	@Test
	void leasedAssetsTakeTheirScopeFromAppendixFUnderTheInventorysApproach() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var office = createFacility(orgId, "Leased office");
		var activityId = createActivity(orgId, office, "Boiler gas", "100", "m3", "2025-02-01");
		var operational = createInventory(orgId, "Operational view", "OPERATIONAL_CONTROL");
		var equity = createInventory(orgId, "Equity view", "EQUITY_SHARE");
		putBoundary(operational, office);
		putBoundary(equity, office);
		var gas = "c4a1f001-0000-4000-8000-000000000001";

		// an operating lease the company holds: scope 1 under operational control, scope 3 under equity share
		mvc.perform(put("/api/ghg/assignments/" + syncAndGetAssignmentId(operational, activityId) + "/classify")
			.with(asMember()).with(csrf()).contentType("application/json").content("""
					{"emissionFactorId": "%s", "leaseType": "OPERATING_LEASE_IN"}""".formatted(gas)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.scope").value("SCOPE_1"))
			.andExpect(jsonPath("$.leaseType").value("OPERATING_LEASE_IN"));
		mvc.perform(put("/api/ghg/assignments/" + syncAndGetAssignmentId(equity, activityId) + "/classify")
			.with(asMember()).with(csrf()).contentType("application/json").content("""
					{"emissionFactorId": "%s", "leaseType": "OPERATING_LEASE_IN"}""".formatted(gas)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.scope").value("SCOPE_3"))
			.andExpect(jsonPath("$.category").value("UPSTREAM_LEASED_ASSETS"));
		// a lease type derived the scope: no justification is needed and the gate is silent (spec 04.3)
		mvc.perform(get("/api/ghg/inventories/" + equity + "/validation").with(asMember()))
			// the scope 3 line warns that its category is not declared as covered (spec 07.6); nothing blocks
			.andExpect(jsonPath("$.gates[2].status").value("WARNINGS"))
			.andExpect(jsonPath("$.gates[2].findings[?(@.severity == 'ERROR')]").isEmpty())
			.andExpect(jsonPath("$.gates[2].findings[*].message")
				.value(org.hamcrest.Matchers.hasItem(org.hamcrest.Matchers.containsString("does not list it as covered"))));
	}

	@Test
	void anfoExplosivesClassifyAsAProcessEmission() throws Exception {
		var orgId = createOrganization("Sankofa Gold plc");
		var pit = createFacility(orgId, "Obuasi Ridge Open Pit");
		var activityId = createActivity(orgId, pit, "ANFO explosives consumed", "8400", "tonne", "2025-08-31");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, pit);
		var assignmentId = syncAndGetAssignmentId(inventoryId, activityId);

		classify(assignmentId, ANFO_FACTOR);
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember()))
			.andExpect(jsonPath("$[0].scope").value("SCOPE_1"))
			.andExpect(jsonPath("$[0].category").value("PROCESS_EMISSIONS"));
		freeze(inventoryId);
		// 8,400 t x 170 kg/t = 1,428,000 kg
		run(inventoryId, "Run 001").andExpect(status().isCreated())
			.andExpect(jsonPath("$.run.scope1KgCo2e").value(1428000.0))
			.andExpect(jsonPath("$.lines[0].category").value("PROCESS_EMISSIONS"));
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

		putBoundary(inventoryId, facilityId);
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

		// matching factor and a frozen inventory clear every gate
		classify(assignmentId, GRID_FACTOR);
		freeze(inventoryId);
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.ready").value(true))
			.andExpect(jsonPath("$.gates[4].gate").value("BASE_YEAR"));
	}

	@Test
	void runCreationIsRefusedWhileValidationBlocks() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var facilityId = createFacility(orgId, "Tema Plant");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, facilityId);
		createActivity(orgId, facilityId, "Diesel consumption", "100", "litre", "2025-03-15");
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/assignments/sync").with(asMember()).with(csrf()));
		freeze(inventoryId);

		run(inventoryId, "Run 001").andExpect(status().isConflict())
			.andExpect(jsonPath("$.title").value("Validation failing"));
	}

	// --- runs -----------------------------------------------------------------

	@Test
	void runSnapshotsTheViewAndCanBeMarkedFinal() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var associate = createEntity(orgId, "Tema Associates Ltd", "ASSOCIATE", "40", false);
		var facilityId = createFacility(orgId, "Tema Plant", associate);
		var activityId = createActivity(orgId, facilityId, "Diesel consumption", "1000", "litre", "2025-03-15");
		var inventoryId = createInventory(orgId, "2025 Equity View", "EQUITY_SHARE");
		putBoundary(inventoryId, facilityId);
		prepare(inventoryId, activityId, DIESEL_FACTOR);

		// 1000 L x 2.66 kg/L x 40% = 1064 kg
		var result = run(inventoryId, "Run 001").andExpect(status().isCreated())
			.andExpect(jsonPath("$.run.totalKgCo2e").value(1064.0))
			.andExpect(jsonPath("$.run.scope1KgCo2e").value(1064.0))
			.andExpect(jsonPath("$.lines[0].weight").value(0.40))
			.andExpect(jsonPath("$.lines[0].factorName").value("Diesel (100% mineral diesel)"))
			.andReturn();
		String runId = JsonPath.read(result.getResponse().getContentAsString(), "$.run.id");

		mvc.perform(post("/api/ghg/runs/" + runId + "/finalize").with(asMember()).with(csrf()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.finalRunId").value(runId))
			.andExpect(jsonPath("$.status").value("FINAL"));
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/runs").with(asMember()))
			.andExpect(jsonPath("$[0].isFinal").value(true));

		// a final run cannot be voided; withdrawing the designation needs a reason and leaves the run in place
		mvc.perform(post("/api/ghg/runs/" + runId + "/void").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"reason": "Wrong boundary version"}"""))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("Withdraw the designation")));
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/withdraw-final").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"reason": "Boundary v1 omitted the Nkran camp"}"""))
			.andExpect(status().isOk());
		var inventory = inventories.findById(UUID.fromString(inventoryId)).orElseThrow();
		assertThat(inventory.getFinalRunId()).isNull();
		assertThat(inventory.getStatus()).isEqualTo(com.carbonos.ghg.internal.InventoryStatus.FROZEN);
		mvc.perform(get("/api/ghg/runs/" + runId).with(asMember())).andExpect(status().isOk());
	}

	/** Audit finding F35 (T-05): runs are numbered for ever and voided with a reason, never deleted. */
	@Test
	void runsAreNumberedForeverAndVoidedWithAReasonInsteadOfDeleted() throws Exception {
		var orgId = createOrganization("Asante Gold Resources");
		var plant = createFacility(orgId, "Obuom Processing Plant");
		var diesel = createActivity(orgId, plant, "Genset diesel", "1000", "litre", "2025-08-01");
		var inventoryId = createInventory(orgId, "FY2025", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, plant);
		prepare(inventoryId, diesel, DIESEL_FACTOR);
		String first = runAndGetId(inventoryId, "Run 001");
		String second = runAndGetId(inventoryId, "Run 002");
		// hard delete is gone
		mvc.perform(delete("/api/ghg/runs/" + first).with(asMember()).with(csrf()))
			.andExpect(status().isMethodNotAllowed());
		// a void needs a reason
		mvc.perform(post("/api/ghg/runs/" + first + "/void").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"reason": ""}"""))
			.andExpect(status().is(422));
		mvc.perform(post("/api/ghg/runs/" + first + "/void").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"reason": "Boundary v1 omitted the Nkran camp"}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.runNo").value(1))
			.andExpect(jsonPath("$.voided").value(true))
			.andExpect(jsonPath("$.voidedBy").value("kojo@ecoriv.com"))
			.andExpect(jsonPath("$.voidReason").value("Boundary v1 omitted the Nkran camp"));
		mvc.perform(post("/api/ghg/runs/" + first + "/void").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"reason": "Twice over"}"""))
			.andExpect(status().isConflict());
		// the voided run stays listed with its number and figures; the next number is never reused
		String third = runAndGetId(inventoryId, "Run 003");
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/runs").with(asMember()))
			.andExpect(jsonPath("$.length()").value(3))
			.andExpect(jsonPath("$[?(@.id == '" + first + "')].runNo").value(1))
			.andExpect(jsonPath("$[?(@.id == '" + first + "')].voided").value(true))
			.andExpect(jsonPath("$[?(@.id == '" + first + "')].totalKgCo2e").value(2660.0))
			.andExpect(jsonPath("$[?(@.id == '" + second + "')].runNo").value(2))
			.andExpect(jsonPath("$[?(@.id == '" + third + "')].runNo").value(3));
		mvc.perform(get("/api/ghg/runs/" + first + "/report").with(asMember()))
			.andExpect(jsonPath("$.run.voided").value(true));
		// a voided run cannot be designated final
		mvc.perform(post("/api/ghg/runs/" + first + "/finalize").with(asMember()).with(csrf()))
			.andExpect(status().isConflict());
		// the acts are on the record
		// every act is on the record (spec 01.2); the void names its run, its actor and its reason
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/events").with(asMember()))
			.andExpect(jsonPath("$[?(@.action == 'RUN_VOIDED')]", org.hamcrest.Matchers.hasSize(1)))
			.andExpect(jsonPath("$[?(@.action == 'RUN_VOIDED')].runNo").value(1))
			.andExpect(jsonPath("$[?(@.action == 'RUN_VOIDED')].actor").value("kojo@ecoriv.com"))
			.andExpect(jsonPath("$[?(@.action == 'RUN_VOIDED')].reason").value("Boundary v1 omitted the Nkran camp"))
			.andExpect(jsonPath("$[?(@.action == 'RUN_LAUNCHED')]", org.hamcrest.Matchers.hasSize(3)));
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/events").with(asOutsider()))
			.andExpect(status().isNotFound());
	}

	@Test
	void twoInventoriesAccountTheSameFactDifferently() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var jv = createEntity(orgId, "Tema JV", "JOINT_VENTURE", "40", true);
		var facilityId = createFacility(orgId, "Tema Plant", jv);
		var activityId = createActivity(orgId, facilityId, "Diesel consumption", "1000", "litre", "2025-03-15");

		var corporate = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(corporate, facilityId);
		prepare(corporate, activityId, DIESEL_FACTOR);

		var equity = createInventory(orgId, "2025 Equity", "EQUITY_SHARE");
		putBoundary(equity, facilityId);
		prepare(equity, activityId, DIESEL_FACTOR);

		// operational control: 100% -> 2660 kg; equity share: 40% -> 1064 kg
		run(corporate, "Run 001").andExpect(status().isCreated())
			.andExpect(jsonPath("$.run.totalKgCo2e").value(2660.0));
		run(equity, "Run 001").andExpect(status().isCreated())
			.andExpect(jsonPath("$.run.totalKgCo2e").value(1064.0));

		// the physical fact remains 1000 L in both cases
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/activities").with(asMember()))
			.andExpect(jsonPath("$[0].quantity").value(1000.0));
	}

	// --- unit conversion (spec 05) ------------------------------------------

	@Test
	void everySeededFactorUnitIsAConvertibleUnit() {
		assertThat(emissionFactors.findAllByOrganizationIdIsNullOrderByDefaultScopeAscNameAsc()).allSatisfy(factor -> assertThat(
				unitConverter.dimensionOf(factor.getUnit()))
			.as("factor '%s' unit '%s' must be a registered unit", factor.getName(), factor.getUnit())
			.isPresent());
	}

	@Test
	void everySeededFactorsGasSplitAddsUpToItsCo2eUnderAr5() {
		assertThat(emissionFactors.findAll()).allSatisfy(factor -> assertThat(
				factor.kgCo2ePerUnit(com.carbonos.ghg.internal.GwpSet.AR5))
			.as("factor '%s'", factor.getName())
			.isEqualByComparingTo(factor.getKgCo2ePerUnit()));
	}

	@Test
	void anActivityIsConvertedIntoTheFactorsUnitBeforeCalculating() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var facilityId = createFacility(orgId, "Tema Plant");
		// diesel metered in US gallons; the seeded Diesel factor is per litre
		var activityId = createActivity(orgId, facilityId, "Diesel consumption", "10000", "US-gallon", "2025-03-15");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, facilityId);
		prepare(inventoryId, activityId, DIESEL_FACTOR);

		// 10,000 US-gal x 3.785411784 = 37,854.11784 L x 2.66 x 100% = 100,691.953 kg (HALF_UP)
		run(inventoryId, "Run 001").andExpect(status().isCreated())
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
		// diesel recorded in kWh (energy) against a per-litre (volume) factor: no conversion and no
		// density bridges energy (mass to volume is spec 02.2)
		var activityId = createActivity(orgId, facilityId, "Diesel consumption", "800", "kWh", "2025-03-15");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, facilityId);
		prepare(inventoryId, activityId, DIESEL_FACTOR);

		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.ready").value(false))
			.andExpect(jsonPath("$.gates[3].status").value("BLOCKED"));
		run(inventoryId, "Run 001").andExpect(status().isConflict());
	}

	// --- spec 01: tenant isolation (AUTH-01) --------------------------------

	@Test
	void organizationsAreInvisibleToNonOwners() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var facilityId = createFacility(orgId, "Tema Plant");
		var activityId = createActivity(orgId, facilityId, "Diesel consumption", "1000", "litre", "2025-03-15");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, facilityId);
		prepare(inventoryId, activityId, DIESEL_FACTOR);
		String runId = runAndGetId(inventoryId, "Run 001");

		// an unrelated member sees nothing and can touch nothing: always 404, never 403
		mvc.perform(get("/api/ghg/organizations").with(asOutsider()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.length()").value(0));
		mvc.perform(get("/api/ghg/organizations/" + orgId).with(asOutsider())).andExpect(status().isNotFound());
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/entities").with(asOutsider()))
			.andExpect(status().isNotFound());
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/activities").with(asOutsider()))
			.andExpect(status().isNotFound());
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/base-year").with(asOutsider()))
			.andExpect(status().isNotFound());
		mvc.perform(get("/api/ghg/inventories/" + inventoryId).with(asOutsider())).andExpect(status().isNotFound());
		mvc.perform(get("/api/ghg/runs/" + runId + "/report").with(asOutsider())).andExpect(status().isNotFound());
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/runs").with(asOutsider()).with(csrf())
			.contentType("application/json").content("""
					{"label": "Stranger run"}"""))
			.andExpect(status().isNotFound());
		mvc.perform(post("/api/ghg/runs/" + runId + "/void").with(asOutsider()).with(csrf())
			.contentType("application/json").content("""
					{"reason": "Stranger void"}"""))
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
		putBoundary(inventoryId, facilityId);
		prepare(inventoryId, activityId, DIESEL_FACTOR);
		run(inventoryId, "Run 001").andExpect(status().isCreated());

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
		putBoundary(inventoryId, facilityId);
		prepare(inventoryId, activityId, DIESEL_FACTOR);
		String runId = runAndGetId(inventoryId, "Run 001");

		mvc.perform(put("/api/ghg/activities/" + activityId).with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"facilityId": "%s", "activityType": "Diesel consumption", "quantity": 1200,
					 "unit": "litre", "periodStart": "2025-03-15", "periodEnd": "2025-03-15", "evidenceRef": "INV-2938-corrected",
					 "dataQuality": "MEASURED", "reason": "meter reading reconciled with the invoice"}""".formatted(facilityId)))
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
		putBoundary(inventoryId, facilityId);
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
		var listing = body(mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember())));
		assertThat(JsonPath.<List<Boolean>>read(listing, "$[?(@.activityId == '" + activityId + "')].included")
			.getFirst()).isTrue();
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
					 "unit": "litre", "periodStart": "2091-01-01", "periodEnd": "2091-01-01", "dataQuality": "MEASURED"}"""
				.formatted(facilityId)))
			.andExpect(status().is(422))
			.andExpect(jsonPath("$.errors.periodStart").exists());
	}

	// --- inventory lifecycle (spec 05.1) --------------------------------------

	@Test
	void draftInventoryBlocksTheRunUntilFrozen() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var jv = createEntity(orgId, "Tema JV", "ASSOCIATE", "40", false);
		var facilityId = createFacility(orgId, "Tema Plant", jv);
		var activityId = createActivity(orgId, facilityId, "Diesel consumption", "1000", "litre", "2025-03-15");
		var inventoryId = createInventory(orgId, "2025 Equity View", "EQUITY_SHARE");
		putBoundary(inventoryId, facilityId);
		classify(syncAndGetAssignmentId(inventoryId, activityId), DIESEL_FACTOR);

		// everything else is green, but the inventory is still a draft
		mvc.perform(get("/api/ghg/inventories/" + inventoryId).with(asMember()))
			.andExpect(jsonPath("$.status").value("DRAFT"))
			.andExpect(jsonPath("$.currentBoundaryVersionNo").doesNotExist());
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.ready").value(false))
			.andExpect(jsonPath("$.gates[0].status").value("BLOCKED"))
			.andExpect(jsonPath("$.gates[0].findings[0].message")
				.value("The inventory is a draft. Freeze it to enable a run."));
		run(inventoryId, "Too early").andExpect(status().isConflict());

		// freezing cuts v1 with the entity, its facilities, its derived share, and who froze it
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/freeze").with(asMember()).with(csrf()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.version.versionNo").value(1))
			.andExpect(jsonPath("$.version.entityCount").value(1))
			.andExpect(jsonPath("$.version.facilityCount").value(1))
			.andExpect(jsonPath("$.version.frozenBy").value("kojo@ecoriv.com"))
			.andExpect(jsonPath("$.entries[0].entityName").value("Tema JV"))
			.andExpect(jsonPath("$.entries[0].facilities[0].facilityName").value("Tema Plant"))
			.andExpect(jsonPath("$.entries[0].economicInterestPercent").value(40.0))
			.andExpect(jsonPath("$.entries[0].accountingShare").value(0.40));
		mvc.perform(get("/api/ghg/inventories/" + inventoryId).with(asMember()))
			.andExpect(jsonPath("$.status").value("FROZEN"))
			.andExpect(jsonPath("$.currentBoundaryVersionNo").value(1));
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.ready").value(true));

		// the run computes from, and cites, that version
		run(inventoryId, "Run 001").andExpect(status().isCreated())
			.andExpect(jsonPath("$.run.totalKgCo2e").value(1064.0))
			.andExpect(jsonPath("$.run.boundaryVersionNo").value(1))
			.andExpect(jsonPath("$.run.boundaryVersionId").exists());
	}

	@Test
	void frozenInventoryRefusesEveryWriteUntilReopened() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var facilityId = createFacility(orgId, "Tema Plant");
		var otherId = createFacility(orgId, "Kumasi Plant");
		var activityId = createActivity(orgId, facilityId, "Diesel consumption", "1000", "litre", "2025-03-15");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, facilityId);
		var assignmentId = syncAndGetAssignmentId(inventoryId, activityId);
		freeze(inventoryId);

		// both halves of the view are read-only: boundary, assignments, review, and the approach
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/boundary/" + otherId).with(asMember()).with(csrf())
			.contentType("application/json").content("{}"))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.title").value("Operation not allowed"));
		mvc.perform(delete("/api/ghg/inventories/" + inventoryId + "/boundary/" + facilityId).with(asMember())
			.with(csrf()))
			.andExpect(status().isConflict());
		classifyAs(assignmentId, DIESEL_FACTOR, "SCOPE_1", "MOBILE_COMBUSTION").andExpect(status().isConflict());
		mvc.perform(put("/api/ghg/assignments/" + assignmentId + "/exclude").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"reason": "OTHER"}"""))
			.andExpect(status().isConflict());
		mvc.perform(put("/api/ghg/assignments/" + assignmentId + "/include").with(asMember()).with(csrf()))
			.andExpect(status().isConflict());
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/assignments/sync").with(asMember()).with(csrf()))
			.andExpect(status().isConflict());
		mvc.perform(put("/api/ghg/inventories/" + inventoryId).with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"name": "2025 Corporate", "periodStart": "2025-01-01", "periodEnd": "2025-12-31",
					 "consolidationApproach": "EQUITY_SHARE"}"""))
			.andExpect(status().isConflict());
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/freeze").with(asMember()).with(csrf()))
			.andExpect(status().isConflict());

		// reopening restores editing and keeps the pointer to v1
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/reopen").with(asMember()).with(csrf()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("DRAFT"))
			.andExpect(jsonPath("$.currentBoundaryVersionNo").value(1));
		putBoundary(inventoryId, otherId);

		// re-freezing cuts v2; v1 is untouched and the history lists newest first
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/freeze").with(asMember()).with(csrf()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.version.versionNo").value(2))
			.andExpect(jsonPath("$.version.facilityCount").value(2));
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/boundary/versions").with(asMember()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.length()").value(2))
			.andExpect(jsonPath("$[0].versionNo").value(2))
			.andExpect(jsonPath("$[1].versionNo").value(1))
			.andExpect(jsonPath("$[1].facilityCount").value(1));
	}

	@Test
	void freezingAnEmptyBoundaryIsRefused() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");

		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/freeze").with(asMember()).with(csrf()))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.title").value("Operation not allowed"));
	}

	@Test
	void boundaryVersionOutlivesFacilityChangesAndStaysTenantScoped() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var facilityId = createFacility(orgId, "Tema Plant");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, facilityId);
		var freeze = mvc
			.perform(post("/api/ghg/inventories/" + inventoryId + "/freeze").with(asMember()).with(csrf()))
			.andExpect(status().isOk())
			.andReturn();
		String versionId = JsonPath.read(freeze.getResponse().getContentAsString(), "$.version.id");

		// rename the facility: the version still carries the name it was frozen with
		mvc.perform(put("/api/ghg/facilities/" + facilityId).with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"name": "Tema Refinery", "location": "Tema, Ghana"}"""))
			.andExpect(status().isOk());
		mvc.perform(get("/api/ghg/boundary-versions/" + versionId).with(asMember()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.entries[0].facilities[0].facilityName").value("Tema Plant"))
			.andExpect(jsonPath("$.entries[0].accountingShare").value(1));

		// spec 01: an outsider cannot see the version exists, nor reopen the inventory
		mvc.perform(get("/api/ghg/boundary-versions/" + versionId).with(asOutsider()))
			.andExpect(status().isNotFound());
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/reopen").with(asOutsider()).with(csrf()))
			.andExpect(status().isNotFound());
	}

	@Test
	void zeroShareEntitiesStandOutsideTheBoundaryUnderThatApproach() throws Exception {
		var orgId = createOrganization("Sankofa Gold plc");
		var pit = createFacility(orgId, "Obuasi Ridge Open Pit");
		var port = createEntity(orgId, "Takoradi Port Co", "ASSOCIATE", "30", false);
		var terminal = createFacility(orgId, "Takoradi Port Loadout", port);
		var pitDiesel = createActivity(orgId, pit, "Haul fleet diesel", "1000", "litre", "2025-06-30");
		var shiploader = createActivity(orgId, terminal, "Shiploader diesel", "1000", "litre", "2025-09-30");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, pit);
		putBoundary(inventoryId, terminal);

		// the gate offers to remove it; review treats its records as outside the boundary
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.gates[0].findings[?(@.severity == 'WARNING')].message").value(org.hamcrest.Matchers
				.hasItem(org.hamcrest.Matchers.startsWith("Takoradi Port Co has a 0% accounting share"))));
		classify(syncAndGetAssignmentId(inventoryId, pitDiesel), DIESEL_FACTOR);
		var listing = body(mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember())));
		assertThat(JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + shiploader + "')].exclusionDetail")
			.getFirst()).isEqualTo("Takoradi Port Co: 0% accounting share under operational control");

		// the version records the entity as excluded with the reason, not as a member at 0%
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/freeze").with(asMember()).with(csrf()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.version.entityCount").value(1))
			.andExpect(jsonPath("$.entries[?(@.entityName == 'Takoradi Port Co')].excluded").value(true))
			.andExpect(jsonPath("$.entries[?(@.entityName == 'Takoradi Port Co')].exclusionReason")
				.value(org.hamcrest.Matchers.hasItem(org.hamcrest.Matchers.startsWith("0% accounting share"))));
		run(inventoryId, "Run 001").andExpect(status().isCreated())
			.andExpect(jsonPath("$.run.activityCount").value(1))
			.andExpect(jsonPath("$.exclusions.length()").value(1))
			.andExpect(jsonPath("$.exclusions[0].exclusionReason").value("OUTSIDE_BOUNDARY"));
	}

	@Test
	void aRunSnapshotsItsExclusionsAndTheyOutliveLaterReclassification() throws Exception {
		var orgId = createOrganization("Sankofa Gold plc");
		var pit = createFacility(orgId, "Obuasi Ridge Open Pit");
		var diesel = createActivity(orgId, pit, "Haul fleet diesel", "1000", "litre", "2025-06-30");
		var anfo = createActivity(orgId, pit, "ANFO explosives consumed", "10", "tonne", "2025-08-31");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, pit);
		var dieselAssignment = syncAndGetAssignmentId(inventoryId, diesel);
		var listing = body(mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember())));
		String anfoAssignment = JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + anfo + "')].id")
			.getFirst();
		classify(dieselAssignment, DIESEL_FACTOR);
		mvc.perform(put("/api/ghg/assignments/" + anfoAssignment + "/exclude").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"reason": "METHODOLOGY", "justification": "emulsion explosive without a published factor", "estimatedKgCo2e": 120}"""))
			.andExpect(status().isOk());
		freeze(inventoryId);
		String firstRun = runAndGetId(inventoryId, "Run 001");
		mvc.perform(get("/api/ghg/runs/" + firstRun).with(asMember()))
			.andExpect(jsonPath("$.lines.length()").value(1))
			.andExpect(jsonPath("$.exclusions.length()").value(1))
			.andExpect(jsonPath("$.exclusions[0].activityType").value("ANFO explosives consumed"))
			.andExpect(jsonPath("$.exclusions[0].exclusionReason").value("METHODOLOGY"));

		// the accountant changes their mind: the earlier run still lists the exclusion as it stood
		reopen(inventoryId);
		mvc.perform(put("/api/ghg/assignments/" + anfoAssignment + "/include").with(asMember()).with(csrf()))
			.andExpect(status().isOk());
		classify(anfoAssignment, ANFO_FACTOR);
		freeze(inventoryId);
		run(inventoryId, "Run 002").andExpect(status().isCreated())
			.andExpect(jsonPath("$.lines.length()").value(2))
			.andExpect(jsonPath("$.exclusions.length()").value(0));
		mvc.perform(get("/api/ghg/runs/" + firstRun).with(asMember()))
			.andExpect(jsonPath("$.run.boundaryVersionNo").value(1))
			.andExpect(jsonPath("$.exclusions.length()").value(1));
		// and the report prints the exclusion under the lines
		mvc.perform(get("/api/ghg/runs/" + firstRun + "/report").with(asMember()))
			.andExpect(jsonPath("$.exclusions[0].exclusionReason").value("METHODOLOGY"));
	}

	@Test
	void aFinalDesignationMustBeWithdrawnBeforeReopeningAndPublishingMakesARecord() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var facilityId = createFacility(orgId, "Tema Plant");
		var otherId = createFacility(orgId, "Kumasi Plant");
		var activityId = createActivity(orgId, facilityId, "Diesel consumption", "1000", "litre", "2025-03-15");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, facilityId);
		excludeFacility(inventoryId, otherId, "NOT_APPLICABLE", "Mothballed all year");
		prepare(inventoryId, activityId, DIESEL_FACTOR);
		String runId = runAndGetId(inventoryId, "Run 001");

		// a draft cannot be published, and a frozen inventory needs a final run first
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/publish").with(asMember()).with(csrf()))
			.andExpect(status().isConflict());
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/finalize").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"runId": "%s"}""".formatted(runId)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("FINAL"));

		// FINAL: reopening is refused until the designation is withdrawn
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/reopen").with(asMember()).with(csrf()))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("Withdraw the designation")));
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/withdraw-final").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"reason": "The other site joins the boundary"}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("FROZEN"))
			.andExpect(jsonPath("$.finalRunId").doesNotExist());
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/events").with(asMember()))
			.andExpect(jsonPath("$[0].action").value("FINAL_WITHDRAWN"))
			.andExpect(jsonPath("$[0].reason").value("The other site joins the boundary"));
		reopen(inventoryId);
		putBoundary(inventoryId, otherId);
		freeze(inventoryId);
		String secondRun = runAndGetId(inventoryId, "Run 002");
		mvc.perform(get("/api/ghg/runs/" + runId).with(asMember()))
			.andExpect(jsonPath("$.run.boundaryVersionNo").value(1));
		mvc.perform(get("/api/ghg/runs/" + secondRun).with(asMember()))
			.andExpect(jsonPath("$.run.boundaryVersionNo").value(2));

		// PUBLISHED: nothing may change; a correction supersedes it
		mvc.perform(post("/api/ghg/runs/" + secondRun + "/finalize").with(asMember()).with(csrf()))
			.andExpect(status().isOk());
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/publish").with(asMember()).with(csrf()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("PUBLISHED"))
			.andExpect(jsonPath("$.publishedAt").exists());
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/withdraw-final").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"reason": "Too late"}"""))
			.andExpect(status().isConflict());
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/reopen").with(asMember()).with(csrf()))
			.andExpect(status().isConflict());
		run(inventoryId, "Run 003").andExpect(status().isConflict());
		mvc.perform(post("/api/ghg/runs/" + runId + "/void").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"reason": "Published runs are a record"}"""))
			.andExpect(status().isConflict());
		mvc.perform(delete("/api/ghg/inventories/" + inventoryId).with(asMember()).with(csrf()))
			.andExpect(status().isConflict());

		// a correction must say why it exists
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/supersede").with(asMember()).with(csrf())
				.contentType("application/json").content("""
						{"name": "2025 Corporate (restated)"}"""))
			.andExpect(status().isUnprocessableContent())
			.andExpect(jsonPath("$.errors.reason").exists());
		var successor = body(mvc
			.perform(post("/api/ghg/inventories/" + inventoryId + "/supersede").with(asMember()).with(csrf())
				.contentType("application/json").content("""
						{"name": "2025 Corporate (restated)", "reason": "Restated after a metering error was found"}"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.status").value("DRAFT"))
			.andExpect(jsonPath("$.name").value("2025 Corporate (restated)")));
		String successorId = JsonPath.read(successor, "$.id");
		mvc.perform(get("/api/ghg/inventories/" + inventoryId).with(asMember()))
			.andExpect(jsonPath("$.supersededById").value(successorId));
		// the correction starts from the published boundary
		mvc.perform(get("/api/ghg/inventories/" + successorId + "/boundary").with(asMember()))
			.andExpect(jsonPath("$[0].inBoundary").value(true))
			.andExpect(jsonPath("$[0].facilities.length()").value(2));
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/supersede").with(asMember()).with(csrf()))
			.andExpect(status().isConflict());
	}

	// --- base year (spec 06) ---------------------------------------------------

	@Test
	void structuralChangesAreFlaggedAgainstTheBaseYearThreshold() throws Exception {
		var orgId = createOrganization("Sankofa Gold plc");
		var pit = createFacility(orgId, "Obuasi Ridge Open Pit");
		var port = createEntity(orgId, "Takoradi Port Co", "SUBSIDIARY", "100", true);
		var terminal = createFacility(orgId, "Takoradi Port Loadout", port);
		var pitDiesel = createActivity(orgId, pit, "Haul fleet diesel", "10000", "litre", "2024-06-30");
		var portDiesel = createActivity(orgId, terminal, "Shiploader diesel", "500", "litre", "2024-09-30");
		createActivity(orgId, pit, "Haul fleet diesel", "9000", "litre", "2025-06-30");

		// the 2024 base year: pit 26,600 kg + terminal 1,330 kg = 27,930 kg; the terminal is 4.76% of it
		var base = createInventory(orgId, "2024 Base Year", "OPERATIONAL_CONTROL", "2024-01-01", "2024-12-31");
		putBoundary(base, pit);
		putBoundary(base, terminal);
		classify(syncAndGetAssignmentId(base, pitDiesel), DIESEL_FACTOR);
		var listing = body(mvc.perform(get("/api/ghg/inventories/" + base + "/assignments").with(asMember())));
		classify(JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + portDiesel + "')].id").getFirst(),
				DIESEL_FACTOR);
		freeze(base);
		String baseRun = runAndGetId(base, "Base 2024");
		mvc.perform(post("/api/ghg/runs/" + baseRun + "/finalize").with(asMember()).with(csrf()))
			.andExpect(status().isOk());

		mvc.perform(get("/api/ghg/organizations/" + orgId + "/base-year").with(asMember()))
			.andExpect(status().isNoContent());
		// the retired trigger switches are refused: the Standard makes all three triggers mandatory
		mvc.perform(put("/api/ghg/organizations/" + orgId + "/base-year").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"inventoryId": "%s", "thresholdPercent": 5, "reason": "First verifiable year",
					 "triggers": {"structuralChanges": true, "methodologyChanges": false, "errorCorrections": true}}"""
				.formatted(base)))
			.andExpect(status().is(422))
			.andExpect(jsonPath("$.errors.triggers").exists());
		mvc.perform(put("/api/ghg/organizations/" + orgId + "/base-year").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"inventoryId": "%s", "thresholdPercent": 5,
					 "reason": "First year with verifiable, metered data for every site"}""".formatted(base)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.year").value(2024))
			.andExpect(jsonPath("$.reason").value("First year with verifiable, metered data for every site"))
			.andExpect(jsonPath("$.structuralChangeConvention").value("TRANSACTION_DATE"))
			.andExpect(jsonPath("$.baseRunId").value(baseRun))
			.andExpect(jsonPath("$.recalculations.length()").value(0));

		// 2025 without the terminal: a divestment worth 4.76%, below the 5% threshold, recalculation optional
		var current = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(current, pit);
		excludeFacility(current, terminal, "OTHER", "Divested 2025-01-01");
		freeze(current);
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/base-year").with(asMember()))
			.andExpect(jsonPath("$.recalculations.length()").value(1))
			.andExpect(jsonPath("$.recalculations[0].status").value("FLAGGED"))
			.andExpect(jsonPath("$.recalculations[0].aboveThreshold").value(false))
			.andExpect(jsonPath("$.recalculations[0].affectedPercent").value(4.76))
			.andExpect(jsonPath("$.recalculations[0].cumulativePercent").value(4.76))
			.andExpect(jsonPath("$.recalculations[0].boundaryVersionNo").value(1))
			.andExpect(jsonPath("$.recalculations[0].reason").value("structural change: Takoradi Port Loadout removed; "
					+ "4.76% of base-year emissions, below the 5% threshold, recalculation optional"));
		mvc.perform(get("/api/ghg/inventories/" + current + "/validation").with(asMember()))
			.andExpect(jsonPath("$.gates[4].status").value("WARNINGS"));
		// a warning never blocks: this run is kept as the wrong candidate for a recalculated base below
		String wrongRun = runAndGetId(current, "Not the base");

		// a tighter threshold makes the next candidate blocking: re-adding the terminal mid-year
		mvc.perform(put("/api/ghg/organizations/" + orgId + "/base-year").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"inventoryId": "%s", "thresholdPercent": 3, "reason": "First verifiable year"}"""
				.formatted(base)))
			.andExpect(status().isOk());
		reopen(current);
		putBoundary(current, terminal, """
				{"effectiveFrom": "2025-07-01"}""");
		freeze(current);
		// the second change is weighed together with the first, still outstanding (Chapter 5: cumulative effect)
		var baseYear = body(mvc.perform(get("/api/ghg/organizations/" + orgId + "/base-year").with(asMember()))
			.andExpect(jsonPath("$.recalculations.length()").value(2))
			.andExpect(jsonPath("$.recalculations[1].aboveThreshold").value(true))
			.andExpect(jsonPath("$.recalculations[1].cumulativePercent").value(9.52))
			.andExpect(jsonPath("$.recalculations[1].reason").value("structural change: Takoradi Port Loadout added; "
					+ "4.76% of base-year emissions on its own, 9.52% together with 1 earlier change since the "
					+ "2024 base year, above the 3% threshold, recalculation required")));
		mvc.perform(get("/api/ghg/inventories/" + current + "/validation").with(asMember()))
			.andExpect(jsonPath("$.gates[4].status").value("BLOCKED"));

		// decisions: declining the first, recalculating the base for the second with a run of the base year
		String first = JsonPath.read(baseYear, "$.recalculations[0].id");
		String second = JsonPath.read(baseYear, "$.recalculations[1].id");
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/base-year/recalculations/" + first + "/decide")
			.with(asMember()).with(csrf()).contentType("application/json").content("""
					{"decision": "DECLINED", "note": "Below threshold; base year kept."}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.recalculations[0].status").value("DECLINED"))
			.andExpect(jsonPath("$.recalculations[0].decidedBy").value("kojo@ecoriv.com"));
		// a run of another inventory is not a recalculated base
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/base-year/recalculations/" + second + "/decide")
			.with(asMember()).with(csrf()).contentType("application/json").content("""
					{"decision": "RECALCULATED", "runId": "%s"}""".formatted(wrongRun)))
			.andExpect(status().isConflict());
		String recalculated = runAndGetId(base, "Base 2024, restated");
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/base-year/recalculations/" + second + "/decide")
			.with(asMember()).with(csrf()).contentType("application/json").content("""
					{"decision": "RECALCULATED", "runId": "%s"}""".formatted(recalculated)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.recalculations[1].status").value("RECALCULATED"))
			.andExpect(jsonPath("$.recalculations[1].runId").value(recalculated));
		mvc.perform(get("/api/ghg/inventories/" + current + "/validation").with(asMember()))
			.andExpect(jsonPath("$.gates[4].status").value("PASSED"));

		// the report shows the period against both base-year figures, the reason, the convention and the
		// profile over time: the base year with its recalculated figure, then the current period
		mvc.perform(get("/api/ghg/runs/" + wrongRun + "/report").with(asMember()))
			.andExpect(jsonPath("$.baseYear.year").value(2024))
			.andExpect(jsonPath("$.baseYear.reason").value("First verifiable year"))
			.andExpect(jsonPath("$.baseYear.structuralChangeConvention").value("TRANSACTION_DATE"))
			.andExpect(jsonPath("$.baseYear.gwpSetMatches").value(true))
			.andExpect(jsonPath("$.baseYear.originalBase.totalKgCo2e").value(27930.0))
			.andExpect(jsonPath("$.baseYear.recalculations.length()").value(2))
			.andExpect(jsonPath("$.baseYear.recalculations[1].recalculatedBase.label").value("Base 2024, restated"))
			.andExpect(jsonPath("$.baseYear.profile.length()").value(2))
			.andExpect(jsonPath("$.baseYear.profile[0].year").value(2024))
			.andExpect(jsonPath("$.baseYear.profile[0].totalKgCo2e").value(27930.0))
			.andExpect(jsonPath("$.baseYear.profile[0].recalculatedRunId").value(recalculated))
			.andExpect(jsonPath("$.baseYear.profile[1].year").value(2025))
			.andExpect(jsonPath("$.baseYear.profile[1].finalRunId").doesNotExist())
			// the Scope 2 Guidance disclosures about the base year (spec 07.2)
			.andExpect(jsonPath("$.emissions.totalMethod").value("LOCATION_BASED"))
			.andExpect(jsonPath("$.emissions.baseYearScope2Method").value("DUAL"))
			.andExpect(jsonPath("$.emissions.baseYearMarketBasedIsProxy").value(true));
		// a recalculation resets the running sum: the next candidate is weighed on its own
		reopen(current);
		mvc.perform(delete("/api/ghg/inventories/" + current + "/boundary/" + terminal).with(asMember()).with(csrf()))
			.andExpect(status().isNoContent());
		freeze(current);
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/base-year").with(asMember()))
			.andExpect(jsonPath("$.recalculations.length()").value(3))
			.andExpect(jsonPath("$.recalculations[2].cumulativePercent").value(4.76))
			.andExpect(jsonPath("$.recalculations[2].reason")
				.value(org.hamcrest.Matchers.endsWith("4.76% of base-year emissions, above the 3% threshold, "
						+ "recalculation required")));
	}

	@Test
	void methodologyChangesAndErrorCorrectionsAreRaisedByTheAccountantAndWeighedCumulatively() throws Exception {
		var orgId = createOrganization("Sankofa Gold plc");
		var pit = createFacility(orgId, "Obuasi Ridge Open Pit");
		var pitDiesel = createActivity(orgId, pit, "Haul fleet diesel", "10000", "litre", "2024-06-30");
		var base = createInventory(orgId, "2024 Base Year", "OPERATIONAL_CONTROL", "2024-01-01", "2024-12-31");
		putBoundary(base, pit);
		prepare(base, pitDiesel, DIESEL_FACTOR);
		mvc.perform(post("/api/ghg/runs/" + runAndGetId(base, "Base 2024") + "/finalize").with(asMember()).with(csrf()))
			.andExpect(status().isOk());
		mvc.perform(put("/api/ghg/organizations/" + orgId + "/base-year").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"inventoryId": "%s", "thresholdPercent": 5, "reason": "First verifiable year"}""".formatted(base)))
			.andExpect(status().isOk());
		var current = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(current, pit);
		freeze(current);
		// structural changes are detected, never raised by hand
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/base-year/recalculations").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"trigger": "STRUCTURAL_CHANGE", "reason": "Sold the camp", "affectedPercent": 2}"""))
			.andExpect(status().isConflict());
		// a supplier-specific grid factor replaces the national one: 3% on its own, below the threshold
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/base-year/recalculations").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"trigger": "METHODOLOGY_CHANGE", "reason": "Supplier-specific grid factor replaces the national average",
					 "affectedPercent": 3}"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.recalculations[0].triggerType").value("METHODOLOGY_CHANGE"))
			.andExpect(jsonPath("$.recalculations[0].raisedBy").value("kojo@ecoriv.com"))
			.andExpect(jsonPath("$.recalculations[0].aboveThreshold").value(false))
			.andExpect(jsonPath("$.recalculations[0].reason").value("methodology change: Supplier-specific grid factor "
					+ "replaces the national average; 3% of base-year emissions, below the 5% threshold, "
					+ "recalculation optional"));
		mvc.perform(get("/api/ghg/inventories/" + current + "/validation").with(asMember()))
			.andExpect(jsonPath("$.gates[4].status").value("WARNINGS"));
		// a corrected meter reading worth 2.5%: 5.5% together with the outstanding methodology change
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/base-year/recalculations").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"trigger": "ERROR_CORRECTION", "reason": "Mill meter under-read by 2.5%", "affectedPercent": 2.5}"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.recalculations[1].cumulativePercent").value(5.5))
			.andExpect(jsonPath("$.recalculations[1].aboveThreshold").value(true))
			.andExpect(jsonPath("$.recalculations[1].reason").value(org.hamcrest.Matchers.containsString(
					"2.5% of base-year emissions on its own, 5.5% together with 1 earlier change since the 2024 base year")));
		mvc.perform(get("/api/ghg/inventories/" + current + "/validation").with(asMember()))
			.andExpect(jsonPath("$.gates[4].status").value("BLOCKED"));
	}

	@Test
	void theBaseYearGateWarnsOnAGwpMismatchAndOnWindowsUnderTheWholeYearConvention() throws Exception {
		var orgId = createOrganization("Sankofa Gold plc");
		var pit = createFacility(orgId, "Obuasi Ridge Open Pit");
		var port = createEntity(orgId, "Takoradi Port Co", "SUBSIDIARY", "100", true);
		var terminal = createFacility(orgId, "Takoradi Port Loadout", port);
		var pitDiesel = createActivity(orgId, pit, "Haul fleet diesel", "10000", "litre", "2024-06-30");
		var base = createInventory(orgId, "2024 Base Year", "OPERATIONAL_CONTROL", "2024-01-01", "2024-12-31");
		putBoundary(base, pit);
		excludeFacility(base, terminal, "NOT_APPLICABLE", "Acquired in 2025");
		prepare(base, pitDiesel, DIESEL_FACTOR);
		runAndGetId(base, "Base 2024");
		mvc.perform(put("/api/ghg/organizations/" + orgId + "/base-year").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"inventoryId": "%s", "thresholdPercent": 5, "reason": "First verifiable year",
					 "structuralChangeConvention": "WHOLE_YEAR"}""".formatted(base)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.structuralChangeConvention").value("WHOLE_YEAR"));
		// an AR6 inventory against an AR5 base year: the amendment recommends the same set for both
		var ar6 = body(mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/inventories").with(asMember()).with(csrf())
				.contentType("application/json").content("""
						{"name": "2025 AR6", "periodStart": "2025-01-01", "periodEnd": "2025-12-31",
						 "consolidationApproach": "OPERATIONAL_CONTROL", "gwpSet": "AR6"}"""))
			.andExpect(status().isCreated()));
		String ar6Id = JsonPath.read(ar6, "$.id");
		putBoundary(ar6Id, pit);
		// a mid-year acquisition accounted from its date contradicts the whole-year convention
		putBoundary(ar6Id, terminal, """
				{"effectiveFrom": "2025-07-01"}""");
		mvc.perform(get("/api/ghg/inventories/" + ar6Id + "/validation").with(asMember()))
			.andExpect(jsonPath("$.gates[4].findings[?(@.severity == 'WARNING')].message")
				.value(org.hamcrest.Matchers.hasItem(org.hamcrest.Matchers
					.containsString("This inventory uses IPCC AR6 potentials; the 2024 base year uses IPCC AR5"))))
			.andExpect(jsonPath("$.gates[0].findings[?(@.severity == 'WARNING')].message")
				.value(org.hamcrest.Matchers.hasItem(org.hamcrest.Matchers
					.containsString("accounts structural changes for the whole year"))));
		// the base-year inventory itself never warns about its own GWP set
		mvc.perform(get("/api/ghg/inventories/" + base + "/validation").with(asMember()))
			.andExpect(jsonPath("$.gates[4].status").value("PASSED"));
	}

	@Test
	void aFacilityThatDidNotExistInTheBaseYearIsOrganicGrowthNotAStructuralChange() throws Exception {
		var orgId = createOrganization("Sankofa Gold plc");
		var pit = createFacility(orgId, "Obuasi Ridge Open Pit");
		var camp = createFacility(orgId, "Nkran Exploration Camp");
		var pitDiesel = createActivity(orgId, pit, "Haul fleet diesel", "10000", "litre", "2024-06-30");
		var base = createInventory(orgId, "2024 Base Year", "OPERATIONAL_CONTROL", "2024-01-01", "2024-12-31");
		putBoundary(base, pit);
		excludeFacility(base, camp, "NOT_APPLICABLE", "Not yet built in 2024");
		prepare(base, pitDiesel, DIESEL_FACTOR);
		runAndGetId(base, "Base 2024");
		mvc.perform(put("/api/ghg/organizations/" + orgId + "/base-year").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"inventoryId": "%s", "thresholdPercent": 5, "reason": "First verifiable year"}""".formatted(base)))
			.andExpect(status().isOk());

		var current = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(current, pit);
		putBoundary(current, camp);
		freeze(current);
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/base-year").with(asMember()))
			.andExpect(jsonPath("$.recalculations.length()").value(0));
	}

	// --- reporting completeness (spec 07.1) --------------------------------------

	@Test
	void aRunReportsEachGasSeparatelyAndBiogenicCo2OutsideTheScopes() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var plant = createFacility(orgId, "Tema Plant");
		var pellets = createActivity(orgId, plant, "Boiler wood pellets", "10", "tonne", "2025-02-01");
		var waste = createActivity(orgId, plant, "Waste to landfill", "1", "tonne", "2025-03-01");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, plant);
		classify(syncAndGetAssignmentId(inventoryId, pellets), BIOMASS_FACTOR);
		var listing = body(mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember())));
		classify(JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + waste + "')].id").getFirst(),
				LANDFILL_FACTOR);
		freeze(inventoryId);

		// pellets: 10 t x (0.1 CH4 + 0.046 N2O) = 1 kg CH4, 0.46 kg N2O -> 28 + 121.9 = 149.9 kg CO2e, plus
		// 18,000 kg biogenic CO2 outside the scopes; landfill: 12.2 kg CO2 + 15.5 kg CH4 (434 CO2e) = 446.2
		var report = body(run(inventoryId, "Run 001").andExpect(status().isCreated())
			.andExpect(jsonPath("$.run.gwpSet").value("AR5"))
			.andExpect(jsonPath("$.run.totalKgCo2e").value(596.1))
			.andExpect(jsonPath("$.run.byGas.co2Kg").value(12.2))
			.andExpect(jsonPath("$.run.byGas.ch4Kg").value(16.5))
			.andExpect(jsonPath("$.run.byGas.n2oKg").value(0.46))
			.andExpect(jsonPath("$.run.biogenicCo2Kg").value(18000.0)));
		String runId = JsonPath.read(report, "$.run.id");
		mvc.perform(get("/api/ghg/runs/" + runId + "/report").with(asMember()))
			.andExpect(jsonPath("$.byGas[?(@.gas == 'CH4')].kgCo2e").value(462.0))
			.andExpect(jsonPath("$.byGas[?(@.gas == 'N2O')].kgCo2e").value(121.9))
			.andExpect(jsonPath("$.biogenicCo2Kg").value(18000.0))
			.andExpect(jsonPath("$.methodology.gwpSet").value("AR5"));

		// the same facts under AR6 potentials: CH4 27.9, N2O 273
		var ar6 = body(mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/inventories").with(asMember()).with(csrf())
				.contentType("application/json")
				.content("""
						{"name": "2025 AR6", "periodStart": "2025-01-01", "periodEnd": "2025-12-31",
						 "consolidationApproach": "OPERATIONAL_CONTROL", "gwpSet": "AR6"}"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.gwpSet").value("AR6")));
		String ar6Id = JsonPath.read(ar6, "$.id");
		putBoundary(ar6Id, plant);
		prepare(ar6Id, pellets, BIOMASS_FACTOR);
		// 1 x 27.9 + 0.46 x 273 = 153.48; the landfill record is unclassified and excluded by the gate? No:
		// it is included and unclassified, so exclude it first
		reopen(ar6Id);
		var ar6Listing = body(mvc.perform(get("/api/ghg/inventories/" + ar6Id + "/assignments").with(asMember())));
		mvc.perform(put("/api/ghg/assignments/"
				+ JsonPath.<List<String>>read(ar6Listing, "$[?(@.activityId == '" + waste + "')].id").getFirst()
				+ "/exclude").with(asMember()).with(csrf()).contentType("application/json").content("""
						{"reason": "NOT_APPLICABLE", "justification": "not a source of this inventory", "estimatedKgCo2e": 0}"""))
			.andExpect(status().isOk());
		freeze(ar6Id);
		run(ar6Id, "Run 001").andExpect(status().isCreated())
			.andExpect(jsonPath("$.run.gwpSet").value("AR6"))
			.andExpect(jsonPath("$.run.totalKgCo2e").value(153.48));
	}

	@Test
	void marketBasedScope2IsReportedBesideLocationBased() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var plant = createFacility(orgId, "Tema Plant");
		var office = createFacility(orgId, "Accra Office");
		var plantPower = createActivity(orgId, plant, "Mill grid electricity", "1000", "kWh", "2025-07-31");
		var officePower = createActivity(orgId, office, "Office grid electricity", "1", "MWh", "2025-08-31");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, plant);
		putBoundary(inventoryId, office);
		// the plant buys certified renewable power: a market-based factor for that facility and period
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/market-factors/" + plant).with(asMember())
			.with(csrf()).contentType("application/json").content("""
					{"instrumentType": "CERTIFICATE", "kgCo2ePerKwh": 0.05, "source": "Supplier REC 2025",
					 "meetsQualityCriteria": true, "coveredKwh": 1000}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.facilityName").value("Tema Plant"))
			.andExpect(jsonPath("$.meetsQualityCriteria").value(true));
		// the Guidance requires the residual-mix disclosure either way; the gate says so until it is recorded
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.gates[3].findings[?(@.severity == 'WARNING')].message").value(org.hamcrest.Matchers
				.hasItem(org.hamcrest.Matchers.containsString("does not say whether a residual mix is available"))));
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/residual-mix").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"available": false}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.residualMixAvailable").value(false));
		classify(syncAndGetAssignmentId(inventoryId, plantPower), GRID_FACTOR);
		var listing = body(mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember())));
		classify(JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + officePower + "')].id").getFirst(),
				GRID_FACTOR);
		freeze(inventoryId);

		// location-based: 1,000 x 0.441 + 1,000 x 0.441 = 882; market-based: 1,000 x 0.05 + 441 = 491
		var detail = body(run(inventoryId, "Run 001").andExpect(status().isCreated())
			.andExpect(jsonPath("$.run.scope2KgCo2e").value(882.0))
			.andExpect(jsonPath("$.run.scope2MarketBasedKgCo2e").value(491.0))
			.andExpect(jsonPath("$.lines[?(@.facilityName == 'Tema Plant')].marketBasedKgCo2e").value(50.0))
			.andExpect(jsonPath("$.lines[?(@.facilityName == 'Tema Plant')].marketInstrument").value("CERTIFICATE"))
			// the office has no instrument: its market-based figure is the grid average, and the line says so
			.andExpect(jsonPath("$.lines[?(@.facilityName == 'Accra Office')].marketBasedKgCo2e").value(441.0))
			.andExpect(jsonPath("$.lines[?(@.facilityName == 'Accra Office')].marketNote").value(org.hamcrest.Matchers
				.hasItem(org.hamcrest.Matchers.startsWith("no contractual instrument; 1,000 kWh at 0.441 kg/kWh"))))
			.andExpect(jsonPath("$.run.scope2MarketBasis").value("INSTRUMENTS")));
		String runId = JsonPath.read(detail, "$.run.id");
		mvc.perform(get("/api/ghg/runs/" + runId + "/report").with(asMember()))
			.andExpect(jsonPath("$.emissions.scope2LocationBasedKgCo2e").value(882.0))
			.andExpect(jsonPath("$.emissions.scope2MarketBasedKgCo2e").value(491.0))
			.andExpect(jsonPath("$.emissions.scope2MarketBasedTCo2e").value(0.491))
			.andExpect(jsonPath("$.emissions.totalTCo2e").value(0.882))
			.andExpect(jsonPath("$.emissions.totalMethod").value("LOCATION_BASED"))
			.andExpect(jsonPath("$.emissions.residualMixAvailable").value(false))
			.andExpect(jsonPath("$.emissions.residualMixDisclosure")
				.value(org.hamcrest.Matchers.containsString("may result in double counting")))
			.andExpect(jsonPath("$.emissions.marketInstruments[0].instrumentType").value("CERTIFICATE"))
			.andExpect(jsonPath("$.methodology.statement")
				.value(org.hamcrest.Matchers.containsString("The inventory total uses the location-based figure")));
		// with no instrument anywhere, the market-based figure is still reported: the grid average stands in
		// (spec 07.3), the line says so, and the report prints both totals with the basis
		var plain = createInventory(orgId, "2025 Plain", "OPERATIONAL_CONTROL");
		putBoundary(plain, plant);
		excludeFacility(plain, office, "NOT_APPLICABLE", "Office reported by the landlord");
		prepare(plain, plantPower, GRID_FACTOR);
		var plainDetail = body(run(plain, "Run 001").andExpect(status().isCreated())
			.andExpect(jsonPath("$.run.scope2MarketBasedKgCo2e").value(441.0))
			.andExpect(jsonPath("$.run.scope2MarketBasis").value("GRID_AVERAGE"))
			.andExpect(jsonPath("$.lines[0].marketBasedKgCo2e").value(441.0))
			.andExpect(jsonPath("$.lines[0].marketBalanceKwh").value(1000.0))
			.andExpect(jsonPath("$.lines[0].marketBalanceBasis").value("GRID_AVERAGE"))
			.andExpect(jsonPath("$.lines[0].marketNote").value(org.hamcrest.Matchers.startsWith("no contractual instrument; 1,000 kWh at 0.441 kg/kWh (grid average")))
			.andExpect(jsonPath("$.run.byGas.hfcsKg").value(0)));
		mvc.perform(get("/api/ghg/runs/" + JsonPath.read(plainDetail, "$.run.id") + "/report").with(asMember()))
			.andExpect(jsonPath("$.emissions.scope2MarketBasedTCo2e").value(0.441))
			.andExpect(jsonPath("$.emissions.scope2MarketBasis").value("GRID_AVERAGE"))
			.andExpect(jsonPath("$.emissions.residualMixDisclosure")
				.value(org.hamcrest.Matchers.startsWith("The inventory does not state whether")))
			.andExpect(jsonPath("$.methodology.statement").value(org.hamcrest.Matchers
				.containsString("No contractual instrument was applied and no residual mix is available")));
	}

	/** Audit finding F31 (T-01): the Obuom PPA covers 20,000 MWh of 46,500 MWh; the balance takes the grid average. */
	@Test
	void anInstrumentAppliesToTheKwhItCoversAndTheBalanceTakesTheResidualMixOrGridAverage() throws Exception {
		var orgId = createOrganization("Asante Gold Resources");
		var plant = createFacility(orgId, "Obuom Processing Plant");
		// two meter reads in the activity view's order: 30,000 MWh then 16,500 MWh, plus one outside the PPA's period
		var firstHalf = createActivity(orgId, plant, "Grid electricity, Jan-Jun", "30000", "MWh", "2025-06-30");
		var secondHalf = createActivity(orgId, plant, "Grid electricity, Jul-Dec", "16500", "MWh", "2025-12-31");
		var inventoryId = createInventory(orgId, "FY2025", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, plant);
		// a PPA at 0 kg/kWh covering 20,000 MWh; the end must not precede the start
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/market-factors/" + plant).with(asMember())
			.with(csrf()).contentType("application/json").content("""
					{"instrumentType": "CONTRACT", "kgCo2ePerKwh": 0, "source": "Obuom solar PPA 2025",
					 "meetsQualityCriteria": true, "coveredKwh": 20000000,
					 "periodStart": "2025-12-31", "periodEnd": "2025-01-01"}"""))
			.andExpect(status().is(422));
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/market-factors/" + plant).with(asMember())
			.with(csrf()).contentType("application/json").content("""
					{"instrumentType": "CONTRACT", "kgCo2ePerKwh": 0, "source": "Obuom solar PPA 2025",
					 "meetsQualityCriteria": true, "coveredKwh": 20000000}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.coveredKwh").value(20000000))
			.andExpect(jsonPath("$.periodStart").doesNotExist());
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/residual-mix").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"available": false}"""))
			.andExpect(status().isOk());
		classify(syncAndGetAssignmentId(inventoryId, firstHalf), GRID_FACTOR);
		var listing = body(mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember())));
		classify(JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + secondHalf + "')].id").getFirst(),
				GRID_FACTOR);
		freeze(inventoryId);
		// location-based: 46,500,000 kWh x 0.441 = 20,506,500 kg. Market-based: the first read is covered for
		// 20,000,000 of its 30,000,000 kWh, the rest and the second read take the grid average:
		// 26,500,000 x 0.441 = 11,686,500 kg (11,686.5 t), not the 0 the audit found
		var detail = body(run(inventoryId, "Run 001").andExpect(status().isCreated())
			.andExpect(jsonPath("$.run.scope2KgCo2e").value(20506500.0))
			.andExpect(jsonPath("$.run.scope2MarketBasedKgCo2e").value(11686500.0))
			.andExpect(jsonPath("$.run.scope2MarketBasis").value("INSTRUMENTS"))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + firstHalf + "')].marketCoveredKwh").value(20000000.0))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + firstHalf + "')].marketBalanceKwh").value(10000000.0))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + firstHalf + "')].marketBasedKgCo2e").value(4410000.0))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + firstHalf + "')].marketNote")
				.value("20,000,000 kWh at 0 kg/kWh (contract); 10,000,000 kWh at 0.441 kg/kWh (grid average: the "
						+ "location-based figure stands, no residual mix is available)"))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + secondHalf + "')].marketCoveredKwh").value(0.0))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + secondHalf + "')].marketBasedKgCo2e").value(7276500.0))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + secondHalf + "')].marketNote").value(org.hamcrest.Matchers
				.hasItem(org.hamcrest.Matchers.startsWith("the facility's instrument is used up by earlier records")))));
		mvc.perform(get("/api/ghg/runs/" + JsonPath.read(detail, "$.run.id") + "/report").with(asMember()))
			.andExpect(jsonPath("$.emissions.scope2MarketBasedTCo2e").value(11686.5))
			.andExpect(jsonPath("$.emissions.scope2LocationBasedTCo2e").value(20506.5))
			.andExpect(jsonPath("$.emissions.marketInstruments[0].coveredKwh").value(20000000))
			.andExpect(jsonPath("$.methodology.statement").value(org.hamcrest.Matchers
				.containsString("prices the balance at the grid average, since no residual mix is available")));
		// with a residual mix of 0.5 the balance is priced at it: 26,500,000 x 0.5 = 13,250,000 kg
		reopen(inventoryId);
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/residual-mix").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"available": true, "kgCo2ePerKwh": 0.5}"""))
			.andExpect(status().isOk());
		// an instrument limited to the second half of the year covers only the second read, and one covering more
		// than the facility used in that period is flagged
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/market-factors/" + plant).with(asMember())
			.with(csrf()).contentType("application/json").content("""
					{"instrumentType": "CONTRACT", "kgCo2ePerKwh": 0, "source": "Obuom solar PPA 2025",
					 "meetsQualityCriteria": true, "coveredKwh": 20000000, "periodStart": "2025-07-01"}"""))
			.andExpect(status().isOk());
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.gates[3].findings[?(@.severity == 'WARNING')].message").value(org.hamcrest.Matchers
				.hasItem(org.hamcrest.Matchers.containsString("covers 20,000,000 kWh but the facility's scope 2 "
						+ "electricity in its period is 16,500,000 kWh"))));
		freeze(inventoryId);
		// first read: 30,000,000 x 0.5 = 15,000,000; second read: 16,500,000 covered at 0
		run(inventoryId, "Run 002").andExpect(status().isCreated())
			.andExpect(jsonPath("$.run.scope2MarketBasedKgCo2e").value(15000000.0))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + firstHalf + "')].marketBalanceBasis").value("RESIDUAL_MIX"))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + firstHalf + "')].marketNote").value(org.hamcrest.Matchers
				.hasItem(org.hamcrest.Matchers.startsWith("the facility's instrument covers 2025-07-01 to 2025-12-31"))))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + secondHalf + "')].marketCoveredKwh").value(16500000.0))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + secondHalf + "')].marketBasedKgCo2e").value(0.0));
	}

	@Test
	void anInstrumentThatFailsTheQualityCriteriaFallsBackAndTheReportSaysWhy() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var plant = createFacility(orgId, "Tema Plant");
		var plantPower = createActivity(orgId, plant, "Mill grid electricity", "1000", "kWh", "2025-07-31");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, plant);
		// a certificate sourced from another market fails criterion 5
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/market-factors/" + plant).with(asMember())
			.with(csrf()).contentType("application/json").content("""
					{"instrumentType": "CERTIFICATE", "kgCo2ePerKwh": 0, "source": "Nordic GO 2025",
					 "meetsQualityCriteria": false, "qualityNotes": "Criterion 5: sourced from the Nordic market",
					 "coveredKwh": 1000}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.qualityNotes").value("Criterion 5: sourced from the Nordic market"));
		// a residual mix that is available needs its factor
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/residual-mix").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"available": true}"""))
			.andExpect(status().isConflict());
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/residual-mix").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"available": true, "kgCo2ePerKwh": 0.35}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.residualMixKgCo2ePerKwh").value(0.35));
		prepare(inventoryId, plantPower, GRID_FACTOR);
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.gates[3].findings[0].message")
				.value(org.hamcrest.Matchers.containsString("falls back to the residual mix")));
		// location-based 441; market-based at the residual mix: 1,000 x 0.35 = 350, with the reason on the line
		var detail = body(run(inventoryId, "Run 001").andExpect(status().isCreated())
			.andExpect(jsonPath("$.run.scope2KgCo2e").value(441.0))
			.andExpect(jsonPath("$.run.scope2MarketBasedKgCo2e").value(350.0))
			.andExpect(jsonPath("$.lines[0].marketInstrument").value("RESIDUAL_MIX"))
			.andExpect(jsonPath("$.lines[0].marketNote")
				.value(org.hamcrest.Matchers.containsString("does not meet the Scope 2 Quality Criteria"))));
		mvc.perform(get("/api/ghg/runs/" + JsonPath.read(detail, "$.run.id") + "/report").with(asMember()))
			.andExpect(jsonPath("$.emissions.residualMixDisclosure")
				.value(org.hamcrest.Matchers.startsWith("An adjusted residual mix of 0.35")))
			.andExpect(jsonPath("$.emissions.marketInstruments[0].meetsQualityCriteria").value(false))
			.andExpect(jsonPath("$.methodology.statement")
				.value(org.hamcrest.Matchers.containsString("1 instrument did not meet the Scope 2 Quality Criteria")));
		// without a residual mix the location-based figure stands for that facility
		reopen(inventoryId);
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/residual-mix").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"available": false}"""))
			.andExpect(status().isOk());
		freeze(inventoryId);
		run(inventoryId, "Run 002").andExpect(status().isCreated())
			.andExpect(jsonPath("$.run.scope2MarketBasedKgCo2e").value(441.0))
			.andExpect(jsonPath("$.lines[0].marketNote")
				.value(org.hamcrest.Matchers.containsString("the location-based figure stands")));
	}

	@Test
	void hfcBlendsReportTheirMassAndTheAssessmentReportsUsed() throws Exception {
		var orgId = createOrganization("Ecoriv Holdings");
		var plant = createFacility(orgId, "Tema Plant");
		var leak = createActivity(orgId, plant, "Chiller refrigerant top-up", "10", "kg", "2025-05-01");
		var cooling = createActivity(orgId, plant, "District cooling", "1000", "kWh", "2025-06-01");
		// under AR5 the blend's source and the inventory agree: one assessment report
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, plant);
		classify(syncAndGetAssignmentId(inventoryId, leak), R410A_FACTOR);
		var listing = body(mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember())));
		classify(JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + cooling + "')].id").getFirst(),
				COOLING_FACTOR);
		// purchased cooling is scope 2 (Chapter 4)
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember()))
			.andExpect(jsonPath("$[?(@.activityId == '" + cooling + "')].scope").value("SCOPE_2"))
			.andExpect(jsonPath("$[?(@.activityId == '" + cooling + "')].category").value("PURCHASED_COOLING"));
		freeze(inventoryId);
		// 10 kg x 1,923.5 = 19,235 kg CO2e of HFCs, 10 kg of gas; 1,000 kWh x 0.12 = 120 kg scope 2
		var detail = body(run(inventoryId, "Run 001").andExpect(status().isCreated())
			.andExpect(jsonPath("$.run.byGas.hfcsKg").value(10.0))
			.andExpect(jsonPath("$.run.byGas.hfcsKgCo2e").value(19235.0))
			.andExpect(jsonPath("$.run.scope2KgCo2e").value(120.0))
			.andExpect(jsonPath("$.lines[?(@.factorName == 'Refrigerant R-410A leakage')].blendGwpSource")
				.value("AR5")));
		mvc.perform(get("/api/ghg/runs/" + JsonPath.read(detail, "$.run.id") + "/report").with(asMember()))
			.andExpect(jsonPath("$.byGas[?(@.gas == 'HFCs')].kg").value(10.0))
			.andExpect(jsonPath("$.byGas[?(@.gas == 'HFCs')].tonnes").value(0.01))
			.andExpect(jsonPath("$.byGas[?(@.gas == 'HFCs')].tCo2e").value(19.235))
			.andExpect(jsonPath("$.methodology.assessmentReports.length()").value(1))
			.andExpect(jsonPath("$.methodology.multipleAssessmentReports").value(false));
		// under AR6 the blend converts from its composition with AR6 potentials (771 and 3,740): one report
		var ar6 = body(mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/inventories").with(asMember()).with(csrf())
				.contentType("application/json").content("""
						{"name": "2025 AR6", "periodStart": "2025-01-01", "periodEnd": "2025-12-31",
						 "consolidationApproach": "OPERATIONAL_CONTROL", "gwpSet": "AR6"}"""))
			.andExpect(status().isCreated()));
		String ar6Id = JsonPath.read(ar6, "$.id");
		putBoundary(ar6Id, plant);
		classify(syncAndGetAssignmentId(ar6Id, leak), R410A_FACTOR);
		var ar6Listing = body(mvc.perform(get("/api/ghg/inventories/" + ar6Id + "/assignments").with(asMember())));
		classify(JsonPath.<List<String>>read(ar6Listing, "$[?(@.activityId == '" + cooling + "')].id").getFirst(),
				COOLING_FACTOR);
		freeze(ar6Id);
		var ar6Detail = body(run(ar6Id, "Run 001").andExpect(status().isCreated())
			.andExpect(jsonPath("$.run.byGas.hfcsKgCo2e").value(22555.0))
			.andExpect(jsonPath("$.lines[?(@.factorName == 'Refrigerant R-410A leakage')].blendGwpSource")
				.value("AR6")));
		mvc.perform(get("/api/ghg/runs/" + JsonPath.read(ar6Detail, "$.run.id") + "/report").with(asMember()))
			.andExpect(jsonPath("$.methodology.assessmentReports.length()").value(1))
			.andExpect(jsonPath("$.methodology.assessmentReports[0]").value("AR6"))
			.andExpect(jsonPath("$.methodology.multipleAssessmentReports").value(false))
			.andExpect(jsonPath("$.methodology.statement")
				.value(org.hamcrest.Matchers.containsString("converted from their component gases")));
	}

	/** Audit findings F18 and F37 (T-04): the refrigerant GWP and the fossil methane potential under AR6. */
	@Test
	void refrigerantBlendsFollowTheInventorysGwpSetAndFossilMethaneUsesAr6sFossilPotential() throws Exception {
		var orgId = createOrganization("Asante Gold Resources");
		var plant = createFacility(orgId, "Obuom Processing Plant");
		var topUp = createActivity(orgId, plant, "R-410A top-up, plant chillers", "85", "kg", "2025-08-01");
		var diesel = createActivity(orgId, plant, "Genset diesel", "1000", "litre", "2025-08-01");
		var waste = createActivity(orgId, plant, "Camp waste to landfill", "1", "tonne", "2025-08-01");
		// the library states the composition and the AR5 basis of the seeded figure
		mvc.perform(get("/api/ghg/emission-factors").with(asMember()))
			.andExpect(jsonPath("$[?(@.id == '" + R410A_FACTOR + "')].kgCo2ePerUnit").value(1923.5))
			.andExpect(jsonPath("$[?(@.id == '" + R410A_FACTOR + "')].blendComposition").value("50% HFC-32, 50% HFC-125"))
			.andExpect(jsonPath("$[?(@.id == '" + R410A_FACTOR + "')].ch4Fossil").value(true))
			.andExpect(jsonPath("$[?(@.id == '" + DIESEL_FACTOR + "')].ch4Fossil").value(true))
			.andExpect(jsonPath("$[?(@.id == '" + LANDFILL_FACTOR + "')].ch4Fossil").value(false));
		// AR5: 85 kg x (0.5 x 677 + 0.5 x 3,170) = 85 x 1,923.5 = 163,497.5 kg, about 163.5 t
		var ar5 = createInventory(orgId, "FY2025 AR5", "OPERATIONAL_CONTROL");
		putBoundary(ar5, plant);
		classify(syncAndGetAssignmentId(ar5, topUp), R410A_FACTOR);
		var listing = body(mvc.perform(get("/api/ghg/inventories/" + ar5 + "/assignments").with(asMember())));
		classify(JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + diesel + "')].id").getFirst(),
				DIESEL_FACTOR);
		classify(JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + waste + "')].id").getFirst(),
				LANDFILL_FACTOR);
		freeze(ar5);
		run(ar5, "Run 001").andExpect(status().isCreated())
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + topUp + "')].kgCo2e").value(163497.5))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + topUp + "')].kgCo2ePerUnit").value(1923.5))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + diesel + "')].kgCo2e").value(2660.0))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + waste + "')].kgCo2e").value(446.2));
		// AR6: 85 x (0.5 x 771 + 0.5 x 3,740) = 85 x 2,255.5 = 191,717.5 kg; diesel's fossil methane at 29.8
		// (2.6307 + 0.0001 x 29.8 + 0.0001 x 273 = 2.66098 per litre); landfill methane is biogenic, at 27.9
		var ar6 = body(mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/inventories").with(asMember()).with(csrf())
				.contentType("application/json").content("""
						{"name": "FY2025 AR6", "periodStart": "2025-01-01", "periodEnd": "2025-12-31",
						 "consolidationApproach": "OPERATIONAL_CONTROL", "gwpSet": "AR6"}"""))
			.andExpect(status().isCreated()));
		String ar6Id = JsonPath.read(ar6, "$.id");
		putBoundary(ar6Id, plant);
		classify(syncAndGetAssignmentId(ar6Id, topUp), R410A_FACTOR);
		var ar6Listing = body(mvc.perform(get("/api/ghg/inventories/" + ar6Id + "/assignments").with(asMember())));
		classify(JsonPath.<List<String>>read(ar6Listing, "$[?(@.activityId == '" + diesel + "')].id").getFirst(),
				DIESEL_FACTOR);
		classify(JsonPath.<List<String>>read(ar6Listing, "$[?(@.activityId == '" + waste + "')].id").getFirst(),
				LANDFILL_FACTOR);
		freeze(ar6Id);
		var detail = body(run(ar6Id, "Run 001").andExpect(status().isCreated())
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + topUp + "')].kgCo2e").value(191717.5))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + topUp + "')].kgCo2ePerUnit").value(2255.5))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + diesel + "')].kgCo2ePerUnit").value(2.66098))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + diesel + "')].kgCo2e").value(2660.98))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + waste + "')].kgCo2e").value(444.65))
			.andExpect(jsonPath("$.run.byGas.ch4Kg").value(15.6))
			.andExpect(jsonPath("$.run.byGas.ch4FossilKg").value(0.1)));
		// the by-gas table applies each potential to the methane of its origin: 0.1 x 29.8 + 15.5 x 27.9
		mvc.perform(get("/api/ghg/runs/" + JsonPath.read(detail, "$.run.id") + "/report").with(asMember()))
			.andExpect(jsonPath("$.byGas[?(@.gas == 'CH4')].kgCo2e").value(435.43))
			.andExpect(jsonPath("$.byGas[?(@.gas == 'HFCs')].kgCo2e").value(191717.5))
			.andExpect(jsonPath("$.methodology.statement")
				.value(org.hamcrest.Matchers.containsString("fossil origin is converted at 29.8")));
	}

	@Test
	void anOperationLeftOutOfTheBoundaryNeedsAReasonAndTheReportListsIt() throws Exception {
		var orgId = createOrganization("Sankofa Gold plc");
		var pit = createFacility(orgId, "Obuasi Ridge Open Pit");
		var camp = createFacility(orgId, "Nkran Exploration Camp");
		var port = createEntity(orgId, "Takoradi Port Co", "ASSOCIATE", "30", false);
		var terminal = createFacility(orgId, "Takoradi Port Loadout", port);
		var diesel = createActivity(orgId, pit, "Haul fleet diesel", "1000", "litre", "2025-06-30");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, pit);
		classify(syncAndGetAssignmentId(inventoryId, diesel), DIESEL_FACTOR);
		freeze(inventoryId);
		// two operations are neither in the boundary nor excluded with a reason: the gate blocks the run
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.ready").value(false))
			.andExpect(jsonPath("$.gates[0].findings[?(@.severity == 'ERROR')].message")
				.value(org.hamcrest.Matchers.hasItems(
						org.hamcrest.Matchers.startsWith("'Nkran Exploration Camp' (Sankofa Gold plc) is neither"),
						org.hamcrest.Matchers.startsWith("'Takoradi Port Loadout' (Takoradi Port Co) is neither"))));
		run(inventoryId, "Too early").andExpect(status().isConflict());
		reopen(inventoryId);
		// a facility in the boundary cannot be excluded
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/boundary/" + pit + "/exclude").with(asMember())
			.with(csrf()).contentType("application/json").content("""
					{"reason": "OTHER"}"""))
			.andExpect(status().isConflict());
		excludeFacility(inventoryId, camp, "NOT_APPLICABLE", "Exploration only; no fuel or power in 2025");
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/boundary/entities/" + port + "/exclude").with(asMember())
			.with(csrf()).contentType("application/json").content("""
					{"reason": "METHODOLOGY", "detail": "Associate: no operational control"}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.inBoundary").value(false))
			.andExpect(jsonPath("$.exclusion.reason").value("METHODOLOGY"))
			.andExpect(jsonPath("$.facilities[0].inBoundary").value(false));
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/boundary/exclusions").with(asMember()))
			.andExpect(jsonPath("$.length()").value(2));
		freeze(inventoryId);
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.gates[0].status").value("PASSED"));
		// the version copies the exclusions and the report prints them beside the record exclusions
		var detail = body(run(inventoryId, "Run 001").andExpect(status().isCreated()));
		mvc.perform(get("/api/ghg/runs/" + JsonPath.read(detail, "$.run.id") + "/report").with(asMember()))
			.andExpect(jsonPath("$.boundaryExclusions.length()").value(2))
			.andExpect(jsonPath("$.boundaryExclusions[?(@.facilityName == 'Nkran Exploration Camp')].reason")
				.value("NOT_APPLICABLE"))
			.andExpect(jsonPath("$.boundaryExclusions[?(@.entityName == 'Takoradi Port Co')].detail")
				.value("Associate: no operational control"))
			.andExpect(jsonPath("$.company.boundaryVersion.exclusions.length()").value(2));
		// ticking an operation in retires the exclusion that covered it
		reopen(inventoryId);
		putBoundary(inventoryId, camp);
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/boundary/exclusions").with(asMember()))
			.andExpect(jsonPath("$.length()").value(1))
			.andExpect(jsonPath("$[0].entityName").value("Takoradi Port Co"));
		// a correction inherits the exclusions of the published inventory
		freeze(inventoryId);
		String finalRun = runAndGetId(inventoryId, "Run 002");
		mvc.perform(post("/api/ghg/runs/" + finalRun + "/finalize").with(asMember()).with(csrf()))
			.andExpect(status().isOk());
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/publish").with(asMember()).with(csrf()))
			.andExpect(status().isOk());
		var successor = body(mvc
			.perform(post("/api/ghg/inventories/" + inventoryId + "/supersede").with(asMember()).with(csrf())
				.contentType("application/json").content("""
						{"reason": "Restated to carry the exclusion forward"}"""))
			.andExpect(status().isCreated()));
		mvc.perform(get("/api/ghg/inventories/" + JsonPath.read(successor, "$.id") + "/boundary/exclusions")
			.with(asMember()))
			.andExpect(jsonPath("$.length()").value(1));
	}

	@Test
	void theReportPrintsTheOperationalBoundaryDeclarationInTheStandardsOrder() throws Exception {
		var orgId = createOrganization("Sankofa Gold plc");
		var pit = createFacility(orgId, "Obuasi Ridge Open Pit");
		var diesel = createActivity(orgId, pit, "Haul fleet diesel", "1000", "litre", "2025-06-30");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, pit);
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/operational-boundary").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"scope3Categories": ["BUSINESS_TRAVEL", "WASTE_GENERATED"],
					 "exclusionsRationale": "Other scope 3 categories are immaterial for a single-mine group."}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.scope3Categories[0]").value("BUSINESS_TRAVEL"));
		// a scope 1 category is not a scope 3 declaration
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/operational-boundary").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"scope3Categories": ["MOBILE_COMBUSTION"]}"""))
			.andExpect(status().isConflict());
		prepare(inventoryId, diesel, DIESEL_FACTOR);
		String runId = runAndGetId(inventoryId, "Run 001");

		mvc.perform(get("/api/ghg/runs/" + runId + "/report").with(asMember()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.company.organizationName").value("Sankofa Gold plc"))
			.andExpect(jsonPath("$.company.consolidationApproach").value("OPERATIONAL_CONTROL"))
			.andExpect(jsonPath("$.company.boundaryVersion.version.versionNo").value(1))
			.andExpect(jsonPath("$.operationalBoundary.scopesCovered[0]").value("SCOPE_1"))
			.andExpect(jsonPath("$.operationalBoundary.scope3Categories.length()").value(2))
			.andExpect(jsonPath("$.operationalBoundary.exclusionsRationale")
				.value(org.hamcrest.Matchers.startsWith("Other scope 3 categories")))
			.andExpect(jsonPath("$.period.periodStart").value("2025-01-01"))
			.andExpect(jsonPath("$.emissions.totalKgCo2e").value(2660.0))
			.andExpect(jsonPath("$.byGas.length()").value(7))
			.andExpect(jsonPath("$.baseYear").doesNotExist())
			.andExpect(jsonPath("$.methodology.statement")
				.value(org.hamcrest.Matchers.containsString("Table 1")))
			.andExpect(jsonPath("$.lines.length()").value(1));
	}

	/** A record covering a period (spec 04.2). */
	String createPeriodActivity(String orgId, String facilityId, String type, String quantity, String unit,
			String start, String end) throws Exception {
		var result = mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/activities").with(asMember()).with(csrf())
				.contentType("application/json")
				.content("""
						{"facilityId": "%s", "activityType": "%s", "quantity": %s, "unit": "%s",
						 "periodStart": "%s", "periodEnd": "%s", "evidenceRef": "INV-1", "dataQuality": "MEASURED"}"""
					.formatted(facilityId, type, quantity, unit, start, end)))
			.andExpect(status().isCreated())
			.andReturn();
		return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
	}

	/** Audit findings F9 and F24 (T-07): periods, cut-off, pro-rating, coverage and period labels. */
	@Test
	void aRecordStraddlingTheMembershipWindowIsProRatedOrBlocked() throws Exception {
		var orgId = createOrganization("Asante Gold Resources");
		var tarkwa = createEntity(orgId, "Tarkwa Mine Ltd", "SUBSIDIARY", "100", true);
		var pit = createFacility(orgId, "Tarkwa Pit", tarkwa);
		// a period end before its start is refused
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/activities").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"facilityId": "%s", "activityType": "Backwards", "quantity": 1, "unit": "litre",
					 "periodStart": "2025-12-31", "periodEnd": "2025-01-01", "dataQuality": "MEASURED"}""".formatted(pit)))
			.andExpect(status().is(422));
		// the annual diesel total, and a meter read straddling year-end
		var annual = createPeriodActivity(orgId, pit, "Haul fleet diesel", "100000", "litre", "2025-01-01", "2025-12-31");
		var straddle = createPeriodActivity(orgId, pit, "Camp LPG", "1000", "litre", "2025-12-16", "2026-01-15");
		var before = createPeriodActivity(orgId, pit, "Pre-acquisition diesel", "500", "litre", "2025-03-01", "2025-03-31");
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/activities").with(asMember()))
			.andExpect(jsonPath("$[?(@.id == '" + annual + "')].periodStart").value("2025-01-01"))
			.andExpect(jsonPath("$[?(@.id == '" + annual + "')].periodEnd").value("2025-12-31"));
		// an 18-month inventory is allowed but warned about; the label is a fiscal year
		var odd = createInventory(orgId, "Long period", "OPERATIONAL_CONTROL", "2025-01-01", "2026-06-30");
		mvc.perform(get("/api/ghg/inventories/" + odd).with(asMember()))
			.andExpect(jsonPath("$.periodLabel").value("FY2025/26"))
			.andExpect(jsonPath("$.straddleTreatment").value("PRO_RATE"));
		mvc.perform(get("/api/ghg/inventories/" + odd + "/validation").with(asMember()))
			.andExpect(jsonPath("$.gates[0].findings[?(@.severity == 'WARNING')].message").value(org.hamcrest.Matchers
				.hasItem(org.hamcrest.Matchers.containsString("is not twelve months (18 months)"))));
		// Tarkwa acquired on 1 July 2025
		var inventoryId = createInventory(orgId, "FY2025", "OPERATIONAL_CONTROL");
		mvc.perform(get("/api/ghg/inventories/" + inventoryId).with(asMember()))
			.andExpect(jsonPath("$.periodLabel").value("2025"));
		putBoundary(inventoryId, pit, """
				{"effectiveFrom": "2025-07-01"}""");
		// review: the March record is wholly before the window (excluded); the annual and year-end records overlap
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/assignments/sync").with(asMember()).with(csrf()))
			.andExpect(status().isOk());
		var listing = body(mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember()))
			.andExpect(jsonPath("$[?(@.activityId == '" + before + "')].exclusionReason").value("OUTSIDE_BOUNDARY"))
			.andExpect(jsonPath("$[?(@.activityId == '" + annual + "')].included").value(true))
			.andExpect(jsonPath("$[?(@.activityId == '" + straddle + "')].included").value(true)));
		classify(JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + annual + "')].id").getFirst(),
				DIESEL_FACTOR);
		classify(JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + straddle + "')].id").getFirst(),
				DIESEL_FACTOR);
		// coverage: diesel every month from the annual record; LPG in December only
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/coverage").with(asMember()))
			.andExpect(jsonPath("$.length()").value(2))
			.andExpect(jsonPath("$[?(@.activityType == 'Haul fleet diesel')].coveredMonths.length()").value(12))
			.andExpect(jsonPath("$[?(@.activityType == 'Camp LPG')].coveredMonths[0]").value("2025-12"))
			.andExpect(jsonPath("$[?(@.activityType == 'Camp LPG')].months.length()").value(12));
		freeze(inventoryId);
		// the gate warns about both straddling records
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.ready").value(true))
			.andExpect(jsonPath("$.gates[1].findings[?(@.severity == 'WARNING')].message").value(org.hamcrest.Matchers
				.hasItems(org.hamcrest.Matchers.containsString("184 of 365 days fall inside the reporting period and "
						+ "the membership window: the run pro-rates it to 50.41%"),
						org.hamcrest.Matchers.containsString("16 of 31 days"))));
		// annual: 100,000 x 184/365 = 50,410.959 litre x 2.66 = 134,093.151 kg; year-end read: 1,000 x 16/31 x 2.66
		run(inventoryId, "Run 001").andExpect(status().isCreated())
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + annual + "')].periodShare").value(0.50411))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + annual + "')].coveredDays").value(184))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + annual + "')].periodDays").value(365))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + annual + "')].kgCo2e").value(134093.26))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + annual + "')].periodNote").value(org.hamcrest.Matchers
				.hasItem(org.hamcrest.Matchers.startsWith("pro-rated: 184 of 365 days"))))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + straddle + "')].kgCo2e").value(1372.903))
			.andExpect(jsonPath("$.exclusions[0].periodStart").value("2025-03-01"))
			.andExpect(jsonPath("$.exclusions[0].periodEnd").value("2025-03-31"));
		// under BLOCK the same records block the run until split or excluded
		reopen(inventoryId);
		mvc.perform(put("/api/ghg/inventories/" + inventoryId).with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"name": "FY2025", "periodStart": "2025-01-01", "periodEnd": "2025-12-31",
					 "consolidationApproach": "OPERATIONAL_CONTROL", "straddleTreatment": "BLOCK"}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.straddleTreatment").value("BLOCK"));
		freeze(inventoryId);
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.ready").value(false))
			.andExpect(jsonPath("$.gates[1].findings[?(@.severity == 'ERROR')].message").value(org.hamcrest.Matchers
				.hasItem(org.hamcrest.Matchers.containsString("split the record at the cut-off or exclude it"))));
		run(inventoryId, "Blocked").andExpect(status().isConflict());
	}

	/** Audit findings F39, F40, F43, F44 (T-08): breakdown tables, the factor table and the report header. */
	@Test
	void theReportBreaksEmissionsDownAndPrintsItsFactorsAndHeader() throws Exception {
		var organization = body(mvc
			.perform(post("/api/ghg/organizations").with(asMember()).with(csrf()).contentType("application/json")
				.content("""
						{"name": "Asante Gold Resources", "address": "12 Liberation Road, Accra",
						 "contact": "sustainability@asante.example"}"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.address").value("12 Liberation Road, Accra")));
		String orgId = JsonPath.read(organization, "$.id");
		var tarkwa = createEntity(orgId, "Tarkwa Mine Ltd", "SUBSIDIARY", "100", true);
		var obuom = body(mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/facilities").with(asMember()).with(csrf())
				.contentType("application/json").content("""
						{"name": "Obuom Processing Plant", "location": "Obuom", "country": "gh"}"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.country").value("GH")));
		String obuomId = JsonPath.read(obuom, "$.id");
		var pit = createFacility(orgId, "Tarkwa Pit", tarkwa);
		var power = createActivity(orgId, obuomId, "Mill grid electricity", "1000", "kWh", "2025-06-30");
		var diesel = createActivity(orgId, pit, "Haul fleet diesel", "1000", "litre", "2025-06-30");
		var travel = createActivity(orgId, obuomId, "Staff flights", "10000", "passenger-km", "2025-06-30");
		var inventoryId = createInventory(orgId, "FY2025", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, obuomId);
		putBoundary(inventoryId, pit);
		classify(syncAndGetAssignmentId(inventoryId, power), GRID_FACTOR);
		var listing = body(mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember())));
		classify(JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + diesel + "')].id").getFirst(),
				DIESEL_FACTOR);
		classify(JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + travel + "')].id").getFirst(),
				"c4a1f001-0000-4000-8000-000000000010");
		// the header the accountant types: an approver override, assurance, an intensity denominator
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/report-metadata").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"approvedBy": "Ama Mensah, Sustainability Lead", "assuranceLevel": "LIMITED",
					 "assuranceProvider": "Verify Ghana Ltd", "assuranceStatement": "VG-2026-014",
					 "intensityMetrics": [{"name": "Gold produced", "value": 1000, "unit": "oz"}]}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.assuranceLevel").value("LIMITED"))
			.andExpect(jsonPath("$.approvedBy").value("Ama Mensah, Sustainability Lead"));
		freeze(inventoryId);
		String runId = runAndGetId(inventoryId, "Run 001");
		// scope 1 diesel 2,660; scope 2 electricity 441; scope 3 flights 10,000 x 0.195 = 1,950; total 5,051 kg
		mvc.perform(get("/api/ghg/runs/" + runId + "/report").with(asMember()))
			.andExpect(jsonPath("$.header.organizationName").value("Asante Gold Resources"))
			.andExpect(jsonPath("$.header.address").value("12 Liberation Road, Accra"))
			.andExpect(jsonPath("$.header.contact").value("sustainability@asante.example"))
			.andExpect(jsonPath("$.header.periodLabel").value("2025"))
			.andExpect(jsonPath("$.header.preparedBy").value("kojo@ecoriv.com"))
			.andExpect(jsonPath("$.header.approvedBy").value("Ama Mensah, Sustainability Lead"))
			.andExpect(jsonPath("$.header.version").value(1))
			.andExpect(jsonPath("$.header.assuranceLevel").value("LIMITED"))
			.andExpect(jsonPath("$.header.assuranceProvider").value("Verify Ghana Ltd"))
			.andExpect(jsonPath("$.byScope3Category.length()").value(1))
			.andExpect(jsonPath("$.byScope3Category[0].category").value("BUSINESS_TRAVEL"))
			.andExpect(jsonPath("$.byScope3Category[0].tCo2e").value(1.95))
			.andExpect(jsonPath("$.byFacility[0].name").value("Tarkwa Pit"))
			.andExpect(jsonPath("$.byFacility[0].scope1KgCo2e").value(2660.0))
			.andExpect(jsonPath("$.byFacility[1].name").value("Obuom Processing Plant"))
			.andExpect(jsonPath("$.byFacility[1].scope2KgCo2e").value(441.0))
			.andExpect(jsonPath("$.byFacility[1].scope3KgCo2e").value(1950.0))
			.andExpect(jsonPath("$.byEntity[?(@.name == 'Tarkwa Mine Ltd')].totalKgCo2e").value(2660.0))
			.andExpect(jsonPath("$.byEntity[?(@.name == 'Asante Gold Resources')].totalKgCo2e").value(2391.0))
			.andExpect(jsonPath("$.byCountry[?(@.name == 'GH')].totalKgCo2e").value(2391.0))
			.andExpect(jsonPath("$.byCountry[?(@.name == 'not recorded')].totalKgCo2e").value(2660.0))
			.andExpect(jsonPath("$.factors.length()").value(3))
			.andExpect(jsonPath("$.factors[?(@.name == 'Diesel (100%% mineral diesel)')].kgCo2ePerUnit").value(2.66))
			.andExpect(jsonPath("$.factors[?(@.name == 'Diesel (100%% mineral diesel)')].co2").value(2.6307))
			.andExpect(jsonPath("$.factors[?(@.name == 'Diesel (100%% mineral diesel)')].ch4Fossil").value(true))
			.andExpect(jsonPath("$.factors[?(@.name == 'Diesel (100%% mineral diesel)')].gwpSet").value("AR5"))
			.andExpect(jsonPath("$.factors[?(@.name == 'Diesel (100%% mineral diesel)')].source").value(org.hamcrest.Matchers.hasItem(org.hamcrest.Matchers.startsWith("UK Government GHG Conversion Factors"))))
			// 5.051 t over 1,000 oz
			.andExpect(jsonPath("$.intensity[0].tCo2ePerUnit").value(0.005051))
			.andExpect(jsonPath("$.lines[?(@.facilityName == 'Obuom Processing Plant')].country").value(
					org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.equalTo("GH"))));
		// publication records the publisher; a correction is version 2 and names what it supersedes
		mvc.perform(post("/api/ghg/runs/" + runId + "/finalize").with(asMember()).with(csrf())).andExpect(status().isOk());
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/publish").with(asMember()).with(csrf()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.publishedBy").value("kojo@ecoriv.com"));
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/report-metadata").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"assuranceLevel": "REASONABLE", "intensityMetrics": []}"""))
			.andExpect(status().isConflict());
		var correction = body(mvc
			.perform(post("/api/ghg/inventories/" + inventoryId + "/supersede").with(asMember()).with(csrf())
				.contentType("application/json").content("""
						{"name": "FY2025 (restated)", "reason": "Restated after the final review"}"""))
			.andExpect(status().isCreated()));
		String correctionId = JsonPath.read(correction, "$.id");
		mvc.perform(get("/api/ghg/runs/" + runId + "/report").with(asMember()))
			.andExpect(jsonPath("$.header.publishedBy").value("kojo@ecoriv.com"))
			.andExpect(jsonPath("$.header.supersededBy").value("FY2025 (restated)"));
		// the correction inherits the boundary; classify its records again (ticket T-12 will carry them over)
		classify(syncAndGetAssignmentId(correctionId, power), GRID_FACTOR);
		var restatedListing = body(mvc.perform(get("/api/ghg/inventories/" + correctionId + "/assignments").with(asMember())));
		classify(JsonPath.<List<String>>read(restatedListing, "$[?(@.activityId == '" + diesel + "')].id").getFirst(),
				DIESEL_FACTOR);
		classify(JsonPath.<List<String>>read(restatedListing, "$[?(@.activityId == '" + travel + "')].id").getFirst(),
				"c4a1f001-0000-4000-8000-000000000010");
		freeze(correctionId);
		String restated = runAndGetId(correctionId, "Run 001");
		mvc.perform(get("/api/ghg/runs/" + restated + "/report").with(asMember()))
			.andExpect(jsonPath("$.header.version").value(2))
			.andExpect(jsonPath("$.header.supersedes[0]").value("FY2025"));
	}

	/** Audit finding F38 (T-06): the report as a PDF, the lines as CSV, and the frozen inputs as JSON. */
	@Test
	void aRunExportsAPdfACsvAndItsFrozenInputs() throws Exception {
		var orgId = createOrganization("Asante Gold Resources");
		var plant = createFacility(orgId, "Obuom Processing Plant");
		var diesel = createActivity(orgId, plant, "Genset diesel", "1000", "litre", "2025-08-01");
		var power = createActivity(orgId, plant, "Mill grid electricity", "1000", "kWh", "2025-08-01");
		var inventoryId = createInventory(orgId, "FY2025", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, plant);
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/market-factors/" + plant).with(asMember())
			.with(csrf()).contentType("application/json").content("""
					{"instrumentType": "CERTIFICATE", "kgCo2ePerKwh": 0.05, "source": "Supplier REC 2025",
					 "meetsQualityCriteria": true, "coveredKwh": 400}"""))
			.andExpect(status().isOk());
		classify(syncAndGetAssignmentId(inventoryId, diesel), DIESEL_FACTOR);
		var listing = body(mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember())));
		classify(JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + power + "')].id").getFirst(),
				GRID_FACTOR);
		freeze(inventoryId);
		String runId = runAndGetId(inventoryId, "Run 001");

		// the PDF: a document with the organization and the period in its name
		var pdf = mvc.perform(get("/api/ghg/runs/" + runId + "/report.pdf").with(asMember()))
			.andExpect(status().isOk())
			.andExpect(header().string("Content-Type", "application/pdf"))
			.andExpect(header().string("Content-Disposition",
					org.hamcrest.Matchers.containsString("asante-gold-resources-2025-run-1.pdf")))
			.andReturn()
			.getResponse()
			.getContentAsByteArray();
		assertThat(new String(pdf, 0, 5, java.nio.charset.StandardCharsets.ISO_8859_1)).isEqualTo("%PDF-");
		assertThat(pdf.length).isGreaterThan(2000);

		// the calculation file: a header row, then one row per line with record id, evidence and factor id
		var csv = body(mvc.perform(get("/api/ghg/runs/" + runId + "/lines.csv").with(asMember()))
			.andExpect(status().isOk())
			.andExpect(header().string("Content-Type", org.hamcrest.Matchers.startsWith("text/csv"))));
		var rows = csv.split("\r\n");
		assertThat(rows[0]).startsWith("line_id,record_id,facility_id,facility,legal_entity,country,activity_type,evidence_ref,"
				+ "period_start,period_end,scope,category,lease_type,quantity,unit,factor_id,factor,factor_unit,"
				+ "converted_quantity,conversion_factor,kg_co2e_per_unit,gwp_set,accounting_share,period_days,"
				+ "covered_days,period_share,kg_co2e,");
		assertThat(rows).hasSize(3);
		var dieselRow = java.util.Arrays.stream(rows).filter(row -> row.contains("Genset diesel")).findFirst().orElseThrow();
		assertThat(dieselRow).contains("," + diesel + ",").contains(",INV-2938,").contains("," + DIESEL_FACTOR + ",")
			.contains(",2660,").contains(",AR5,");
		// byte-identical on a second download
		assertThat(body(mvc.perform(get("/api/ghg/runs/" + runId + "/lines.csv").with(asMember())))).isEqualTo(csv);
		mvc.perform(get("/api/ghg/runs/" + runId + "/exclusions.csv").with(asMember()))
			.andExpect(status().isOk())
			.andExpect(content().string(org.hamcrest.Matchers.startsWith("record_id,facility,activity_type,")));

		// the frozen inputs: the boundary version, the factor set and the instrument as recorded
		var inputs = body(mvc.perform(get("/api/ghg/runs/" + runId + "/inputs.json").with(asMember()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.runNo").value(1))
			.andExpect(jsonPath("$.gwpSet").value("AR5"))
			.andExpect(jsonPath("$.boundaryVersion.version.versionNo").value(1))
			.andExpect(jsonPath("$.boundaryVersion.entries[0].entityName").value("Asante Gold Resources"))
			.andExpect(jsonPath("$.factors.length()").value(2))
			.andExpect(jsonPath("$.factors[?(@.name == 'Diesel (100%% mineral diesel)')].kgCo2ePerUnit").value(2.66))
			.andExpect(jsonPath("$.instruments[0].coveredKwh").value(400))
			.andExpect(jsonPath("$.residualMixAvailable").doesNotExist()));
		assertThat(body(mvc.perform(get("/api/ghg/runs/" + runId + "/inputs.json").with(asMember())))).isEqualTo(inputs);
		// tenant-scoped like the report
		mvc.perform(get("/api/ghg/runs/" + runId + "/report.pdf").with(asOutsider())).andExpect(status().isNotFound());
		mvc.perform(get("/api/ghg/runs/" + runId + "/lines.csv").with(asOutsider())).andExpect(status().isNotFound());
	}

	/** Audit findings F17, F19, F20, F51 (T-03): organization factors with provenance, approval, and packs. */
	@Test
	void anOrganizationAddsItsOwnFactorsAndImportsAPack() throws Exception {
		var orgId = createOrganization("Asante Gold Resources");
		var plant = createFacility(orgId, "Obuom Processing Plant");
		// the seeded library cites its sources; the district cooling assumption is not approved
		var library = body(mvc.perform(get("/api/ghg/emission-factors").with(asMember()))
			.andExpect(jsonPath("$[?(@.id == '" + DIESEL_FACTOR + "')].source")
				.value(org.hamcrest.Matchers.hasItem(org.hamcrest.Matchers.startsWith("UK Government GHG Conversion Factors"))))
			.andExpect(jsonPath("$[?(@.id == '" + DIESEL_FACTOR + "')].publicationYear").value(2025))
			.andExpect(jsonPath("$[?(@.id == '" + GRID_FACTOR + "')].co2eOnly").value(false))
			.andExpect(jsonPath("$[?(@.id == '" + COOLING_FACTOR + "')].source")
				.value(org.hamcrest.Matchers.hasItem(org.hamcrest.Matchers.startsWith("Ecoriv assumption")))));
		assertThat(JsonPath.<List<Object>>read(library, "$[*].organizationId")).containsOnlyNulls();
		// a supplier-specific factor with its provenance, unapproved until the sustainability lead signs it off
		var hfo = body(mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/emission-factors").with(asMember()).with(csrf())
				.contentType("application/json").content("""
						{"name": "Heavy fuel oil (GOIL analysis 2025)", "defaultScope": "SCOPE_1",
						 "defaultCategory": "STATIONARY_COMBUSTION", "scopeAgnostic": true, "unit": "tonne",
						 "kgCo2ePerUnit": 3230, "co2KgPerUnit": 3216.4, "ch4KgPerUnit": 0.19, "n2oKgPerUnit": 0.027,
						 "source": "GOIL fuel analysis certificate 2025-03", "sourceUrl": "https://example.test/goil",
						 "publicationYear": 2025, "dataYear": 2025, "validFrom": "2025-01-01", "validTo": "2025-12-31",
						 "approved": false}"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.organizationId").value(orgId))
			.andExpect(jsonPath("$.approved").value(false))
			.andExpect(jsonPath("$.validTo").value("2025-12-31")));
		String hfoId = JsonPath.read(hfo, "$.id");
		// an unregistered unit is refused; a library factor cannot be edited; another tenant cannot see the factor
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/emission-factors").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"name": "Drums", "defaultScope": "SCOPE_1", "defaultCategory": "STATIONARY_COMBUSTION",
					 "unit": "drum", "kgCo2ePerUnit": 500, "source": "Site estimate"}"""))
			.andExpect(status().isConflict());
		mvc.perform(post("/api/ghg/emission-factors/" + DIESEL_FACTOR + "/unapprove").with(asMember()).with(csrf()))
			.andExpect(status().isConflict());
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/emission-factors").with(asOutsider()))
			.andExpect(status().isNotFound());
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/emission-factors").with(asMember()))
			.andExpect(jsonPath("$[?(@.id == '" + hfoId + "')].name").value("Heavy fuel oil (GOIL analysis 2025)"))
			.andExpect(jsonPath("$[?(@.id == '" + DIESEL_FACTOR + "')]").isNotEmpty());
		// the gate blocks a run on an unapproved factor; approval clears it
		var fuel = createActivity(orgId, plant, "HFO burned in the power plant", "10", "tonne", "2025-06-30");
		var inventoryId = createInventory(orgId, "FY2025", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, plant);
		classify(syncAndGetAssignmentId(inventoryId, fuel), hfoId);
		freeze(inventoryId);
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.gates[3].status").value("BLOCKED"))
			.andExpect(jsonPath("$.gates[3].findings[?(@.severity == 'ERROR')].message").value(org.hamcrest.Matchers
				.hasItem(org.hamcrest.Matchers.containsString("which is not approved"))));
		mvc.perform(post("/api/ghg/emission-factors/" + hfoId + "/approve").with(asMember()).with(csrf()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.approved").value(true));
		// the split rules: 10 t x (3,216.4 + 0.19 x 28 + 0.027 x 265) = 32,288.75 kg, not the stated 3,230 total,
		// and the factor is in the run's frozen factor set with its source
		var runId = runAndGetId(inventoryId, "Run 001");
		mvc.perform(get("/api/ghg/runs/" + runId + "/report").with(asMember()))
			.andExpect(jsonPath("$.run.scope1KgCo2e").value(32288.75))
			.andExpect(jsonPath("$.factors[?(@.name == 'Heavy fuel oil (GOIL analysis 2025)')].source")
				.value("GOIL fuel analysis certificate 2025-03"));
		// a factor a run applied cannot be deleted
		mvc.perform(delete("/api/ghg/emission-factors/" + hfoId).with(asMember()).with(csrf()))
			.andExpect(status().isConflict());
		// the packs: the mining pack imports its factors, twice over without duplicates
		mvc.perform(get("/api/ghg/factor-packs").with(asMember()))
			.andExpect(jsonPath("$[?(@.id == 'defra-2026')].factorCount").value(org.hamcrest.Matchers.hasItem(
					org.hamcrest.Matchers.greaterThan(1000))))
			.andExpect(jsonPath("$[?(@.id == 'sector-mining')]").isNotEmpty())
			.andExpect(jsonPath("$[?(@.id == 'refrigerants-ar5')]").isNotEmpty());
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/factor-packs/sector-mining/import").with(asMember())
			.with(csrf()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.created").value(org.hamcrest.Matchers.greaterThan(40)))
			.andExpect(jsonPath("$.updated").value(0));
		var again = body(mvc.perform(post("/api/ghg/organizations/" + orgId + "/factor-packs/sector-mining/import")
			.with(asMember()).with(csrf())).andExpect(jsonPath("$.created").value(0)));
		assertThat(JsonPath.<Integer>read(again, "$.updated")).isGreaterThan(40);
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/factor-packs/no-such-pack/import").with(asMember())
			.with(csrf())).andExpect(status().isNotFound());
		// an imported blend follows the inventory's GWP set: R-407C is 23% HFC-32, 25% HFC-125, 52% HFC-134a
		var factors = body(mvc.perform(get("/api/ghg/organizations/" + orgId + "/emission-factors").with(asMember())));
		String r407c = JsonPath.<List<String>>read(factors, "$[?(@.name == 'Refrigerant R-407C leakage')].id").getFirst();
		assertThat(JsonPath.<List<String>>read(factors, "$[?(@.name == 'Refrigerant R-407C leakage')].blendComposition")
			.getFirst()).isEqualTo("23% HFC-32, 25% HFC-125, 52% HFC-134a");
		assertThat(JsonPath.<List<String>>read(factors, "$[?(@.name == 'Refrigerant R-407C leakage')].pack").getFirst())
			.isEqualTo("sector-mining");
		assertThat(JsonPath.<List<Boolean>>read(factors, "$[?(@.name == 'Grid electricity T&D losses, Ghana (derived)')].approved")
			.getFirst()).isFalse();
		var leak = createActivity(orgId, plant, "R-407C top-up", "10", "kg", "2025-08-01");
		var ar6 = body(mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/inventories").with(asMember()).with(csrf())
				.contentType("application/json").content("""
						{"name": "FY2025 AR6", "periodStart": "2025-01-01", "periodEnd": "2025-12-31",
						 "consolidationApproach": "OPERATIONAL_CONTROL", "gwpSet": "AR6"}"""))
			.andExpect(status().isCreated()));
		String ar6Id = JsonPath.read(ar6, "$.id");
		putBoundary(ar6Id, plant);
		classify(syncAndGetAssignmentId(ar6Id, leak), r407c);
		var ar6Listing = body(mvc.perform(get("/api/ghg/inventories/" + ar6Id + "/assignments").with(asMember())));
		mvc.perform(put("/api/ghg/assignments/" + JsonPath.<List<String>>read(ar6Listing, "$[?(@.activityId == '" + fuel + "')].id").getFirst()
				+ "/exclude").with(asMember()).with(csrf()).contentType("application/json").content("""
						{"reason": "NOT_APPLICABLE", "justification": "not a source of this inventory", "estimatedKgCo2e": 0}"""))
			.andExpect(status().isOk());
		freeze(ar6Id);
		// AR6: 0.23 x 771 + 0.25 x 3,740 + 0.52 x 1,530 = 177.33 + 935 + 795.6 = 1,907.93 per kg; 10 kg = 19,079.3
		run(ar6Id, "Run 001").andExpect(status().isCreated())
			.andExpect(jsonPath("$.lines[0].kgCo2ePerUnit").value(1907.93))
			.andExpect(jsonPath("$.lines[0].kgCo2e").value(19079.3))
			.andExpect(jsonPath("$.lines[0].blendGwpSource").value("AR6"));
	}

	/** Audit findings F1 and F2 (T-22): members, roles and attribution. */
	@Test
	void membersSeeTheOrganizationAndActWithinTheirRole() throws Exception {
		var abena = userService.create("abena@client.test", "Abena Owusu", com.carbonos.user.internal.UserRole.MEMBER,
				"analyst-passw0rd");
		var kofi = userService.create("kofi@verify.test", "Kofi Verifier", com.carbonos.user.internal.UserRole.MEMBER,
				"verifier-passw0rd");
		var orgId = createOrganization("Asante Gold Resources");
		var plant = createFacility(orgId, "Obuom Processing Plant");
		var diesel = createActivity(orgId, plant, "Genset diesel", "1000", "litre", "2025-08-01");
		// the creator is the owner; nobody else sees the organization yet
		mvc.perform(get("/api/ghg/organizations/" + orgId).with(asMember()))
			.andExpect(jsonPath("$.myRole").value("OWNER"));
		mvc.perform(get("/api/ghg/organizations").with(as(abena))).andExpect(jsonPath("$.length()").value(0));
		mvc.perform(get("/api/ghg/organizations/" + orgId).with(as(abena))).andExpect(status().isNotFound());
		// only an owner adds members, by the email of an existing account
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/members").with(as(abena)).with(csrf())
			.contentType("application/json").content("""
					{"email": "abena@client.test", "role": "PREPARER"}"""))
			.andExpect(status().isNotFound());
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/members").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"email": "nobody@client.test", "role": "PREPARER"}"""))
			.andExpect(status().isNotFound());
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/members").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"email": "Abena@Client.test", "role": "PREPARER"}"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.displayName").value("Abena Owusu"))
			.andExpect(jsonPath("$.role").value("PREPARER"));
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/members").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"email": "kofi@verify.test", "role": "VERIFIER"}"""))
			.andExpect(status().isCreated());
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/members").with(asMember()))
			.andExpect(jsonPath("$.length()").value(3))
			.andExpect(jsonPath("$[0].role").value("OWNER"));
		// the preparer sees the organization, classifies and freezes, each act under her email
		mvc.perform(get("/api/ghg/organizations").with(as(abena)))
			.andExpect(jsonPath("$[0].name").value("Asante Gold Resources"))
			.andExpect(jsonPath("$[0].myRole").value("PREPARER"));
		var inventoryId = createInventory(orgId, "FY2025", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, plant);
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/assignments/sync").with(as(abena)).with(csrf()))
			.andExpect(status().isOk());
		var listing = body(mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(as(abena))));
		String assignment = JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + diesel + "')].id").getFirst();
		mvc.perform(put("/api/ghg/assignments/" + assignment + "/classify").with(as(abena)).with(csrf())
			.contentType("application/json").content("""
					{"emissionFactorId": "%s"}""".formatted(DIESEL_FACTOR)))
			.andExpect(status().isOk());
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/freeze").with(as(abena)).with(csrf()))
			.andExpect(status().isOk());
		String runId = JsonPath.read(body(mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/runs").with(as(abena))
			.with(csrf()).contentType("application/json").content("""
					{"label": "Run 001"}"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.run.createdBy").value("abena@client.test"))), "$.run.id");
		// a preparer cannot designate a final run or publish; a verifier cannot write at all
		mvc.perform(post("/api/ghg/runs/" + runId + "/finalize").with(as(abena)).with(csrf()))
			.andExpect(status().isForbidden())
			.andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("REVIEWER or OWNER")));
		mvc.perform(get("/api/ghg/runs/" + runId + "/report").with(as(kofi))).andExpect(status().isOk());
		mvc.perform(get("/api/ghg/runs/" + runId + "/lines.csv").with(as(kofi))).andExpect(status().isOk());
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/reopen").with(as(kofi)).with(csrf()))
			.andExpect(status().isForbidden())
			.andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("PREPARER, REVIEWER or OWNER")));
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/activities").with(as(kofi)).with(csrf())
			.contentType("application/json").content("""
					{"facilityId": "%s", "activityType": "Probe", "quantity": 1, "unit": "litre",
					 "periodStart": "2025-08-01", "periodEnd": "2025-08-01", "dataQuality": "MEASURED"}""".formatted(plant)))
			.andExpect(status().isForbidden());
		// promoted to reviewer, she publishes; the report names her as preparer and publisher
		var members = body(mvc.perform(get("/api/ghg/organizations/" + orgId + "/members").with(asMember())));
		String abenaMember = JsonPath.<List<String>>read(members, "$[?(@.email == 'abena@client.test')].id").getFirst();
		String ownerMember = JsonPath.<List<String>>read(members, "$[?(@.role == 'OWNER')].id").getFirst();
		mvc.perform(put("/api/ghg/organizations/" + orgId + "/members/" + abenaMember).with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"role": "REVIEWER"}"""))
			.andExpect(status().isOk());
		mvc.perform(post("/api/ghg/runs/" + runId + "/finalize").with(as(abena)).with(csrf())).andExpect(status().isOk());
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/publish").with(as(abena)).with(csrf()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.publishedBy").value("abena@client.test"));
		mvc.perform(get("/api/ghg/runs/" + runId + "/report").with(asMember()))
			.andExpect(jsonPath("$.header.preparedBy").value("abena@client.test"))
			.andExpect(jsonPath("$.header.publishedBy").value("abena@client.test"));
		// the history names every actor and act
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/events").with(asMember()))
			.andExpect(jsonPath("$[*].action").value(org.hamcrest.Matchers.hasItems("REVIEWED", "CLASSIFIED", "FROZEN",
					"RUN_LAUNCHED", "FINAL_DESIGNATED", "PUBLISHED")))
			.andExpect(jsonPath("$[?(@.action == 'CLASSIFIED')].actor").value("abena@client.test"))
			.andExpect(jsonPath("$[?(@.action == 'CLASSIFIED')].reason")
				.value(org.hamcrest.Matchers.hasItem(org.hamcrest.Matchers.containsString("'Genset diesel'"))));
		// the last owner cannot be removed or demoted
		mvc.perform(delete("/api/ghg/organizations/" + orgId + "/members/" + ownerMember).with(asMember()).with(csrf()))
			.andExpect(status().isConflict());
		mvc.perform(put("/api/ghg/organizations/" + orgId + "/members/" + ownerMember).with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"role": "VERIFIER"}"""))
			.andExpect(status().isConflict());
		mvc.perform(delete("/api/ghg/organizations/" + orgId + "/members/" + abenaMember).with(asMember()).with(csrf()))
			.andExpect(status().isNoContent());
		mvc.perform(get("/api/ghg/organizations/" + orgId).with(as(abena))).andExpect(status().isNotFound());
	}
	// --- data quality, evidence, corrections and justified exclusions (spec 04.4) --------------

	@Test
	void activityDataCarriesQualityEvidenceCorrectionsAndJustifiedExclusions() throws Exception {
		var orgId = createOrganization("Asante Gold Resources");
		var facilityId = createFacility(orgId, "Nkran Mine");
		var diesel = createActivity(orgId, facilityId, "Diesel consumption", "1000", "litre", "2025-03-15");
		var cyanide = createActivity(orgId, facilityId, "Sodium cyanide", "12", "tonne", "2025-03-20");

		// a record carries a quality tier and an uncertainty; the tier defaults from the method
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/activities").with(asMember()))
			.andExpect(jsonPath("$[?(@.id == '" + diesel + "')].dataQualityTier").value(1))
			.andExpect(jsonPath("$[?(@.id == '" + diesel + "')].dataQualityTierLabel")
				.value("Metered or invoiced primary data"));
		var tiered = mvc.perform(post("/api/ghg/organizations/" + orgId + "/activities").with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"facilityId": "%s", "activityType": "Grinding media", "quantity": 40, "unit": "tonne",
					 "periodStart": "2025-01-01", "periodEnd": "2025-12-31", "dataQuality": "ESTIMATED",
					 "dataQualityTier": 4, "uncertaintyPercent": 25}""".formatted(facilityId)))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.dataQualityTier").value(4))
			.andExpect(jsonPath("$.uncertaintyPercent").value(25.0))
			.andReturn();
		String media = JsonPath.read(tiered.getResponse().getContentAsString(), "$.id");

		// a correction needs a reason and leaves a revision with the old and new values
		mvc.perform(put("/api/ghg/activities/" + diesel).with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"facilityId": "%s", "activityType": "Diesel consumption", "quantity": 1200, "unit": "litre",
					 "periodStart": "2025-03-15", "periodEnd": "2025-03-15", "dataQuality": "MEASURED"}"""
				.formatted(facilityId)))
			.andExpect(status().is(422))
			.andExpect(jsonPath("$.errors.reason").exists());
		mvc.perform(put("/api/ghg/activities/" + diesel).with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"facilityId": "%s", "activityType": "Diesel consumption", "quantity": 1200, "unit": "litre",
					 "periodStart": "2025-03-15", "periodEnd": "2025-03-15", "dataQuality": "MEASURED",
					 "uncertaintyPercent": 2, "reason": "dispensing log reconciled with the supplier invoice"}"""
				.formatted(facilityId)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.quantity").value(1200.0));
		mvc.perform(get("/api/ghg/activities/" + diesel + "/revisions").with(asMember()))
			.andExpect(jsonPath("$.length()").value(1))
			.andExpect(jsonPath("$[0].kind").value("CORRECTED"))
			.andExpect(jsonPath("$[0].changedBy").value("kojo@ecoriv.com"))
			.andExpect(jsonPath("$[0].reason").value("dispensing log reconciled with the supplier invoice"))
			.andExpect(jsonPath("$[0].changes[?(@.field == 'quantity')].before").value("1000"))
			.andExpect(jsonPath("$[0].changes[?(@.field == 'quantity')].after").value("1200"))
			.andExpect(jsonPath("$[0].changes[?(@.field == 'uncertaintyPercent')].after").value("2"));

		// evidence: a file in the object store and a link, listed, downloadable, tenant-scoped
		var pdf = new org.springframework.mock.web.MockMultipartFile("file", "invoice-2938.pdf", "application/pdf",
				"%PDF-1.4 fuel invoice".getBytes(java.nio.charset.StandardCharsets.UTF_8));
		var uploaded = mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
			.multipart("/api/ghg/activities/" + diesel + "/evidence").file(pdf).with(asMember()).with(csrf()))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.kind").value("FILE"))
			.andExpect(jsonPath("$.name").value("invoice-2938.pdf"))
			.andExpect(jsonPath("$.contentType").value("application/pdf"))
			.andReturn();
		String evidenceId = JsonPath.read(uploaded.getResponse().getContentAsString(), "$.id");
		var word = new org.springframework.mock.web.MockMultipartFile("file", "notes.exe", "application/octet-stream",
				"MZ binary".getBytes(java.nio.charset.StandardCharsets.UTF_8));
		mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
			.multipart("/api/ghg/activities/" + diesel + "/evidence").file(word).with(asMember()).with(csrf()))
			.andExpect(status().is(422))
			.andExpect(jsonPath("$.errors.file").exists());
		mvc.perform(post("/api/ghg/activities/" + diesel + "/evidence/links").with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"name": "Fuel register (SharePoint)", "url": "https://docs.example.com/fuel/2025-03"}"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.kind").value("LINK"));
		mvc.perform(get("/api/ghg/activities/" + diesel + "/evidence").with(asMember()))
			.andExpect(jsonPath("$.length()").value(2));
		mvc.perform(get("/api/ghg/evidence/" + evidenceId).with(asMember()))
			.andExpect(status().isOk())
			.andExpect(header().string("Content-Type", "application/pdf"))
			.andExpect(content().string("%PDF-1.4 fuel invoice"));
		mvc.perform(get("/api/ghg/evidence/" + evidenceId).with(asOutsider())).andExpect(status().isNotFound());
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/activities").with(asMember()))
			.andExpect(jsonPath("$[?(@.id == '" + diesel + "')].evidenceCount").value(2))
			.andExpect(jsonPath("$[?(@.id == '" + diesel + "')].revisionCount").value(1));

		// a manual exclusion needs a justification and an estimated magnitude
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, facilityId);
		var dieselAssignment = syncAndGetAssignmentId(inventoryId, diesel);
		var listing = body(mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember())));
		String cyanideAssignment = JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + cyanide + "')].id").getFirst();
		String mediaAssignment = JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + media + "')].id").getFirst();
		mvc.perform(put("/api/ghg/assignments/" + cyanideAssignment + "/exclude").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"reason": "METHODOLOGY"}"""))
			.andExpect(status().is(422))
			.andExpect(jsonPath("$.errors.justification").exists());
		mvc.perform(put("/api/ghg/assignments/" + cyanideAssignment + "/exclude").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"reason": "METHODOLOGY", "justification": "no published factor for sodium cyanide"}"""))
			.andExpect(status().is(422))
			.andExpect(jsonPath("$.errors.estimatedKgCo2e").exists());
		mvc.perform(put("/api/ghg/assignments/" + cyanideAssignment + "/exclude").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"reason": "METHODOLOGY", "justification": "no published factor for sodium cyanide; supplier study pending",
					 "estimatedKgCo2e": 8400}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.exclusionJustification").value("no published factor for sodium cyanide; supplier study pending"))
			.andExpect(jsonPath("$.estimatedKgCo2e").value(8400.0));
		mvc.perform(put("/api/ghg/assignments/" + mediaAssignment + "/exclude").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"reason": "NOT_APPLICABLE", "justification": "grinding media wear is not a combustion source", "estimatedKgCo2e": 0}"""))
			.andExpect(status().isOk());
		classify(dieselAssignment, DIESEL_FACTOR);
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/report-metadata").with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"assuranceLevel": "UNVERIFIED", "intensityMetrics": [],
					 "uncertaintyStatement": "Fuel data are metered; the cyanide estimate rests on supplier averages."}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.uncertaintyStatement").value(org.hamcrest.Matchers.startsWith("Fuel data are metered")));
		freeze(inventoryId);
		var runId = runAndGetId(inventoryId, "Run 001");

		// the run's exclusions and lines carry the justification, the magnitude, the tier and the evidence
		mvc.perform(get("/api/ghg/runs/" + runId).with(asMember()))
			.andExpect(jsonPath("$.exclusions[?(@.activityId == '" + cyanide + "')].exclusionJustification")
				.value("no published factor for sodium cyanide; supplier study pending"))
			.andExpect(jsonPath("$.exclusions[?(@.activityId == '" + cyanide + "')].estimatedKgCo2e").value(8400.0))
			.andExpect(jsonPath("$.lines[0].dataQualityTier").value(1))
			.andExpect(jsonPath("$.lines[0].uncertaintyPercent").value(2.0))
			.andExpect(jsonPath("$.lines[0].evidenceFiles").value("invoice-2938.pdf, Fuel register (SharePoint)"));
		mvc.perform(get("/api/ghg/runs/" + runId + "/report").with(asMember()))
			.andExpect(jsonPath("$.exclusionSummary[?(@.reason == 'METHODOLOGY')].recordCount").value(1))
			.andExpect(jsonPath("$.exclusionSummary[?(@.reason == 'METHODOLOGY')].estimatedKgCo2e").value(8400.0))
			.andExpect(jsonPath("$.exclusionSummary[?(@.reason == 'NOT_APPLICABLE')].estimatedKgCo2e").value(0.0))
			.andExpect(jsonPath("$.dataQuality.byTier[0].tier").value(1))
			.andExpect(jsonPath("$.dataQuality.byTier[0].sharePercent").value(100.0))
			.andExpect(jsonPath("$.dataQuality.weightedUncertaintyPercent").value(2.0))
			.andExpect(jsonPath("$.dataQuality.uncertaintyStatement").value(org.hamcrest.Matchers.startsWith("Fuel data are metered")));
		mvc.perform(get("/api/ghg/runs/" + runId + "/lines.csv").with(asMember()))
			.andExpect(content().string(org.hamcrest.Matchers.containsString("evidence_files")))
			.andExpect(content().string(org.hamcrest.Matchers.containsString("invoice-2938.pdf")));

		// a record in a run cannot be removed; one that is not is removed with a reason and reviews exclude it
		mvc.perform(delete("/api/ghg/activities/" + diesel).with(asMember()).with(csrf()).param("reason", "entered twice"))
			.andExpect(status().isConflict());
		reopen(inventoryId);
		var duplicate = createActivity(orgId, facilityId, "Diesel consumption (duplicate)", "1000", "litre", "2025-03-15");
		syncAndGetAssignmentId(inventoryId, duplicate);
		mvc.perform(delete("/api/ghg/activities/" + duplicate).with(asMember()).with(csrf()))
			.andExpect(status().is(422))
			.andExpect(jsonPath("$.errors.reason").exists());
		mvc.perform(delete("/api/ghg/activities/" + duplicate).with(asMember()).with(csrf())
			.param("reason", "entered twice from the same dispensing log"))
			.andExpect(status().isNoContent());
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/activities").with(asMember()))
			.andExpect(jsonPath("$[?(@.id == '" + duplicate + "')]").isEmpty());
		mvc.perform(get("/api/ghg/activities/" + duplicate + "/revisions").with(asMember()))
			.andExpect(jsonPath("$[0].kind").value("REMOVED"))
			.andExpect(jsonPath("$[0].reason").value("entered twice from the same dispensing log"));
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.gates[1].findings[?(@.severity == 'ERROR')].message")
				.value(org.hamcrest.Matchers.hasItem(org.hamcrest.Matchers.containsString("was removed"))));
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/assignments/sync").with(asMember()).with(csrf()))
			.andExpect(jsonPath("$.updated").value(1));
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember()))
			.andExpect(jsonPath("$[?(@.activityId == '" + duplicate + "')].exclusionReason").value("RECORD_REMOVED"))
			.andExpect(jsonPath("$[?(@.activityId == '" + duplicate + "')].exclusionDetail")
				.value(org.hamcrest.Matchers.hasItem(org.hamcrest.Matchers.containsString("entered twice"))));

		// facilities and entities are removed with a reason and stay as tombstones
		var depot = createFacility(orgId, "Kumasi Depot");
		mvc.perform(delete("/api/ghg/facilities/" + depot).with(asMember()).with(csrf()))
			.andExpect(status().is(422))
			.andExpect(jsonPath("$.errors.reason").exists());
		mvc.perform(delete("/api/ghg/facilities/" + depot).with(asMember()).with(csrf()).param("reason", "site closed in 2024"))
			.andExpect(status().isNoContent());
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/facilities").with(asMember()))
			.andExpect(jsonPath("$[?(@.id == '" + depot + "')]").isEmpty());
		var shell = createEntity(orgId, "Dormant Holdings Ltd", "SUBSIDIARY", "100", true);
		mvc.perform(delete("/api/ghg/entities/" + shell).with(asMember()).with(csrf()).param("reason", "liquidated"))
			.andExpect(status().isNoContent());
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/entities").with(asMember()))
			.andExpect(jsonPath("$[?(@.id == '" + shell + "')]").isEmpty());
	}
	// --- units: densities and custom units (spec 02.2) ------------------------------------

	@Test
	void massAndVolumeReconcileThroughADensityAndCustomUnitsConvert() throws Exception {
		var orgId = createOrganization("Asante Gold Resources");
		var facilityId = createFacility(orgId, "Nkran Mine");
		// LPG invoiced by mass against the diesel factor per litre stands in for any mass-to-volume case
		var byMass = createActivity(orgId, facilityId, "Diesel by tanker", "12", "tonne", "2025-03-15");
		var byDrum = createActivity(orgId, facilityId, "Diesel in drums", "5", "drum", "2025-04-01");

		// the shared typical densities are listed; the organization adds its supplier's figure
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/densities").with(asMember()))
			.andExpect(jsonPath("$[?(@.material == 'Diesel')].typical").value(true))
			.andExpect(jsonPath("$[?(@.material == 'Diesel')].kgPerLitre").value(0.84));
		var own = mvc.perform(post("/api/ghg/organizations/" + orgId + "/densities").with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"material": "Diesel (GOIL, 2025 CoA)", "kgPerLitre": 0.8325,
					 "source": "GOIL certificate of analysis, batch 2025-03"}"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.typical").value(false))
			.andReturn();
		String supplierDensity = JsonPath.read(own.getResponse().getContentAsString(), "$.id");
		String typicalDensity = JsonPath.<List<String>>read(body(mvc.perform(
				get("/api/ghg/organizations/" + orgId + "/densities").with(asMember()))), "$[?(@.material == 'Diesel')].id")
			.getFirst();

		// a custom unit is a multiple of a registered one; a registered code is refused
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/custom-units").with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"code": "litre", "label": "Litre", "baseUnit": "litre", "factor": 1}"""))
			.andExpect(status().is(422))
			.andExpect(jsonPath("$.errors.code").exists());
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/custom-units").with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"code": "drum", "label": "Drum (200 L)", "baseUnit": "litre", "factor": 200}"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.definition").value("1 drum = 200 litre"));
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/units").with(asMember()))
			.andExpect(jsonPath("$[?(@.code == 'drum')].custom").value(true))
			.andExpect(jsonPath("$[?(@.code == 'drum')].dimension").value("VOLUME"));

		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, facilityId);
		var massAssignment = syncAndGetAssignmentId(inventoryId, byMass);
		var listing = body(mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember())));
		String drumAssignment = JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + byDrum + "')].id").getFirst();

		// mass against a per-litre factor needs a density; with the typical one the gate warns, with the supplier's it is silent
		mvc.perform(put("/api/ghg/assignments/" + massAssignment + "/classify").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"emissionFactorId": "%s"}""".formatted(DIESEL_FACTOR)))
			.andExpect(status().is(422))
			.andExpect(jsonPath("$.errors.densityId").exists());
		mvc.perform(put("/api/ghg/assignments/" + massAssignment + "/classify").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"emissionFactorId": "%s", "densityId": "%s"}""".formatted(DIESEL_FACTOR, typicalDensity)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.densityMaterial").value("Diesel"));
		classify(drumAssignment, DIESEL_FACTOR);
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.gates[3].findings[?(@.severity == 'WARNING')].message")
				.value(org.hamcrest.Matchers.hasItem(org.hamcrest.Matchers.containsString("typical density of Diesel"))));
		mvc.perform(put("/api/ghg/assignments/" + massAssignment + "/classify").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"emissionFactorId": "%s", "densityId": "%s"}""".formatted(DIESEL_FACTOR, supplierDensity)))
			.andExpect(status().isOk());
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.gates[3].findings[?(@.message =~ /.*typical density.*/)]").isEmpty());
		freeze(inventoryId);

		// 12 t / 0.8325 = 14,414.414 litre x 2.66 = 38,342.342 kg; 5 drum = 1,000 litre x 2.66 = 2,660 kg
		var runId = runAndGetId(inventoryId, "Run 001");
		mvc.perform(get("/api/ghg/runs/" + runId).with(asMember()))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + byMass + "')].convertedQuantity").value(14414.414414))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + byMass + "')].kgCo2e").value(38342.342))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + byMass + "')].densityKgPerLitre").value(0.8325))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + byMass + "')].conversionNote")
				.value(org.hamcrest.Matchers.hasItem(org.hamcrest.Matchers.containsString("12000 kg ÷ 0.8325 kg/litre"))))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + byDrum + "')].convertedQuantity").value(1000.0))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + byDrum + "')].kgCo2e").value(2660.0))
			.andExpect(jsonPath("$.lines[?(@.activityId == '" + byDrum + "')].conversionNote").value("1 drum = 200 litre"))
			.andExpect(jsonPath("$.run.totalKgCo2e").value(41002.342));

		// a density a classification applies, and a unit records are recorded in, cannot be deleted
		mvc.perform(delete("/api/ghg/densities/" + supplierDensity).with(asMember()).with(csrf()))
			.andExpect(status().isConflict());
		mvc.perform(delete("/api/ghg/densities/" + typicalDensity).with(asMember()).with(csrf()))
			.andExpect(status().isConflict());
		String drumId = JsonPath.read(body(mvc.perform(
				get("/api/ghg/organizations/" + orgId + "/custom-units").with(asMember()))), "$[0].id");
		mvc.perform(delete("/api/ghg/custom-units/" + drumId).with(asMember()).with(csrf()))
			.andExpect(status().isConflict());
	}
	// --- bulk import and the activity register (spec 04.5) --------------------------------

	@Test
	void activityDataIsImportedFromCsvAllOrNothingAndTheRegisterPagesFiltersAndSorts() throws Exception {
		var orgId = createOrganization("Asante Gold Resources");
		var mine = createFacility(orgId, "Nkran Mine");
		var camp = createFacility(orgId, "Nkran Camp");
		mvc.perform(post("/api/ghg/facilities/" + mine + "/streams").with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"name": "Standby gensets", "kind": "STATIONARY_COMBUSTION", "fuel": "Diesel", "contractorOperated": false}"""))
			.andExpect(status().isCreated());
		mvc.perform(post("/api/ghg/facilities/" + camp + "/streams").with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"name": "Camp LPG", "kind": "STATIONARY_COMBUSTION", "fuel": "LPG", "contractorOperated": false}"""))
			.andExpect(status().isCreated());

		// the template downloads with the header and one example row
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/activities/import-template.csv").with(asMember()))
			.andExpect(status().isOk())
			.andExpect(content().string(org.hamcrest.Matchers.startsWith("facility,stream,activity_type,quantity,unit,period_start")));

		// a file with a bad row imports nothing and names the row and the problem
		var bad = ("facility,stream,activity_type,quantity,unit,period_start,period_end,data_source,evidence_ref,data_quality\r\n"
				+ "Nkran Mine,Standby gensets,Diesel consumption,12500,litre,2025-03-01,2025-03-31,Fuel register,INV-1,MEASURED\r\n"
				+ "Nkran Mine,,Diesel consumption,abc,litre,2025-04-01,2025-04-30,Fuel register,INV-2,MEASURED\r\n"
				+ "Obuasi Depot,,Petrol,300,litre,2025-04-01,,,,GUESSED\r\n").getBytes(java.nio.charset.StandardCharsets.UTF_8);
		mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
			.multipart("/api/ghg/organizations/" + orgId + "/activities/import")
			.file(new org.springframework.mock.web.MockMultipartFile("file", "march.csv", "text/csv", bad))
			.with(asMember()).with(csrf()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.imported").value(0))
			.andExpect(jsonPath("$.rejected.length()").value(2))
			.andExpect(jsonPath("$.rejected[0].row").value(3))
			.andExpect(jsonPath("$.rejected[0].message").value(org.hamcrest.Matchers.containsString("not a number")))
			.andExpect(jsonPath("$.rejected[1].row").value(4))
			.andExpect(jsonPath("$.rejected[1].message").value(org.hamcrest.Matchers.containsString("no facility named 'Obuasi Depot'")))
			.andExpect(jsonPath("$.rejected[1].message").value(org.hamcrest.Matchers.containsString("data_quality must be")));
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/activities").with(asMember()))
			.andExpect(jsonPath("$.length()").value(0));

		// a clean file imports every row; the same file again is all duplicates
		var rows = new StringBuilder("facility,stream,activity_type,quantity,unit,period_start,period_end,data_source,evidence_ref,data_quality,data_quality_tier,uncertainty_percent,note\r\n");
		for (int month = 1; month <= 12; month++) {
			var start = java.time.LocalDate.of(2025, month, 1);
			rows.append("Nkran Mine,Standby gensets,Diesel consumption,").append(10000 + month * 100).append(",litre,")
				.append(start).append(',').append(start.withDayOfMonth(start.lengthOfMonth()))
				.append(",Fuel register,INV-").append(month).append(",MEASURED,1,2,\"monthly, metered\"\r\n");
		}
		rows.append("Nkran Camp,Camp LPG,LPG cylinders,\"1,200\",kg,2025-06-01,2025-06-30,Supplier invoice,LPG-6,ESTIMATED,4,,\r\n");
		var good = rows.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
		mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
			.multipart("/api/ghg/organizations/" + orgId + "/activities/import")
			.file(new org.springframework.mock.web.MockMultipartFile("file", "2025.csv", "text/csv", good))
			.with(asMember()).with(csrf()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.imported").value(13))
			.andExpect(jsonPath("$.rejected.length()").value(0));
		mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
			.multipart("/api/ghg/organizations/" + orgId + "/activities/import")
			.file(new org.springframework.mock.web.MockMultipartFile("file", "2025.csv", "text/csv", good))
			.with(asMember()).with(csrf()))
			.andExpect(jsonPath("$.imported").value(0))
			.andExpect(jsonPath("$.rejected.length()").value(13))
			.andExpect(jsonPath("$.rejected[0].message").value(org.hamcrest.Matchers.containsString("duplicate")));

		// the register pages, filters, searches and sorts
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/activities/page").with(asMember())
			.param("size", "5").param("sort", "periodStart").param("dir", "asc"))
			.andExpect(jsonPath("$.total").value(13))
			.andExpect(jsonPath("$.items.length()").value(5))
			.andExpect(jsonPath("$.items[0].periodStart").value("2025-01-01"))
			.andExpect(jsonPath("$.items[0].streamName").value("Standby gensets"))
			.andExpect(jsonPath("$.items[0].note").value("monthly, metered"));
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/activities/page").with(asMember())
			.param("size", "5").param("page", "2").param("sort", "periodStart").param("dir", "asc"))
			.andExpect(jsonPath("$.items.length()").value(3))
			.andExpect(jsonPath("$.items[2].periodStart").value("2025-12-01"));
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/activities/page").with(asMember())
			.param("facilityId", camp))
			.andExpect(jsonPath("$.total").value(1))
			.andExpect(jsonPath("$.items[0].quantity").value(1200.0))
			.andExpect(jsonPath("$.items[0].dataQualityTier").value(4));
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/activities/page").with(asMember()).param("q", "lpg"))
			.andExpect(jsonPath("$.total").value(1));
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/activities/page").with(asMember())
			.param("from", "2025-10-01").param("to", "2025-12-31"))
			.andExpect(jsonPath("$.total").value(3));
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/activities/page").with(asMember())
			.param("sort", "quantity").param("dir", "desc").param("size", "1"))
			.andExpect(jsonPath("$.items[0].quantity").value(11200.0));

		// the activity view pages with the counts by status; the coverage matrix is per stream
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, mine);
		putBoundary(inventoryId, camp);
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/assignments/sync").with(asMember()).with(csrf()))
			.andExpect(jsonPath("$.created").value(13));
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments/page").with(asMember())
			.param("status", "UNCLASSIFIED").param("size", "4"))
			.andExpect(jsonPath("$.total").value(13))
			.andExpect(jsonPath("$.unclassified").value(13))
			.andExpect(jsonPath("$.items.length()").value(4));
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments/page").with(asMember()).param("q", "camp"))
			.andExpect(jsonPath("$.total").value(1));
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/coverage").with(asMember()))
			.andExpect(jsonPath("$[?(@.streamName == 'Standby gensets')].coveredMonths.length()").value(12))
			.andExpect(jsonPath("$[?(@.streamName == 'Camp LPG')].coveredMonths").value(org.hamcrest.Matchers.hasItem(java.util.List.of("2025-06"))));
	}
	// --- entity dates and control, facility attributes, boundary pre-population (spec 03.4) ---

	@Test
	void entityDatesAndControlDecisionFlowIntoTheBoundaryAndTheRecalculationWeighsARun() throws Exception {
		var orgId = createOrganization("Sankofa Gold plc");
		var pit = createFacility(orgId, "Obuasi Ridge Open Pit");
		// a 30% associate consolidated under financial control by decision, acquired mid-year
		var portResult = mvc.perform(post("/api/ghg/organizations/" + orgId + "/entities").with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"name": "Takoradi Port Co", "relationshipType": "ASSOCIATE", "economicInterestPercent": 30,
					 "operatedByCompany": false, "effectiveFrom": "2025-07-01", "jurisdiction": "gh",
					 "financialControlOverride": true, "controlNote": "Board control under the 2023 shareholders' agreement"}"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.financialControlShare").value(1))
			.andExpect(jsonPath("$.equityShare").value(0.3))
			.andExpect(jsonPath("$.jurisdiction").value("GH"))
			.andExpect(jsonPath("$.effectiveFrom").value("2025-07-01"))
			.andReturn();
		String port = JsonPath.read(portResult.getResponse().getContentAsString(), "$.id");
		var terminal = createFacility(orgId, "Takoradi Port Loadout", port);
		mvc.perform(put("/api/ghg/entities/" + port).with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"name": "Takoradi Port Co", "relationshipType": "ASSOCIATE", "economicInterestPercent": 30,
					 "operatedByCompany": false, "effectiveFrom": "2025-07-01", "effectiveTo": "2025-01-01"}"""))
			.andExpect(status().is(422))
			.andExpect(jsonPath("$.errors.effectiveTo").exists());

		// the window defaults from the entity's dates and the row says "by decision"
		var inventoryId = createInventory(orgId, "2025 Corporate", "FINANCIAL_CONTROL");
		putBoundary(inventoryId, pit);
		var entry = body(mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/boundary/" + terminal).with(asMember())
			.with(csrf()).contentType("application/json").content("{}")).andExpect(status().isOk()));
		assertThat(JsonPath.<Number>read(entry, "$.accountingShare").doubleValue()).isEqualTo(1.0);
		assertThat(JsonPath.<String>read(entry, "$.effectiveFrom")).isEqualTo("2025-07-01");
		assertThat(JsonPath.<String>read(entry, "$.table1Row")).contains("by decision");
		assertThat(JsonPath.<Boolean>read(entry, "$.financialControlOverride")).isTrue();
		// the decision can be lifted on the treatment alone: back to the Table 1 row, 0% for an associate
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/boundary/entities/" + port).with(asMember())
			.with(csrf()).contentType("application/json").content("""
					{"clearFinancialControlOverride": true}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.accountingShare").value(0))
			.andExpect(jsonPath("$.financialControlOverride").doesNotExist());
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/boundary/entities/" + port).with(asMember())
			.with(csrf()).contentType("application/json").content("""
					{"financialControlOverride": true}"""))
			.andExpect(jsonPath("$.accountingShare").value(1));
		var diesel = createActivity(orgId, pit, "Haul fleet diesel", "1000", "litre", "2025-06-30");
		classify(syncAndGetAssignmentId(inventoryId, diesel), DIESEL_FACTOR);
		freeze(inventoryId);
		var versionId = JsonPath.<String>read(body(mvc.perform(get("/api/ghg/inventories/" + inventoryId).with(asMember()))),
				"$.currentBoundaryVersionId");
		mvc.perform(get("/api/ghg/boundary-versions/" + versionId).with(asMember()))
			.andExpect(jsonPath("$.entries[?(@.entityName == 'Takoradi Port Co')].financialControlOverride").value(true))
			.andExpect(jsonPath("$.entries[?(@.entityName == 'Takoradi Port Co')].effectiveFrom").value("2025-07-01"));

		// a manual candidate weighed against a comparison run of the base-year inventory
		var baseRun = runAndGetId(inventoryId, "Base run");
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/finalize").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"runId": "%s"}""".formatted(baseRun))).andExpect(status().isOk());
		mvc.perform(put("/api/ghg/organizations/" + orgId + "/base-year").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"inventoryId": "%s", "thresholdPercent": 5, "reason": "first verifiable year",
					 "structuralChangeConvention": "TRANSACTION_DATE"}""".formatted(inventoryId)))
			.andExpect(status().isOk());
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/withdraw-final").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"reason": "recalculating with the supplier-specific factor"}""")).andExpect(status().isOk());
		reopen(inventoryId);
		// a second record makes the comparison run 10% heavier: 2,660 + 266 = 2,926 vs 2,660
		var more = createActivity(orgId, pit, "Haul fleet diesel, corrected", "100", "litre", "2025-06-30");
		classify(syncAndGetAssignmentId(inventoryId, more), DIESEL_FACTOR);
		freeze(inventoryId);
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/finalize").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"runId": "%s"}""".formatted(baseRun))).andExpect(status().isOk());
		var comparison = runAndGetId(inventoryId, "Corrected method");
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/base-year/recalculations").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"trigger": "ERROR_CORRECTION", "reason": "dispensing log understated June"}"""))
			.andExpect(status().is(422))
			.andExpect(jsonPath("$.errors.affectedPercent").exists());
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/base-year/recalculations").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"trigger": "ERROR_CORRECTION", "reason": "dispensing log understated June",
					 "comparisonRunId": "%s"}""".formatted(comparison)))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.recalculations[0].affectedPercent").value(10.0))
			.andExpect(jsonPath("$.recalculations[0].comparisonRunId").value(comparison))
			.andExpect(jsonPath("$.recalculations[0].aboveThreshold").value(true));
	}

	@Test
	void facilityAttributesSuggestTheGridFactorAndRecordsInheritTheLease() throws Exception {
		var orgId = createOrganization("Sankofa Gold plc");
		// a warehouse leased in under an operating lease from July, in Ghana: the grid follows the country
		var warehouse = mvc.perform(post("/api/ghg/organizations/" + orgId + "/facilities").with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"name": "Tema Warehouse", "location": "Tema, Ghana", "country": "GH", "facilityType": "WAREHOUSE",
					 "leaseType": "OPERATING_LEASE_IN", "leaseFrom": "2025-07-01"}"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.effectiveGridRegion").value("GHA"))
			.andExpect(jsonPath("$.facilityType").value("WAREHOUSE"))
			.andReturn();
		String warehouseId = JsonPath.read(warehouse.getResponse().getContentAsString(), "$.id");
		mvc.perform(put("/api/ghg/facilities/" + warehouseId).with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"name": "Tema Warehouse", "location": "Tema, Ghana", "leaseType": "OPERATING_LEASE_IN",
					 "leaseFrom": "2025-07-01", "leaseTo": "2025-01-01"}"""))
			.andExpect(status().is(422))
			.andExpect(jsonPath("$.errors.leaseTo").exists());
		var power = createActivity(orgId, warehouseId, "Grid electricity", "5000", "kWh", "2025-08-31");
		var junePower = createActivity(orgId, warehouseId, "Grid electricity", "4000", "kWh", "2025-06-30");
		var inventoryId = createInventory(orgId, "2025 Corporate", "EQUITY_SHARE");
		putBoundary(inventoryId, warehouseId);
		var augustAssignment = syncAndGetAssignmentId(inventoryId, power);
		var listing = body(mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember())));
		// the seeded Ghana grid is suggested for region GHA; the June record is before the lease
		assertThat(JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + power + "')].suggestedFactorId").getFirst())
			.isEqualTo(GRID_FACTOR);
		assertThat(JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + power + "')].inheritedLeaseType").getFirst())
			.isEqualTo("OPERATING_LEASE_IN");
		assertThat(JsonPath.<List<Object>>read(listing, "$[?(@.activityId == '" + junePower + "')].inheritedLeaseType").getFirst())
			.isNull();
		// classifying with no lease type applies the inherited one: Appendix F under equity share puts an operating
		// lease in scope 3 upstream leased assets; ignoring the facility's lease keeps scope 2
		classify(augustAssignment, GRID_FACTOR);
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember()))
			.andExpect(jsonPath("$[?(@.activityId == '" + power + "')].leaseType").value("OPERATING_LEASE_IN"))
			.andExpect(jsonPath("$[?(@.activityId == '" + power + "')].scope").value("SCOPE_3"))
			.andExpect(jsonPath("$[?(@.activityId == '" + power + "')].category").value("UPSTREAM_LEASED_ASSETS"));
		mvc.perform(put("/api/ghg/assignments/" + augustAssignment + "/classify").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"emissionFactorId": "%s", "ignoreFacilityLease": true}""".formatted(GRID_FACTOR)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.leaseType").doesNotExist())
			.andExpect(jsonPath("$.scope").value("SCOPE_2"));
	}

	@Test
	void aNewInventoryStartsWithEveryOperationTheApproachIncludes() throws Exception {
		var orgId = createOrganization("Sankofa Gold plc");
		var pit = createFacility(orgId, "Obuasi Ridge Open Pit");
		var camp = createFacility(orgId, "Nkran Exploration Camp");
		var jv = createEntity(orgId, "Tarkwa Gold JV Ltd", "JOINT_VENTURE", "40", true);
		var plant = createFacility(orgId, "Tarkwa Processing Plant", jv);
		var port = createEntity(orgId, "Takoradi Port Co", "ASSOCIATE", "30", false);
		var terminal = createFacility(orgId, "Takoradi Port Loadout", port);

		var created = mvc.perform(post("/api/ghg/organizations/" + orgId + "/inventories").with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"name": "2025 Corporate", "periodStart": "2025-01-01", "periodEnd": "2025-12-31",
					 "consolidationApproach": "OPERATIONAL_CONTROL", "prefillBoundary": true}"""))
			.andExpect(status().isCreated())
			.andReturn();
		String inventoryId = JsonPath.read(created.getResponse().getContentAsString(), "$.id");
		var boundary = body(mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/boundary").with(asMember())));
		// the reporting company and the operated JV are in with every facility; the 0% associate is out
		assertThat(JsonPath.<List<Boolean>>read(boundary, "$[?(@.entityName == 'Sankofa Gold plc')].inBoundary").getFirst()).isTrue();
		assertThat(JsonPath.<List<Boolean>>read(boundary, "$[?(@.entityName == 'Tarkwa Gold JV Ltd')].inBoundary").getFirst()).isTrue();
		assertThat(JsonPath.<List<Boolean>>read(boundary, "$[?(@.entityName == 'Takoradi Port Co')].inBoundary").getFirst()).isFalse();
		assertThat(JsonPath.<List<Number>>read(boundary, "$[?(@.entityName == 'Takoradi Port Co')].shareUnderApproach").getFirst().doubleValue()).isEqualTo(0.0);
		assertThat(JsonPath.<List<Boolean>>read(boundary, "$[*].facilities[?(@.facilityId == '" + plant + "')].inBoundary").getFirst()).isTrue();
		assertThat(JsonPath.<List<Boolean>>read(boundary, "$[*].facilities[?(@.facilityId == '" + camp + "')].inBoundary").getFirst()).isTrue();
		// unticking the camp leaves it neither in nor excluded: the gate says so until a reason is recorded
		mvc.perform(delete("/api/ghg/inventories/" + inventoryId + "/boundary/" + camp).with(asMember()).with(csrf()))
			.andExpect(status().isNoContent());
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.gates[0].findings[?(@.severity == 'ERROR')].message")
				.value(org.hamcrest.Matchers.hasItems(
						org.hamcrest.Matchers.startsWith("'Nkran Exploration Camp' (Sankofa Gold plc) is neither"),
						org.hamcrest.Matchers.startsWith("'Takoradi Port Loadout' (Takoradi Port Co) is neither"))));
		excludeFacility(inventoryId, camp, "NOT_APPLICABLE", "Exploration only; no fuel or power in 2025");
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/boundary/entities/" + port + "/exclude").with(asMember())
			.with(csrf()).contentType("application/json").content("""
					{"reason": "METHODOLOGY", "detail": "Associate: no operational control"}"""))
			.andExpect(status().isOk());
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.gates[0].findings[?(@.message =~ /.*neither in the boundary.*/)]").isEmpty());
		// a request without the flag starts empty, as before
		var plain = createInventory(orgId, "2025 Plain", "OPERATIONAL_CONTROL");
		mvc.perform(get("/api/ghg/inventories/" + plain + "/boundary").with(asMember()))
			.andExpect(jsonPath("$[?(@.inBoundary == true)]").isEmpty());
		assertThat(pit).isNotNull();
		assertThat(terminal).isNotNull();
	}
	// --- inheritance and the published record (spec 05.3) --------------------------------

	@Test
	void aNewInventoryCopiesItsViewAndACorrectionInheritsItWithAReason() throws Exception {
		var orgId = createOrganization("Sankofa Gold plc");
		var pit = createFacility(orgId, "Obuasi Ridge Open Pit");
		var camp = createFacility(orgId, "Nkran Exploration Camp");
		var diesel = createActivity(orgId, pit, "Haul fleet diesel", "1000", "litre", "2025-06-30");
		var lpg = createActivity(orgId, camp, "Camp LPG", "500", "litre", "2025-01-15");
		var source = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(source, pit);
		putBoundary(source, camp);
		var dieselAssignment = syncAndGetAssignmentId(source, diesel);
		var listing = body(mvc.perform(get("/api/ghg/inventories/" + source + "/assignments").with(asMember())));
		String lpgAssignment = JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + lpg + "')].id").getFirst();
		classifyAs(dieselAssignment, DIESEL_FACTOR, "SCOPE_1", "MOBILE_COMBUSTION").andExpect(status().isOk());
		mvc.perform(put("/api/ghg/assignments/" + lpgAssignment + "/exclude").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"reason": "METHODOLOGY", "justification": "camp LPG is below the materiality threshold", "estimatedKgCo2e": 750}"""))
			.andExpect(status().isOk());
		mvc.perform(put("/api/ghg/inventories/" + source + "/operational-boundary").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"scope3Categories": ["BUSINESS_TRAVEL"], "exclusionsRationale": "Other categories immaterial"}"""))
			.andExpect(status().isOk());

		// a second inventory copies the view: boundary, declaration, every decision, marked inherited
		var laterRecord = createActivity(orgId, pit, "Haul fleet diesel, July", "800", "litre", "2025-07-31");
		var copy = mvc.perform(post("/api/ghg/organizations/" + orgId + "/inventories").with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"name": "2025 Equity", "periodStart": "2025-01-01", "periodEnd": "2025-12-31",
					 "consolidationApproach": "EQUITY_SHARE", "copyFromInventoryId": "%s"}""".formatted(source)))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.copiedFromId").value(source))
			.andExpect(jsonPath("$.scope3Categories[0]").value("BUSINESS_TRAVEL"))
			.andReturn();
		String copyId = JsonPath.read(copy.getResponse().getContentAsString(), "$.id");
		mvc.perform(get("/api/ghg/inventories/" + copyId + "/boundary").with(asMember()))
			.andExpect(jsonPath("$[*].facilities[?(@.facilityId == '" + pit + "')].inBoundary").value(true));
		mvc.perform(get("/api/ghg/inventories/" + copyId + "/assignments").with(asMember()))
			.andExpect(jsonPath("$.length()").value(2))
			.andExpect(jsonPath("$[?(@.activityId == '" + diesel + "')].factorName").value("Diesel (100% mineral diesel)"))
			.andExpect(jsonPath("$[?(@.activityId == '" + diesel + "')].inherited").value(true))
			.andExpect(jsonPath("$[?(@.activityId == '" + lpg + "')].exclusionReason").value("METHODOLOGY"))
			.andExpect(jsonPath("$[?(@.activityId == '" + lpg + "')].estimatedKgCo2e").value(750.0));
		mvc.perform(get("/api/ghg/inventories/" + copyId + "/inheritance").with(asMember()))
			.andExpect(jsonPath("$.sourceName").value("2025 Corporate"))
			.andExpect(jsonPath("$.inherited").value(2))
			.andExpect(jsonPath("$.undecided").value(1));
		mvc.perform(get("/api/ghg/inventories/" + source + "/inheritance").with(asMember()))
			.andExpect(status().isNoContent());
		assertThat(laterRecord).isNotNull();

		// a correction needs a reason, inherits the view, and its report says what changed
		freeze(source);
		var publishedRun = runAndGetId(source, "Run 001");
		mvc.perform(post("/api/ghg/inventories/" + source + "/finalize").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"runId": "%s"}""".formatted(publishedRun))).andExpect(status().isOk());
		mvc.perform(post("/api/ghg/inventories/" + source + "/publish").with(asMember()).with(csrf()))
			.andExpect(status().isOk());
		mvc.perform(post("/api/ghg/inventories/" + source + "/supersede").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"name": "2025 Corporate (correction)"}"""))
			.andExpect(status().is(422))
			.andExpect(jsonPath("$.errors.reason").exists());
		var correction = mvc.perform(post("/api/ghg/inventories/" + source + "/supersede").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"name": "2025 Corporate (correction)", "reason": "camp LPG was material after all: 23,530 litres"}"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.correctionReason").value("camp LPG was material after all: 23,530 litres"))
			.andReturn();
		String correctionId = JsonPath.read(correction.getResponse().getContentAsString(), "$.id");
		var correctionListing = body(mvc.perform(get("/api/ghg/inventories/" + correctionId + "/assignments").with(asMember())));
		assertThat(JsonPath.<List<Boolean>>read(correctionListing, "$[?(@.activityId == '" + diesel + "')].inherited").getFirst()).isTrue();
		String lpgInCorrection = JsonPath.<List<String>>read(correctionListing, "$[?(@.activityId == '" + lpg + "')].id").getFirst();
		mvc.perform(put("/api/ghg/assignments/" + lpgInCorrection + "/include").with(asMember()).with(csrf()))
			.andExpect(status().isOk());
		classify(lpgInCorrection, DIESEL_FACTOR);
		mvc.perform(post("/api/ghg/inventories/" + correctionId + "/assignments/sync").with(asMember()).with(csrf()))
			.andExpect(status().isOk());
		var correctionListing2 = body(mvc.perform(get("/api/ghg/inventories/" + correctionId + "/assignments").with(asMember())));
		String julyInCorrection = JsonPath.<List<String>>read(correctionListing2, "$[?(@.activityId == '" + laterRecord + "')].id").getFirst();
		mvc.perform(put("/api/ghg/assignments/" + julyInCorrection + "/exclude").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"reason": "DUPLICATE", "justification": "entered twice from the same dispensing log", "estimatedKgCo2e": 0}"""))
			.andExpect(status().isOk());
		freeze(correctionId);
		var correctedRun = runAndGetId(correctionId, "Corrected run");
		// the published run had one line (diesel, 2,660); the correction adds the LPG line (500 x 2.66 = 1,330)
		mvc.perform(get("/api/ghg/runs/" + correctedRun + "/report").with(asMember()))
			.andExpect(jsonPath("$.correction.ofName").value("2025 Corporate"))
			.andExpect(jsonPath("$.correction.reason").value("camp LPG was material after all: 23,530 litres"))
			.andExpect(jsonPath("$.correction.publishedRunId").value(publishedRun))
			.andExpect(jsonPath("$.correction.addedLines").value(1))
			.andExpect(jsonPath("$.correction.removedLines").value(0))
			.andExpect(jsonPath("$.correction.changedLines").value(0))
			.andExpect(jsonPath("$.correction.deltaKgCo2e").value(1330.0));
		mvc.perform(get("/api/ghg/inventories/" + source + "/events").with(asMember()))
			.andExpect(jsonPath("$[?(@.action == 'CORRECTION_CREATED')].reason")
				.value(org.hamcrest.Matchers.hasItem(org.hamcrest.Matchers.containsString("material after all"))));
	}

	@Test
	void thePublishedReportIsFrozenAndLaterChangesAppearSeparately() throws Exception {
		var orgId = createOrganization("Sankofa Gold plc");
		var pit = createFacility(orgId, "Obuasi Ridge Open Pit");
		var diesel = createActivity(orgId, pit, "Haul fleet diesel", "1000", "litre", "2025-06-30");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, pit);
		prepare(inventoryId, diesel, DIESEL_FACTOR);
		var runId = runAndGetId(inventoryId, "Run 001");
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/finalize").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"runId": "%s"}""".formatted(runId))).andExpect(status().isOk());
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/publish").with(asMember()).with(csrf()))
			.andExpect(status().isOk());
		mvc.perform(get("/api/ghg/runs/" + runId + "/report").with(asMember()))
			.andExpect(jsonPath("$.baseYear").doesNotExist())
			.andExpect(jsonPath("$.sincePublication.events.length()").value(0))
			.andExpect(jsonPath("$.sincePublication.changedRecords.length()").value(0))
			.andExpect(jsonPath("$.lines[0].quantity").value(1000.0));

		// after publication: a base year designated, a later inventory created, the fact corrected
		mvc.perform(put("/api/ghg/organizations/" + orgId + "/base-year").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"inventoryId": "%s", "thresholdPercent": 5, "reason": "first verifiable year",
					 "structuralChangeConvention": "TRANSACTION_DATE"}""".formatted(inventoryId)))
			.andExpect(status().isOk());
		createInventory(orgId, "2026 Corporate", "OPERATIONAL_CONTROL", "2026-01-01", "2026-12-31");
		mvc.perform(put("/api/ghg/activities/" + diesel).with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"facilityId": "%s", "activityType": "Haul fleet diesel", "quantity": 1200, "unit": "litre",
					 "periodStart": "2025-06-30", "periodEnd": "2025-06-30", "dataQuality": "MEASURED",
					 "reason": "dispensing log reconciled after publication"}""".formatted(pit)))
			.andExpect(status().isOk());

		// the published report reads as it was; what came after sits in its own block
		mvc.perform(get("/api/ghg/runs/" + runId + "/report").with(asMember()))
			.andExpect(jsonPath("$.baseYear").doesNotExist())
			.andExpect(jsonPath("$.lines[0].quantity").value(1000.0))
			.andExpect(jsonPath("$.sincePublication.laterInventories[0].name").value("2026 Corporate"))
			.andExpect(jsonPath("$.sincePublication.changedRecords[0].field").value("quantity"))
			.andExpect(jsonPath("$.sincePublication.changedRecords[0].was").value("1000"))
			.andExpect(jsonPath("$.sincePublication.changedRecords[0].now").value("1200"));
		// the published inventory's view shows the fact as published and marks the change
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember()))
			.andExpect(jsonPath("$[0].quantity").value(1000.0))
			.andExpect(jsonPath("$[0].changedSincePublication[0]").value("quantity"));
		mvc.perform(get("/api/ghg/runs/" + runId + "/lines.csv").with(asMember()))
			.andExpect(content().string(org.hamcrest.Matchers.containsString(",1000,")));
	}
	// --- Scope 2 criteria per instrument and the scope 3 cross-check (spec 07.6) -------------

	@Test
	void instrumentsAnswerEachQualityCriterionAndTheDeclarationIsCrossChecked() throws Exception {
		var orgId = createOrganization("Sankofa Gold plc");
		var pit = createFacility(orgId, "Obuasi Ridge Open Pit");
		var power = createActivity(orgId, pit, "Grid electricity", "10000", "kWh", "2025-06-30");
		var flights = createActivity(orgId, pit, "Staff flights", "5000", "passenger-km", "2025-05-10");
		var inventoryId = createInventory(orgId, "2025 Corporate", "OPERATIONAL_CONTROL");
		putBoundary(inventoryId, pit);
		classify(syncAndGetAssignmentId(inventoryId, power), GRID_FACTOR);
		var listing = body(mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember())));
		String flightsAssignment = JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + flights + "')].id").getFirst();
		// business travel: the seeded flight factor
		var factors = body(mvc.perform(get("/api/ghg/organizations/" + orgId + "/emission-factors").with(asMember())));
		String flightFactor = JsonPath.<List<String>>read(factors,
				"$[?(@.defaultCategory == 'BUSINESS_TRAVEL' && @.unit == 'passenger-km' && @.approved == true)].id").getFirst();
		classify(flightsAssignment, flightFactor);

		// an instrument with one criterion unanswered is not applied, and the gate counts it
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/market-factors/" + pit).with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"instrumentType": "CERTIFICATE", "kgCo2ePerKwh": 0, "source": "I-REC(E) Ghana 2025",
					 "criteria": [true, true, null, true, true, true, true, true], "certificateId": "IREC-GH-2025-0417",
					 "registry": "I-TRACK", "vintage": 2025, "coveredKwh": 10000}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.meetsQualityCriteria").value(false))
			.andExpect(jsonPath("$.unansweredCount").value(1))
			.andExpect(jsonPath("$.criteria[2].code").value("RETIRED_FOR_COMPANY"))
			.andExpect(jsonPath("$.criteria[2].answer").value("UNANSWERED"))
			.andExpect(jsonPath("$.certificateId").value("IREC-GH-2025-0417"));
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/market-factors/" + pit).with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"instrumentType": "CERTIFICATE", "kgCo2ePerKwh": 0, "source": "I-REC(E) Ghana 2025",
					 "criteria": [true, true], "coveredKwh": 10000}"""))
			.andExpect(status().is(422))
			.andExpect(jsonPath("$.errors.criteria").exists());
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.gates[3].findings[?(@.severity == 'WARNING')].message")
				.value(org.hamcrest.Matchers.hasItem(org.hamcrest.Matchers.containsString("1 of the eight criteria not yet answered"))));

		// the declaration: business travel has lines but is not declared; investments declared with no lines
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/operational-boundary").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"scope3Categories": ["INVESTMENTS"]}"""))
			.andExpect(status().isOk());
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.gates[2].findings[?(@.severity == 'WARNING')].message")
				.value(org.hamcrest.Matchers.hasItems(
						org.hamcrest.Matchers.containsString("investments is declared as covered but no included record"),
						org.hamcrest.Matchers.containsString("business travel but the declaration does not list it"))));
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/operational-boundary").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"scope3Categories": ["INVESTMENTS", "BUSINESS_TRAVEL"],
					 "notQuantified": [{"category": "INVESTMENTS", "reason": "short"}]}"""))
			.andExpect(status().is(422))
			.andExpect(jsonPath("$.errors.notQuantified").exists());
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/operational-boundary").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"scope3Categories": ["INVESTMENTS", "BUSINESS_TRAVEL"],
					 "notQuantified": [{"category": "INVESTMENTS", "reason": "the associate reports its own inventory; equity share quantified from its 2025 report"}]}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.scope3NotQuantified[0].category").value("INVESTMENTS"));
		mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember()))
			.andExpect(jsonPath("$.gates[2].findings[?(@.message =~ /.*declared as covered.*/)]").isEmpty())
			.andExpect(jsonPath("$.gates[2].findings[?(@.message =~ /.*does not list it.*/)]").isEmpty());

		// every criterion met: the instrument applies, and the report lists the outcomes and the declaration table
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/market-factors/" + pit).with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"instrumentType": "CERTIFICATE", "kgCo2ePerKwh": 0, "source": "I-REC(E) Ghana 2025",
					 "criteria": [true, true, true, true, true, true, true, true], "certificateId": "IREC-GH-2025-0417",
					 "registry": "I-TRACK", "vintage": 2025, "retirementDate": "2026-01-15", "coveredKwh": 10000}"""))
			.andExpect(jsonPath("$.meetsQualityCriteria").value(true))
			.andExpect(jsonPath("$.unansweredCount").value(0));
		freeze(inventoryId);
		var preflight = body(mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/validation").with(asMember())));
		assertThat(JsonPath.<Boolean>read(preflight, "$.ready")).as(preflight).isTrue();
		var runId = runAndGetId(inventoryId, "Run 001");
		mvc.perform(get("/api/ghg/runs/" + runId + "/report").with(asMember()))
			.andExpect(jsonPath("$.emissions.scope2MarketBasedKgCo2e").value(0.0))
			.andExpect(jsonPath("$.emissions.marketInstruments[0].criteria.length()").value(8))
			.andExpect(jsonPath("$.emissions.marketInstruments[0].retirementDate").value("2026-01-15"))
			.andExpect(jsonPath("$.byScope3Category[?(@.category == 'INVESTMENTS')].lineCount").value(0))
			.andExpect(jsonPath("$.byScope3Category[?(@.category == 'INVESTMENTS')].notQuantifiedReason")
				.value(org.hamcrest.Matchers.hasItem(org.hamcrest.Matchers.startsWith("the associate reports"))))
			.andExpect(jsonPath("$.byScope3Category[?(@.category == 'BUSINESS_TRAVEL')].declared").value(true))
			.andExpect(jsonPath("$.byScope3Category[?(@.category == 'BUSINESS_TRAVEL')].lineCount").value(1))
			.andExpect(jsonPath("$.operationalBoundary.notQuantified[0].category").value("INVESTMENTS"));
		mvc.perform(get("/api/ghg/runs/" + runId + "/report.pdf").with(asMember())).andExpect(status().isOk());
	}
}
