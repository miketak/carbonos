package com.carbonos.ghg;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import com.carbonos.TestcontainersConfiguration;
import com.carbonos.ghg.internal.ActivityRecordRepository;
import com.carbonos.ghg.internal.BoundaryTreatmentRepository;
import com.carbonos.ghg.internal.BoundaryVersionRepository;
import com.carbonos.ghg.internal.EmissionFactorRepository;
import com.carbonos.ghg.internal.FacilityRepository;
import com.carbonos.ghg.internal.FactorPackEditionRepository;
import com.carbonos.ghg.internal.FactorPackFamilyRepository;
import com.carbonos.ghg.internal.FactorPackNoticeRepository;
import com.carbonos.ghg.internal.GhgRunRepository;
import com.carbonos.ghg.internal.InventoryAssignmentRepository;
import com.carbonos.ghg.internal.InventoryRepository;
import com.carbonos.ghg.internal.LegalEntityRepository;
import com.carbonos.ghg.internal.OrganizationRepository;
import com.carbonos.user.AuthenticatedUser;
import com.jayway.jsonpath.JsonPath;

/**
 * Importing an edition as an organization's factors (spec 02.6). A publication
 * row identifier is a lineage, not a row: the import cuts a version dated from
 * the edition's applies-from day instead of overwriting the values a client
 * already calculated with.
 *
 * <p>The invariant the whole spec rests on is the one
 * {@link #aPastRunKeepsItsFiguresAfterAVersioningImport} asserts: versioning
 * cannot reach a figure that was already reported.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class FactorPackImportIntegrationTests {

	private static final String FAMILY = "importtest";

	private static final String FIRST = "importtest-2026";

	private static final String SECOND = "importtest-2027";

	/** The 2025 edition, an earlier vintage published after the 2026 one (spec 02.6 rule 8). */
	private static final String EARLIER = "importtest-2025";

	/** A second family whose edition selects a row {@link #FIRST} already delivered (spec 02.3). */
	private static final String SELECTION_FAMILY = "selectiontest";

	private static final String SELECTION = "selectiontest-2026";

	private static final String DIESEL = "TEST:diesel";

	private static final String PETROL = "TEST:petrol";

	private static final String COAL = "TEST:coal";

	@Autowired
	MockMvc mvc;

	@Autowired
	FactorPackFamilyRepository families;

	@Autowired
	FactorPackEditionRepository editions;

	@Autowired
	FactorPackNoticeRepository notices;

	@Autowired
	EmissionFactorRepository emissionFactors;

	@Autowired
	OrganizationRepository organizations;

	@Autowired
	InventoryRepository inventories;

	@Autowired
	InventoryAssignmentRepository assignments;

	@Autowired
	GhgRunRepository runs;

	@Autowired
	FacilityRepository facilities;

	@Autowired
	ActivityRecordRepository activities;

	@Autowired
	LegalEntityRepository entities;

	@Autowired
	BoundaryVersionRepository boundaryVersions;

	@Autowired
	BoundaryTreatmentRepository boundaryTreatments;

	@Autowired
	org.springframework.jdbc.core.JdbcTemplate jdbc;

	private final UUID curatorId = UUID.randomUUID();

	private final UUID approverId = UUID.randomUUID();

	private final UUID memberId = UUID.randomUUID();

	RequestPostProcessor asCurator() {
		return user(new AuthenticatedUser(curatorId, "ama@ecoriv.com", "irrelevant", "ADMIN", true));
	}

	RequestPostProcessor asApprover() {
		return user(new AuthenticatedUser(approverId, "kofi@ecoriv.com", "irrelevant", "ADMIN", true));
	}

	RequestPostProcessor asMember() {
		return user(new AuthenticatedUser(memberId, "kojo@ecoriv.com", "irrelevant", "MEMBER", true));
	}

	@BeforeEach
	@AfterEach
	void reset() {
		runs.deleteAll();
		assignments.deleteAll();
		boundaryTreatments.deleteAll();
		boundaryVersions.deleteAll();
		inventories.deleteAll();
		activities.deleteAll();
		facilities.deleteAll();
		entities.deleteAll();
		organizations.deleteAll();
		// the two seeded editions stay; everything this class published goes, newest first, because a
		// successor holds a foreign key to the predecessor it superseded
		notices.deleteAll();
		for (var family : java.util.List.of(FAMILY, SELECTION_FAMILY)) {
			var written = new java.util.ArrayList<>(editions.findAllByPackKeyOrderByEditionIdAsc(family));
			java.util.Collections.reverse(written);
			for (var edition : written) {
				editions.delete(edition);
				editions.flush();
			}
			families.findById(family).ifPresent(families::delete);
		}
	}

	// --- the catalogue fixture ----------------------------------------------

	String body(ResultActions actions) throws Exception {
		return actions.andReturn().getResponse().getContentAsString();
	}

	private static String row(String code, String name, String unit, String value, int year) {
		return """
				{"code": "%s", "name": "%s", "defaultScope": "SCOPE_1",
				 "defaultCategory": "STATIONARY_COMBUSTION", "scopeAgnostic": true, "unit": "%s",
				 "dataYear": %d, "sourcePublication": "A test publication, %d tables",
				 "sourceUrl": "https://example.test/tables-%d.xlsx", "publicationYear": %d,
				 "sourceCategory": "Fuels", "sourceActivity": "Liquid fuels / %s",
				 "approved": true, "kgCo2ePerUnit": %s, "co2KgPerUnit": %s}"""
			.formatted(code, name, unit, year, year, year, year, name, value, value);
	}

	ResultActions addRow(String editionId, String json) throws Exception {
		return mvc.perform(post("/api/admin/factor-packs/editions/" + editionId + "/rows").with(asCurator())
			.with(csrf())
			.contentType("application/json")
			.content(json));
	}

	void createDraft(String editionId, String cloneFrom, int year, String appliesFrom) throws Exception {
		var clone = cloneFrom == null ? "null" : "\"" + cloneFrom + "\"";
		mvc.perform(post("/api/admin/factor-packs/" + FAMILY + "/editions").with(asCurator()).with(csrf())
			.contentType("application/json")
			.content("""
					{"editionId": "%s", "cloneFrom": %s, "name": "A test publication %d",
					 "source": "A test publication, %d tables",
					 "sourceUrl": "https://example.test/tables-%d.xlsx",
					 "publicationYear": %d, "gwpBasis": "AR5", "license": "Test licence",
					 "retrieved": "%d-01-04", "notes": "For the tests.", "appliesFrom": "%s"}"""
				.formatted(editionId, clone, year, year, year, year, year, appliesFrom)))
			.andExpect(status().isCreated());
	}

	void uploadEvidence(String editionId, String content) throws Exception {
		var file = new MockMultipartFile("file", "tables.pdf", "application/pdf",
				content.getBytes(StandardCharsets.UTF_8));
		mvc.perform(multipart("/api/admin/factor-packs/editions/" + editionId + "/evidence").file(file)
			.with(asCurator())
			.with(csrf())).andExpect(status().isOk());
	}

	void publish(String editionId, String appliesFrom) throws Exception {
		mvc.perform(post("/api/admin/factor-packs/editions/" + editionId + "/publish").with(asApprover())
			.with(csrf())
			.contentType("application/json")
			.content("""
					{"sourceDocument": "A test publication (PDF)", "appliesFrom": "%s"}""".formatted(appliesFrom)))
			.andExpect(status().isOk());
	}

	/** The 2026 edition, published and applying from 2026-01-01: diesel, petrol and coal. */
	void publishTheFirstEdition() throws Exception {
		mvc.perform(post("/api/admin/factor-packs").with(asCurator()).with(csrf()).contentType("application/json")
			.content("""
					{"packKey": "%s", "name": "A test publication", "kind": "SOURCE",
					 "summary": "Written by a test."}""".formatted(FAMILY))).andExpect(status().isCreated());
		createDraft(FIRST, null, 2026, "2026-01-01");
		addRow(FIRST, row(DIESEL, "Diesel", "litre", "2.66", 2026)).andExpect(status().isCreated());
		addRow(FIRST, row(PETROL, "Petrol", "litre", "2.31", 2026)).andExpect(status().isCreated());
		addRow(FIRST, row(COAL, "Coal", "tonne", "2400", 2026)).andExpect(status().isCreated());
		uploadEvidence(FIRST, "The 2026 tables, as published.");
		publish(FIRST, "2026-01-01");
	}

	/**
	 * The 2027 edition, applying from the date given: diesel moves 2.66 to 2.80,
	 * petrol stands still with the same provenance, coal is dropped and LPG is
	 * new.
	 */
	void publishTheSecondEdition(String appliesFrom) throws Exception {
		createDraft(SECOND, FIRST, 2027, appliesFrom);
		var rows = body(mvc.perform(get("/api/admin/factor-packs/editions/" + SECOND + "/rows").with(asCurator())
			.param("size", "200")).andExpect(status().isOk()));
		var dieselId = JsonPath.<List<String>>read(rows, "$.items[?(@.code == '" + DIESEL + "')].id").getFirst();
		var coalId = JsonPath.<List<String>>read(rows, "$.items[?(@.code == '" + COAL + "')].id").getFirst();
		mvc.perform(put("/api/admin/factor-packs/editions/" + SECOND + "/rows/" + dieselId).with(asCurator())
			.with(csrf())
			.contentType("application/json")
			.content(row(DIESEL, "Diesel", "litre", "2.80", 2026))).andExpect(status().isOk());
		mvc.perform(delete("/api/admin/factor-packs/editions/" + SECOND + "/rows/" + coalId).with(asCurator())
			.with(csrf())).andExpect(status().isNoContent());
		addRow(SECOND, row("TEST:lpg", "LPG", "litre", "1.56", 2027)).andExpect(status().isCreated());
		uploadEvidence(SECOND, "The 2027 tables, as published.");
		publish(SECOND, appliesFrom);
	}

	/**
	 * The 2025 edition, published after the 2026 one and applying from
	 * 2025-01-01: diesel at 2.50 and petrol at 2.31, no coal.
	 */
	void publishTheEarlierEdition() throws Exception {
		createDraft(EARLIER, null, 2025, "2025-01-01");
		addRow(EARLIER, row(DIESEL, "Diesel", "litre", "2.50", 2025)).andExpect(status().isCreated());
		addRow(EARLIER, row(PETROL, "Petrol", "litre", "2.31", 2025)).andExpect(status().isCreated());
		uploadEvidence(EARLIER, "The 2025 tables, as published.");
		publish(EARLIER, "2025-01-01");
	}

	// --- the tenant fixture -------------------------------------------------

	String createOrganization(String name) throws Exception {
		return JsonPath.read(body(mvc
			.perform(post("/api/ghg/organizations").with(asMember()).with(csrf()).contentType("application/json")
				.content("""
						{"name": "%s"}""".formatted(name)))
			.andExpect(status().isCreated())), "$.id");
	}

	String createFacility(String orgId) throws Exception {
		return JsonPath.read(body(mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/facilities").with(asMember()).with(csrf())
				.contentType("application/json")
				.content("""
						{"name": "Tema Plant", "location": "Tema, Ghana", "entityId": null}"""))
			.andExpect(status().isCreated())), "$.id");
	}

	String importEdition(String orgId, String editionId) throws Exception {
		return body(mvc.perform(post("/api/ghg/organizations/" + orgId + "/factor-packs/" + editionId + "/import")
			.with(asMember()).with(csrf())).andExpect(status().isOk()));
	}

	/**
	 * An inventory over the period given, with 1,000 litres of diesel recorded
	 * in it and classified with the diesel lineage. Frozen and run, its total is
	 * 2,660 kg CO2e on the 2026 edition.
	 */
	String inventoryWithDiesel(String orgId, String facilityId, String name, String start, String end)
			throws Exception {
		var activityId = JsonPath.<String>read(body(mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/activities").with(asMember()).with(csrf())
				.contentType("application/json")
				.content("""
						{"facilityId": "%s", "activityType": "Diesel", "quantity": 1000, "unit": "litre",
						 "periodStart": "%s", "periodEnd": "%s", "dataSource": "Fuel invoice",
						 "evidenceRef": "INV-2938", "dataQuality": "MEASURED"}""".formatted(facilityId, start, start)))
			.andExpect(status().isCreated())), "$.id");
		var inventoryId = JsonPath.<String>read(body(mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/inventories").with(asMember()).with(csrf())
				.contentType("application/json")
				.content("""
						{"name": "%s", "periodStart": "%s", "periodEnd": "%s", "purpose": "Corporate reporting",
						 "consolidationApproach": "OPERATIONAL_CONTROL"}""".formatted(name, start, end)))
			.andExpect(status().isCreated())), "$.id");
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/boundary/" + facilityId).with(asMember())
			.with(csrf()).contentType("application/json").content("{}")).andExpect(status().isOk());
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/assignments/sync").with(asMember()).with(csrf()))
			.andExpect(status().isOk());
		var listing = body(mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember()))
			.andExpect(status().isOk()));
		var assignmentId = JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + activityId + "')].id")
			.getFirst();
		mvc.perform(put("/api/ghg/assignments/" + assignmentId + "/classify").with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"emissionFactorId": "%s"}""".formatted(factorId(orgId, DIESEL)))).andExpect(status().isOk());
		return inventoryId;
	}

	/** Freezes the inventory and completes one run over it. */
	String freezeAndRun(String inventoryId) throws Exception {
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/freeze").with(asMember()).with(csrf()))
			.andExpect(status().isOk());
		return JsonPath.read(body(mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/runs").with(asMember())
			.with(csrf()).contentType("application/json").content("""
					{"label": "First run"}""")).andExpect(status().isCreated())), "$.run.id");
	}

	/** The live version of a lineage: the one nothing has replaced. */
	com.carbonos.ghg.internal.EmissionFactor live(String organizationId, String code) {
		return versionsOf(organizationId, code).stream()
			.filter(com.carbonos.ghg.internal.EmissionFactor::isLive)
			.findFirst()
			.orElseThrow(() -> new AssertionError("no live version for " + code));
	}

	/** Every version of a lineage the organization holds, oldest first. */
	List<com.carbonos.ghg.internal.EmissionFactor> versionsOf(String organizationId, String code) {
		return emissionFactors.findAllByOrganizationIdAndPackCodeIsNotNull(UUID.fromString(organizationId))
			.stream()
			.filter(factor -> code.equals(factor.getPackCode()))
			.sorted(java.util.Comparator.comparing(com.carbonos.ghg.internal.EmissionFactor::getValidFrom,
					java.util.Comparator.nullsFirst(java.util.Comparator.naturalOrder())))
			.toList();
	}

	String factorId(String organizationId, String code) {
		return live(organizationId, code).getId().toString();
	}

	// --- versioning ---------------------------------------------------------

	@Test
	void importingALaterEditionVersionsTheRowAndClosesTheIncumbent() throws Exception {
		publishTheFirstEdition();
		var orgId = createOrganization("Asante Gold Resources");
		var first = importEdition(orgId, FIRST);
		assertThat(JsonPath.<Integer>read(first, "$.created")).isEqualTo(3);
		assertThat(JsonPath.<String>read(first, "$.edition")).isEqualTo(FIRST);
		assertThat(JsonPath.<String>read(first, "$.appliesFrom")).isEqualTo("2026-01-01");

		publishTheSecondEdition("2027-01-01");
		var second = importEdition(orgId, SECOND);
		// diesel moved, LPG is new, petrol is identical and only gains the tag, coal is discontinued
		assertThat(JsonPath.<Integer>read(second, "$.versioned")).isEqualTo(1);
		assertThat(JsonPath.<Integer>read(second, "$.created")).isEqualTo(1);
		assertThat(JsonPath.<Integer>read(second, "$.tagged")).isEqualTo(1);
		assertThat(JsonPath.<List<String>>read(second, "$.discontinued")).containsExactly(COAL);

		var versions = versionsOf(orgId, DIESEL);
		assertThat(versions).hasSize(2);
		var incumbent = versions.getFirst();
		var cut = versions.getLast();
		assertThat(incumbent.getKgCo2ePerUnit()).isEqualByComparingTo("2.66");
		assertThat(incumbent.getValidFrom()).isEqualTo(java.time.LocalDate.of(2026, 1, 1));
		assertThat(incumbent.getValidTo()).isEqualTo(java.time.LocalDate.of(2026, 12, 31));
		assertThat(incumbent.getSupersededById()).isEqualTo(cut.getId());
		assertThat(incumbent.getSourceEdition()).isEqualTo(FIRST);
		assertThat(cut.getKgCo2ePerUnit()).isEqualByComparingTo("2.80");
		assertThat(cut.getValidFrom()).isEqualTo(java.time.LocalDate.of(2027, 1, 1));
		assertThat(cut.getValidTo()).isNull();
		assertThat(cut.getSourceEdition()).isEqualTo(SECOND);
		assertThat(cut.isLive()).isTrue();
		// approval is a decision about the lineage, so it carries forward
		assertThat(cut.isApproved()).isTrue();
		// the new version carries both tags: the edition that delivered it and the one before it
		assertThat(cut.getPacks()).contains(FIRST, SECOND);

		// petrol did not move, so it gained the tag and cut no version
		assertThat(versionsOf(orgId, PETROL)).hasSize(1);
		assertThat(live(orgId, PETROL).getSourceEdition()).isEqualTo(SECOND);

		// and the page shows the chain, so a preparer can see which vintage applies
		var page = body(mvc.perform(get("/api/ghg/organizations/" + orgId + "/emission-factors").with(asMember())
			.param("size", "200")).andExpect(status().isOk()));
		assertThat(JsonPath.<List<List<Object>>>read(page,
				"$.items[?(@.packCode == '" + DIESEL + "' && @.validFrom == '2027-01-01')].versions").getFirst())
			.hasSize(2);
	}

	@Test
	void reimportingTheSameEditionIsIdempotent() throws Exception {
		publishTheFirstEdition();
		var orgId = createOrganization("Asante Gold Resources");
		importEdition(orgId, FIRST);
		var again = importEdition(orgId, FIRST);
		assertThat(JsonPath.<Integer>read(again, "$.created")).isZero();
		assertThat(JsonPath.<Integer>read(again, "$.versioned")).isZero();
		assertThat(JsonPath.<Integer>read(again, "$.tagged")).isZero();
		assertThat(JsonPath.<Integer>read(again, "$.unchanged")).isEqualTo(3);
		assertThat(versionsOf(orgId, DIESEL)).hasSize(1);
		assertThat(live(orgId, DIESEL).getValidTo()).isNull();
	}

	@Test
	void aLocallyEditedRowIsNeverTouchedAndIsReportedAsAConflict() throws Exception {
		publishTheFirstEdition();
		var orgId = createOrganization("Asante Gold Resources");
		importEdition(orgId, FIRST);
		var dieselId = factorId(orgId, DIESEL);
		// the preparer corrects the row against a supplier's own analysis
		mvc.perform(put("/api/ghg/emission-factors/" + dieselId).with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"name": "Diesel (GOIL analysis 2026)", "defaultScope": "SCOPE_1",
					 "defaultCategory": "STATIONARY_COMBUSTION", "scopeAgnostic": true, "unit": "litre",
					 "kgCo2ePerUnit": 2.71, "co2KgPerUnit": 2.71, "source": "GOIL fuel analysis 2026-03",
					 "approved": true}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.locallyEdited").value(true));

		publishTheSecondEdition("2027-01-01");
		var result = importEdition(orgId, SECOND);
		assertThat(JsonPath.<List<String>>read(result, "$.conflicts")).containsExactly(DIESEL);
		assertThat(JsonPath.<Integer>read(result, "$.versioned")).isZero();
		// the row is exactly as the preparer left it: one version, their value, their name
		assertThat(versionsOf(orgId, DIESEL)).hasSize(1);
		assertThat(live(orgId, DIESEL).getKgCo2ePerUnit()).isEqualByComparingTo("2.71");
		assertThat(live(orgId, DIESEL).getName()).isEqualTo("Diesel (GOIL analysis 2026)");
	}

	@Test
	void importIsRefusedWhileAPeriodIsFrozenFinalOrPublished() throws Exception {
		publishTheFirstEdition();
		var orgId = createOrganization("Asante Gold Resources");
		importEdition(orgId, FIRST);
		var facilityId = createFacility(orgId);
		var inventoryId = inventoryWithDiesel(orgId, facilityId, "2026 Corporate", "2026-01-01", "2026-06-30");
		freezeAndRun(inventoryId);

		// the edition would apply inside a period the organization has already reported on
		publishTheSecondEdition("2026-03-01");
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/factor-packs/" + SECOND + "/import").with(asMember())
			.with(csrf()))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("2026 Corporate")))
			.andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("FROZEN")));
		// nothing was written: the organization still holds exactly what it held
		assertThat(versionsOf(orgId, DIESEL)).hasSize(1);
		assertThat(live(orgId, DIESEL).getSourceEdition()).isEqualTo(FIRST);
		assertThat(emissionFactors.findAllByOrganizationIdAndPackCodeIsNotNull(UUID.fromString(orgId))).hasSize(3);
	}

	@Test
	void aDiscontinuedLineageIsReportedAndNeverRetiredSilently() throws Exception {
		publishTheFirstEdition();
		var orgId = createOrganization("Asante Gold Resources");
		importEdition(orgId, FIRST);
		publishTheSecondEdition("2027-01-01");
		var result = importEdition(orgId, SECOND);

		assertThat(JsonPath.<List<String>>read(result, "$.discontinued")).containsExactly(COAL);
		// the coal row is reported, and it is left exactly as it was: nothing retired it
		var coal = live(orgId, COAL);
		assertThat(coal.getValidTo()).isNull();
		assertThat(coal.getSourceEdition()).isEqualTo(FIRST);
		assertThat(versionsOf(orgId, COAL)).hasSize(1);
	}

	@Test
	void aPastRunKeepsItsFiguresAfterAVersioningImport() throws Exception {
		publishTheFirstEdition();
		var orgId = createOrganization("Asante Gold Resources");
		importEdition(orgId, FIRST);
		var facilityId = createFacility(orgId);
		var inventoryId = inventoryWithDiesel(orgId, facilityId, "2026", "2026-01-01", "2026-12-31");
		var runId = freezeAndRun(inventoryId);
		mvc.perform(get("/api/ghg/runs/" + runId + "/report").with(asMember()))
			.andExpect(jsonPath("$.run.totalKgCo2e").value(2660.0));

		publishTheSecondEdition("2027-01-01");
		importEdition(orgId, SECOND);

		// the run is a snapshot: its total, its line and its factor table are what they were
		mvc.perform(get("/api/ghg/runs/" + runId + "/report").with(asMember()))
			.andExpect(jsonPath("$.run.totalKgCo2e").value(2660.0))
			.andExpect(jsonPath("$.lines[0].kgCo2ePerUnit").value(2.66))
			.andExpect(jsonPath("$.factors[0].kgCo2ePerUnit").value(2.66))
			.andExpect(jsonPath("$.factors[0].sourceEdition").value(FIRST))
			// spec 07.7: the by-gas table still foots to the same total
			.andExpect(jsonPath("$.byGasTotalKgCo2e").value(2660.0));
		assertThat(runs.findById(UUID.fromString(runId)).orElseThrow().getTotalKgCo2e())
			.isEqualByComparingTo("2660.000");
	}

	@Test
	void retirementDatesSurviveAnImport() throws Exception {
		publishTheFirstEdition();
		var orgId = createOrganization("Asante Gold Resources");
		importEdition(orgId, FIRST);
		// the preparer retires the row on the day the site stopped burning it
		mvc.perform(put("/api/ghg/emission-factors/" + factorId(orgId, DIESEL)).with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"name": "Diesel", "defaultScope": "SCOPE_1", "defaultCategory": "STATIONARY_COMBUSTION",
					 "scopeAgnostic": true, "unit": "litre", "kgCo2ePerUnit": 2.66, "co2KgPerUnit": 2.66,
					 "source": "A test publication, 2026 tables", "validFrom": "2026-01-01",
					 "validTo": "2026-06-30", "approved": true}""")).andExpect(status().isOk());

		publishTheSecondEdition("2027-01-01");
		importEdition(orgId, SECOND);

		var diesel = live(orgId, DIESEL);
		assertThat(diesel.getValidTo()).isEqualTo(java.time.LocalDate.of(2026, 6, 30));
		assertThat(versionsOf(orgId, DIESEL)).hasSize(1);
	}

	/**
	 * A version closed before the edition applies keeps its end date. The
	 * closure here is written straight to the row, as a version closed by an
	 * earlier cut is, so the guard is tested rather than the local-edit rule
	 * that would otherwise stop the import first.
	 */
	@Test
	void anEarlierRetirementIsNeverExtendedByAnImport() throws Exception {
		publishTheFirstEdition();
		var orgId = createOrganization("Asante Gold Resources");
		importEdition(orgId, FIRST);
		jdbc.update("UPDATE ghg_emission_factors SET valid_to = DATE '2026-06-30' WHERE id = ?::uuid",
				factorId(orgId, DIESEL));

		publishTheSecondEdition("2027-01-01");
		importEdition(orgId, SECOND);

		var versions = versionsOf(orgId, DIESEL);
		assertThat(versions).hasSize(2);
		assertThat(versions.getFirst().getValidTo()).isEqualTo(java.time.LocalDate.of(2026, 6, 30));
		assertThat(versions.getLast().getValidFrom()).isEqualTo(java.time.LocalDate.of(2027, 1, 1));
	}

	@Test
	void aPackDerivedFactorCannotBeDeletedOnlyRetired() throws Exception {
		publishTheFirstEdition();
		var orgId = createOrganization("Asante Gold Resources");
		importEdition(orgId, FIRST);
		var coalId = factorId(orgId, COAL);
		// nothing classified with it and no run applied it, and it still cannot be deleted
		mvc.perform(delete("/api/ghg/emission-factors/" + coalId).with(asMember()).with(csrf()))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("never deleted")))
			.andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("retire")));
		// it retires by its validity end, and stays on file
		mvc.perform(put("/api/ghg/emission-factors/" + coalId).with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"name": "Coal", "defaultScope": "SCOPE_1", "defaultCategory": "STATIONARY_COMBUSTION",
					 "scopeAgnostic": true, "unit": "tonne", "kgCo2ePerUnit": 2400, "co2KgPerUnit": 2400,
					 "source": "A test publication, 2026 tables", "validTo": "2026-12-31", "approved": true}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.validTo").value("2026-12-31"));
		assertThat(emissionFactors.findById(UUID.fromString(coalId))).isPresent();
	}

	@Test
	void aRunNamesTheEditionAndVintageBehindEveryLine() throws Exception {
		publishTheFirstEdition();
		var orgId = createOrganization("Asante Gold Resources");
		importEdition(orgId, FIRST);
		var facilityId = createFacility(orgId);
		var runId = freezeAndRun(inventoryWithDiesel(orgId, facilityId, "2026", "2026-01-01", "2026-12-31"));

		mvc.perform(get("/api/ghg/runs/" + runId + "/report").with(asMember()))
			.andExpect(jsonPath("$.factors[0].sourceEdition").value(FIRST))
			.andExpect(jsonPath("$.factors[0].validFrom").value("2026-01-01"));
		// and the frozen inputs of spec 07.5 carry them, so the export names the vintage too
		mvc.perform(get("/api/ghg/runs/" + runId + "/inputs.json").with(asMember()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.factors[0].sourceEdition").value(FIRST))
			.andExpect(jsonPath("$.factors[0].validFrom").value("2026-01-01"));

		// a run made before versioning reads as unknown rather than being credited to an edition
		jdbc.update("UPDATE ghg_run_factors SET source_edition = NULL, valid_from = NULL WHERE run_id = ?::uuid",
				runId);
		mvc.perform(get("/api/ghg/runs/" + runId + "/report").with(asMember()))
			.andExpect(jsonPath("$.factors[0].sourceEdition").value(org.hamcrest.Matchers.nullValue()))
			.andExpect(jsonPath("$.factors[0].validFrom").value(org.hamcrest.Matchers.nullValue()));
	}

	@Test
	void anAppliesFromInsideAnOpenPeriodIsReportedAsASplitPeriod() throws Exception {
		publishTheFirstEdition();
		var orgId = createOrganization("Asante Gold Resources");
		importEdition(orgId, FIRST);
		var facilityId = createFacility(orgId);
		// a fiscal year that straddles the day the next edition applies
		var inventoryId = inventoryWithDiesel(orgId, facilityId, "FY2026", "2026-01-01", "2026-09-30");

		// the edition applies in the middle of an open draft's period, so one year would be on two editions
		publishTheSecondEdition("2026-07-01");
		var result = importEdition(orgId, SECOND);
		assertThat(JsonPath.<List<String>>read(result, "$.splitPeriods[*].name")).containsExactly("FY2026");
		assertThat(JsonPath.<List<String>>read(result, "$.splitPeriods[*].inventoryId")).containsExactly(inventoryId);
	}

	@Test
	void aSplitPeriodDraftMovesOnlyRecordsFromTheAppliesFromDate() throws Exception {
		publishTheFirstEdition();
		var orgId = createOrganization("Asante Gold Resources");
		importEdition(orgId, FIRST);
		var facilityId = createFacility(orgId);
		var before = factorId(orgId, DIESEL);
		// a fiscal year the next edition splits: one record before the date, one after, both on the incumbent
		var inventoryId = inventoryWithDiesel(orgId, facilityId, "FY2026", "2026-01-01", "2026-09-30");
		var augustActivity = JsonPath.<String>read(body(mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/activities").with(asMember()).with(csrf())
				.contentType("application/json")
				.content("""
						{"facilityId": "%s", "activityType": "Diesel", "quantity": 1000, "unit": "litre",
						 "periodStart": "2026-08-01", "periodEnd": "2026-08-31", "dataSource": "Fuel invoice",
						 "evidenceRef": "INV-2939", "dataQuality": "MEASURED"}""".formatted(facilityId)))
			.andExpect(status().isCreated())), "$.id");
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/assignments/sync").with(asMember()).with(csrf()))
			.andExpect(status().isOk());
		var listing = body(mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember())));
		var august = JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + augustActivity + "')].id")
			.getFirst();
		mvc.perform(put("/api/ghg/assignments/" + august + "/classify").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"emissionFactorId": "%s"}""".formatted(before))).andExpect(status().isOk());

		publishTheSecondEdition("2026-07-01");
		var result = importEdition(orgId, SECOND);
		var after = factorId(orgId, DIESEL);
		// spec 02.6 rule 7: the August record moves to the new vintage, the January one keeps the old
		assertThat(JsonPath.<List<Integer>>read(result, "$.moved[*].assignments")).containsExactly(1);
		var moved = body(mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember())));
		assertThat(JsonPath.<List<String>>read(moved, "$[?(@.id == '" + august + "')].emissionFactorId"))
			.containsExactly(after);
		assertThat(JsonPath.<List<String>>read(moved, "$[?(@.id != '" + august + "')].emissionFactorId"))
			.containsExactly(before);
		// the run names both editions in its factor table
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/freeze").with(asMember()).with(csrf()))
			.andExpect(status().isOk());
		var run = body(mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/runs").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"label": "Two vintages"}""")).andExpect(status().isCreated()));
		mvc.perform(get("/api/ghg/runs/" + JsonPath.read(run, "$.run.id") + "/report").with(asMember()))
			.andExpect(jsonPath("$.factors[*].sourceEdition").value(org.hamcrest.Matchers.hasItems(FIRST, SECOND)));
	}

	/**
	 * Spec 02.6 rule 8: an earlier vintage arriving late. The organization
	 * holds the 2026 versions and imports the 2025 edition, so each 2025 row
	 * is written behind its 2026 version, ends the day before it begins and
	 * is superseded by it; the 2026 versions keep their dates and stay live.
	 * The draft for 2025 follows the vintage of its year, the draft for 2026
	 * keeps the version it had, and a lineage the 2025 edition never had is
	 * not "discontinued" by it.
	 */
	@Test
	void anEarlierEditionFillsInBehindTheVersionsTheOrganizationHolds() throws Exception {
		publishTheFirstEdition();
		var orgId = createOrganization("Asante Gold Resources");
		importEdition(orgId, FIRST);
		var facilityId = createFacility(orgId);
		var held = factorId(orgId, DIESEL);
		// both drafts are classified on the only diesel version there is
		var fy2025 = inventoryWithDiesel(orgId, facilityId, "FY2025", "2025-01-01", "2025-12-31");
		var fy2026 = inventoryWithDiesel(orgId, facilityId, "FY2026", "2026-01-01", "2026-12-31");

		publishTheEarlierEdition();
		var result = importEdition(orgId, EARLIER);
		assertThat(JsonPath.<String>read(result, "$.appliesFrom")).isEqualTo("2025-01-01");
		assertThat(JsonPath.<Integer>read(result, "$.versioned")).isEqualTo(2);
		assertThat(JsonPath.<Integer>read(result, "$.created")).isEqualTo(0);
		assertThat(JsonPath.<Integer>read(result, "$.tagged")).isEqualTo(0);
		// coal came with the 2026 edition, which the 2025 one cannot drop
		assertThat(JsonPath.<List<String>>read(result, "$.discontinued")).isEmpty();
		assertThat(JsonPath.<List<String>>read(result, "$.splitPeriods")).isEmpty();

		var versions = versionsOf(orgId, DIESEL);
		assertThat(versions).hasSize(2);
		var behind = versions.getFirst();
		var live = versions.getLast();
		assertThat(live.getId().toString()).isEqualTo(held);
		assertThat(live.getValidFrom()).isEqualTo(java.time.LocalDate.of(2026, 1, 1));
		assertThat(live.getValidTo()).isNull();
		assertThat(live.isLive()).isTrue();
		assertThat(live.getSourceEdition()).isEqualTo(FIRST);
		assertThat(live.getKgCo2ePerUnit()).isEqualByComparingTo("2.66");
		assertThat(behind.getKgCo2ePerUnit()).isEqualByComparingTo("2.50");
		assertThat(behind.getValidFrom()).isEqualTo(java.time.LocalDate.of(2025, 1, 1));
		assertThat(behind.getValidTo()).isEqualTo(java.time.LocalDate.of(2025, 12, 31));
		assertThat(behind.getSupersededById()).isEqualTo(live.getId());
		assertThat(behind.getSourceEdition()).isEqualTo(EARLIER);
		assertThat(behind.isApproved()).isTrue();
		assertThat(factorId(orgId, DIESEL)).isEqualTo(held);

		// the 2025 draft moved to the 2025 vintage; the 2026 draft did not move
		assertThat(JsonPath.<List<String>>read(result, "$.moved[*].name")).containsExactly("FY2025");
		assertThat(JsonPath.<List<Integer>>read(result, "$.moved[*].assignments")).containsExactly(1);
		var early = body(mvc.perform(get("/api/ghg/inventories/" + fy2025 + "/assignments").with(asMember())));
		assertThat(JsonPath.<List<String>>read(early, "$[*].emissionFactorId"))
			.containsExactly(behind.getId().toString());
		// the 2026 draft also lists the 2025 record, excluded as outside its period and unclassified
		var later = body(mvc.perform(get("/api/ghg/inventories/" + fy2026 + "/assignments").with(asMember())));
		assertThat(JsonPath.<List<String>>read(later, "$[?(@.included == true)].emissionFactorId"))
			.containsExactly(held);
		// importing the earlier edition again speaks to the versions behind and changes nothing
		var again = importEdition(orgId, EARLIER);
		assertThat(JsonPath.<Integer>read(again, "$.unchanged")).isEqualTo(2);
		assertThat(JsonPath.<Integer>read(again, "$.versioned")).isEqualTo(0);
		assertThat(versionsOf(orgId, DIESEL)).hasSize(2);

		// and the 2025 run prices the 2025 value and cites the 2025 edition (a locked 2025 period then
		// refuses a further import of the vintage, rule 1)
		var runId = freezeAndRun(fy2025);
		mvc.perform(get("/api/ghg/runs/" + runId).with(asMember()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.run.totalKgCo2e").value(2500.0));
		mvc.perform(get("/api/ghg/runs/" + runId + "/report").with(asMember()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.factors[*].sourceEdition").value(org.hamcrest.Matchers.contains(EARLIER)));
	}

	/**
	 * The chain stays in order whichever way the vintages arrive: 2026, then
	 * 2025 behind it, then 2027 ahead of it, and each version is superseded by
	 * the next. The 2027 edition drops coal, which it can discontinue because
	 * coal's live version is a 2026 one.
	 */
	@Test
	void vintagesArrivingOutOfOrderStillFormOneChain() throws Exception {
		publishTheFirstEdition();
		var orgId = createOrganization("Asante Gold Resources");
		importEdition(orgId, FIRST);
		publishTheEarlierEdition();
		importEdition(orgId, EARLIER);
		publishTheSecondEdition("2027-01-01");
		var result = importEdition(orgId, SECOND);
		assertThat(JsonPath.<List<String>>read(result, "$.discontinued")).containsExactly(COAL);

		var versions = versionsOf(orgId, DIESEL);
		assertThat(versions).extracting(com.carbonos.ghg.internal.EmissionFactor::getValidFrom).containsExactly(
				java.time.LocalDate.of(2025, 1, 1), java.time.LocalDate.of(2026, 1, 1), java.time.LocalDate.of(2027, 1, 1));
		assertThat(versions).extracting(com.carbonos.ghg.internal.EmissionFactor::getValidTo).containsExactly(
				java.time.LocalDate.of(2025, 12, 31), java.time.LocalDate.of(2026, 12, 31), null);
		assertThat(versions.get(0).getSupersededById()).isEqualTo(versions.get(1).getId());
		assertThat(versions.get(1).getSupersededById()).isEqualTo(versions.get(2).getId());
		assertThat(versions.get(2).isLive()).isTrue();
		assertThat(versions).extracting(com.carbonos.ghg.internal.EmissionFactor::getSourceEdition)
			.containsExactly(EARLIER, FIRST, SECOND);
	}

	/**
	 * A factor carries the gas masses its publication states (spec 02.6). DESNZ
	 * states diesel's methane and nitrous oxide to eight decimals; rounded to
	 * six on import, the run rebuilt 2.661585 kg CO2e per litre from them
	 * instead of the published 2.66155, which is what the governance pack's
	 * arithmetic found. The masses now survive the import, and the run prices
	 * 5,000 litres at 13,307.75 kg.
	 */
	@Test
	void anImportKeepsTheGasMassesThePublicationStates() throws Exception {
		var orgId = createOrganization("Asante Gold Resources");
		importEdition(orgId, "defra-2025");
		var diesel = live(orgId, "DEFRA:Fuels:Liquid_fuels_Diesel_100_mineral_diesel_:litres");
		assertThat(diesel.getKgCo2ePerUnit()).isEqualByComparingTo("2.66155");
		assertThat(diesel.getCh4KgPerUnit()).isEqualByComparingTo("0.00001036");
		assertThat(diesel.getN2oKgPerUnit()).isEqualByComparingTo("0.00012483");

		var facilityId = createFacility(orgId);
		var activityId = JsonPath.<String>read(body(mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/activities").with(asMember()).with(csrf())
				.contentType("application/json")
				.content("""
						{"facilityId": "%s", "activityType": "Delivery fleet diesel", "quantity": 5000, "unit": "litre",
						 "periodStart": "2025-08-01", "periodEnd": "2025-08-31", "dataSource": "Contractor invoice",
						 "evidenceRef": "CT-2025-08", "dataQuality": "MEASURED"}""".formatted(facilityId)))
			.andExpect(status().isCreated())), "$.id");
		var inventoryId = JsonPath.<String>read(body(mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/inventories").with(asMember()).with(csrf())
				.contentType("application/json")
				.content("""
						{"name": "FY2025", "periodStart": "2025-01-01", "periodEnd": "2025-12-31", "purpose": "Corporate reporting",
						 "consolidationApproach": "OPERATIONAL_CONTROL"}"""))
			.andExpect(status().isCreated())), "$.id");
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/boundary/" + facilityId).with(asMember())
			.with(csrf()).contentType("application/json").content("{}")).andExpect(status().isOk());
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/assignments/sync").with(asMember()).with(csrf()))
			.andExpect(status().isOk());
		var listing = body(mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember())));
		var assignmentId = JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + activityId + "')].id")
			.getFirst();
		mvc.perform(put("/api/ghg/assignments/" + assignmentId + "/classify").with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"emissionFactorId": "%s"}""".formatted(diesel.getId()))).andExpect(status().isOk());
		var runId = freezeAndRun(inventoryId);
		mvc.perform(get("/api/ghg/runs/" + runId).with(asMember()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.run.totalKgCo2e").value(13307.75))
			.andExpect(jsonPath("$.lines[0].kgCo2ePerUnit").value(2.66155))
			.andExpect(jsonPath("$.lines[0].byGas.ch4Kg").value(0.052))
			.andExpect(jsonPath("$.lines[0].byGas.n2oKg").value(0.624));
	}

	/**
	 * The load case of spec 02.6: defra-2026 imported twice into one
	 * organization. The first import creates 1,868 lineages and the second must
	 * report every one of them unchanged, cutting nothing.
	 */
	@Test
	void importingDefra2026TwiceReportsEveryRowUnchanged() throws Exception {
		var orgId = createOrganization("Asante Gold Resources");
		var startedFirst = System.nanoTime();
		var first = importEdition(orgId, "defra-2026");
		System.out.println("[load] first import: " + (System.nanoTime() - startedFirst) / 1_000_000 + " ms");
		var created = JsonPath.<Integer>read(first, "$.created");
		assertThat(created).isGreaterThan(1500);

		var startedSecond = System.nanoTime();
		var again = importEdition(orgId, "defra-2026");
		System.out.println("[load] second import: " + (System.nanoTime() - startedSecond) / 1_000_000 + " ms");
		assertThat(JsonPath.<Integer>read(again, "$.created")).isZero();
		assertThat(JsonPath.<Integer>read(again, "$.versioned")).isZero();
		assertThat(JsonPath.<Integer>read(again, "$.tagged")).isZero();
		assertThat(JsonPath.<Integer>read(again, "$.unchanged")).isEqualTo(created);
		assertThat(JsonPath.<List<String>>read(again, "$.conflicts")).isEmpty();
		assertThat(JsonPath.<List<String>>read(again, "$.discontinued")).isEmpty();
		assertThat(emissionFactors.findAllByOrganizationIdAndPackCodeIsNotNull(UUID.fromString(orgId)))
			.hasSize(created);
	}

	/**
	 * An edition of a second family that selects the diesel row of
	 * {@link #FIRST}: same code, same value, same provenance. That is what a
	 * sector pack used to be, and what a curator can still author.
	 */
	void publishTheSelectionEdition() throws Exception {
		mvc.perform(post("/api/admin/factor-packs").with(asCurator()).with(csrf()).contentType("application/json")
			.content("""
					{"packKey": "%s", "name": "A test selection", "kind": "SECTOR",
					 "summary": "Selected from a test publication."}""".formatted(SELECTION_FAMILY)))
			.andExpect(status().isCreated());
		mvc.perform(post("/api/admin/factor-packs/" + SELECTION_FAMILY + "/editions").with(asCurator()).with(csrf())
			.contentType("application/json")
			.content("""
					{"editionId": "%s", "cloneFrom": null, "name": "A test selection 2026",
					 "source": "Selection from a test publication, 2026 tables",
					 "sourceUrl": "https://example.test/tables-2026.xlsx",
					 "publicationYear": 2026, "gwpBasis": "AR5", "license": "See each factor's source",
					 "retrieved": "2026-01-04", "notes": "For the tests.", "appliesFrom": "2026-01-01"}"""
				.formatted(SELECTION)))
			.andExpect(status().isCreated());
		addRow(SELECTION, row(DIESEL, "Diesel", "litre", "2.66", 2026)).andExpect(status().isCreated());
		uploadEvidence(SELECTION, "The 2026 tables, as published.");
		publish(SELECTION, "2026-01-01");
	}

	/**
	 * Spec 02.3: one publication row is one factor, whatever pack delivers it. A
	 * second edition selecting a row the organization already holds adds its tag
	 * rather than a copy or a new version, and the factor keeps citing the
	 * publication it came from. No two shipped packs share a code since spec
	 * 02.9 narrowed the catalogue to DESNZ and Ghana, so the two editions this
	 * builds are what proves it.
	 */
	@Test
	void aSecondPackSelectingTheSameRowTagsItRatherThanCopyingIt() throws Exception {
		publishTheFirstEdition();
		publishTheSelectionEdition();
		var orgId = createOrganization("Asante Gold Resources (identity)");
		var first = importEdition(orgId, FIRST);
		assertThat(JsonPath.<Integer>read(first, "$.created")).isEqualTo(3);
		assertThat(JsonPath.<Integer>read(first, "$.tagged")).isZero();

		var second = importEdition(orgId, SELECTION);
		// the row is already held with the same value, so it is tagged: nothing is created or versioned
		assertThat(JsonPath.<Integer>read(second, "$.created")).isZero();
		assertThat(JsonPath.<Integer>read(second, "$.versioned")).isZero();
		assertThat(JsonPath.<Integer>read(second, "$.tagged")).isEqualTo(1);

		var factors = body(mvc.perform(get("/api/ghg/organizations/" + orgId + "/emission-factors").with(asMember())
			.param("size", "200")));
		var diesel = "$.items[?(@.packCode == '" + DIESEL + "')]";
		assertThat(JsonPath.<List<String>>read(factors, diesel + ".id")).as("one factor, not two").hasSize(1);
		assertThat(JsonPath.<List<List<String>>>read(factors, diesel + ".packs").getFirst())
			.containsExactlyInAnyOrder(FIRST, SELECTION);
		// the tag says which pack delivered it; the source still says which publication it came from
		assertThat(JsonPath.<List<String>>read(factors, diesel + ".source").getFirst())
			.startsWith("A test publication, 2026 tables");
		assertThat(emissionFactors.findAllByOrganizationIdAndPackCodeIsNotNull(UUID.fromString(orgId))).hasSize(3);
	}
}
