package com.carbonos.ghg;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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
import com.carbonos.ghg.internal.BoundaryTreatmentRepository;
import com.carbonos.ghg.internal.BoundaryVersionRepository;
import com.carbonos.ghg.internal.EmissionFactorRepository;
import com.carbonos.ghg.internal.FactorPackEditionRepository;
import com.carbonos.ghg.internal.FactorPackFamilyRepository;
import com.carbonos.ghg.internal.FactorPackNoticeRepository;
import com.carbonos.ghg.internal.FactorPackRowRepository;
import com.carbonos.ghg.internal.FacilityRepository;
import com.carbonos.ghg.internal.GhgRunRepository;
import com.carbonos.ghg.internal.InventoryAssignmentRepository;
import com.carbonos.ghg.internal.InventoryRepository;
import com.carbonos.ghg.internal.ActivityRecordRepository;
import com.carbonos.ghg.internal.LegalEntityRepository;
import com.carbonos.ghg.internal.OrganizationRepository;
import com.carbonos.user.AuthenticatedUser;
import com.jayway.jsonpath.JsonPath;

/**
 * Publishing an edition (spec 02.5). Publication is one act with one record:
 * the source document with its SHA-256, every rule passing, an applies-from
 * date, an approver who is not the curator, the change log frozen against the
 * predecessor, the blast radius read first, and one notice raised for every
 * organization holding a lineage.
 *
 * <p>The invariant the whole spec rests on is the one
 * {@link #publishingChangesNoOrganizationsNumbers} asserts: a publication moves
 * no client's numbers. Adopting an edition is the organization's accounting
 * decision (spec 02.7), and this phase only raises it.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class FactorPackPublicationApiIntegrationTests {

	private static final String FAMILY = "testpack";

	private static final String FIRST = "testpack-2026";

	private static final String SECOND = "testpack-2027";

	@Autowired
	MockMvc mvc;

	@Autowired
	FactorPackFamilyRepository families;

	@Autowired
	FactorPackEditionRepository editions;

	@Autowired
	FactorPackRowRepository packRows;

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

	// the curator builds the draft; the approver checks it against the source document and publishes
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
		// the seeded editions stay; everything this class published goes. Notices first, because a
		// notice points at an edition and nothing cascades from the edition to it, then the editions
		// newest first, because a successor holds a foreign key to the predecessor it superseded.
		notices.deleteAll();
		var written = new java.util.ArrayList<>(editions.findAllByPackKeyOrderByEditionIdAsc(FAMILY));
		java.util.Collections.reverse(written);
		for (var edition : written) {
			editions.delete(edition);
			editions.flush();
		}
		families.findById(FAMILY).ifPresent(families::delete);
	}

	// --- helpers ------------------------------------------------------------

	String body(ResultActions actions) throws Exception {
		return actions.andReturn().getResponse().getContentAsString();
	}

	void createFamily() throws Exception {
		mvc.perform(post("/api/admin/factor-packs").with(asCurator()).with(csrf()).contentType("application/json")
			.content("""
					{"packKey": "%s", "name": "A test publication", "kind": "SOURCE",
					 "summary": "Written by a test."}""".formatted(FAMILY))).andExpect(status().isCreated());
	}

	void createDraft(String editionId, String cloneFrom, int year) throws Exception {
		var clone = cloneFrom == null ? "null" : "\"" + cloneFrom + "\"";
		mvc.perform(post("/api/admin/factor-packs/" + FAMILY + "/editions").with(asCurator()).with(csrf())
			.contentType("application/json")
			.content("""
					{"editionId": "%s", "cloneFrom": %s, "name": "A test publication %d",
					 "source": "A test publication, %d tables",
					 "sourceUrl": "https://example.test/tables-%d.xlsx",
					 "publicationYear": %d, "gwpBasis": "AR5", "license": "Test licence",
					 "retrieved": "%d-01-04", "notes": "For the tests.", "appliesFrom": "%d-01-01"}"""
				.formatted(editionId, clone, year, year, year, year, year, year)))
			.andExpect(status().isCreated());
	}

	/** A row good enough to pass every publication rule. */
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

	/** Uploads the source document the edition is published against; returns its SHA-256. */
	String uploadEvidence(String editionId, String content) throws Exception {
		var file = new MockMultipartFile("file", "tables-2027.pdf", "application/pdf",
				content.getBytes(StandardCharsets.UTF_8));
		var result = body(mvc.perform(multipart("/api/admin/factor-packs/editions/" + editionId + "/evidence")
			.file(file).with(asCurator()).with(csrf())).andExpect(status().isOk()));
		return JsonPath.read(result, "$.checksum");
	}

	ResultActions publish(String editionId, RequestPostProcessor who, String json) throws Exception {
		return mvc.perform(post("/api/admin/factor-packs/editions/" + editionId + "/publish").with(who).with(csrf())
			.contentType("application/json").content(json));
	}

	ResultActions publish(String editionId) throws Exception {
		return publish(editionId, asApprover(), """
				{"sourceDocument": "A test publication, 2027 tables (PDF, retrieved 2027-01-04)",
				 "appliesFrom": "2027-01-01"}""");
	}

	String blastRadius(String editionId) throws Exception {
		return body(mvc.perform(get("/api/admin/factor-packs/editions/" + editionId + "/blast-radius")
			.with(asApprover())).andExpect(status().isOk()));
	}

	/** The 2026 edition, published: three rows an organization can then import. */
	void publishTheFirstEdition() throws Exception {
		createFamily();
		createDraft(FIRST, null, 2026);
		addRow(FIRST, row("TEST:diesel", "Diesel", "litre", "2.66", 2026)).andExpect(status().isCreated());
		addRow(FIRST, row("TEST:petrol", "Petrol", "litre", "2.31", 2026)).andExpect(status().isCreated());
		addRow(FIRST, row("TEST:coal", "Coal", "tonne", "2400", 2026)).andExpect(status().isCreated());
		uploadEvidence(FIRST, "The 2026 tables, as published.");
		publish(FIRST, asApprover(), """
				{"sourceDocument": "A test publication, 2026 tables (PDF)", "appliesFrom": "2026-01-01"}""")
			.andExpect(status().isOk());
	}

	/**
	 * The 2027 draft: diesel moves 5.26 percent, petrol stands still, coal is
	 * dropped and LPG is new.
	 */
	void authorTheSecondEdition() throws Exception {
		createDraft(SECOND, FIRST, 2027);
		var rows = body(mvc.perform(get("/api/admin/factor-packs/editions/" + SECOND + "/rows").with(asCurator())
			.param("size", "200")).andExpect(status().isOk()));
		var dieselId = JsonPath.<List<String>>read(rows, "$.items[?(@.code == 'TEST:diesel')].id").getFirst();
		var coalId = JsonPath.<List<String>>read(rows, "$.items[?(@.code == 'TEST:coal')].id").getFirst();
		mvc.perform(put("/api/admin/factor-packs/editions/" + SECOND + "/rows/" + dieselId).with(asCurator())
			.with(csrf())
			.contentType("application/json")
			.content(row("TEST:diesel", "Diesel", "litre", "2.80", 2027))).andExpect(status().isOk());
		mvc.perform(delete("/api/admin/factor-packs/editions/" + SECOND + "/rows/" + coalId).with(asCurator())
			.with(csrf())).andExpect(status().isNoContent());
		addRow(SECOND, row("TEST:lpg", "LPG", "litre", "1.56", 2027)).andExpect(status().isCreated());
		// the cloned petrol row keeps the 2026 provenance, which is what an unchanged row means
		uploadEvidence(SECOND, "The 2027 tables, as published.");
	}

	// --- the tenant fixture -------------------------------------------------

	String createOrganization(String name) throws Exception {
		return JsonPath.read(body(mvc
			.perform(post("/api/ghg/organizations").with(asMember()).with(csrf()).contentType("application/json")
				.content("""
						{"name": "%s"}""".formatted(name)))
			.andExpect(status().isCreated())), "$.id");
	}

	/**
	 * An organization that imported the 2026 edition, recorded 1,000 litres of
	 * diesel, and completed a run over it. Its run total is 2,660 kg CO2e, so a
	 * diesel row moving from 2.66 to 2.80 would move it by 140.
	 */
	String holdingOrganization(String name) throws Exception {
		var orgId = createOrganization(name);
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/factor-packs/" + FIRST + "/import").with(asMember())
			.with(csrf())).andExpect(status().isOk());
		var facilityId = JsonPath.<String>read(body(mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/facilities").with(asMember()).with(csrf())
				.contentType("application/json")
				.content("""
						{"name": "Tema Plant", "location": "Tema, Ghana", "entityId": null}"""))
			.andExpect(status().isCreated())), "$.id");
		var activityId = JsonPath.<String>read(body(mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/activities").with(asMember()).with(csrf())
				.contentType("application/json")
				.content("""
						{"facilityId": "%s", "activityType": "Diesel", "quantity": 1000, "unit": "litre",
						 "periodStart": "2025-06-01", "periodEnd": "2025-06-01", "dataSource": "Fuel invoice",
						 "evidenceRef": "INV-2938", "dataQuality": "MEASURED"}""".formatted(facilityId)))
			.andExpect(status().isCreated())), "$.id");
		var inventoryId = JsonPath.<String>read(body(mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/inventories").with(asMember()).with(csrf())
				.contentType("application/json")
				.content("""
						{"name": "2025", "periodStart": "2025-01-01", "periodEnd": "2025-12-31",
						 "purpose": "Corporate reporting", "consolidationApproach": "OPERATIONAL_CONTROL"}"""))
			.andExpect(status().isCreated())), "$.id");
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/boundary/" + facilityId).with(asMember())
			.with(csrf()).contentType("application/json").content("{}")).andExpect(status().isOk());
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/assignments/sync").with(asMember()).with(csrf()))
			.andExpect(status().isOk());
		var listing = body(mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asMember()))
			.andExpect(status().isOk()));
		var assignmentId = JsonPath.<List<String>>read(listing,
				"$[?(@.activityId == '" + activityId + "')].id").getFirst();
		mvc.perform(put("/api/ghg/assignments/" + assignmentId + "/classify").with(asMember()).with(csrf())
			.contentType("application/json")
			.content("""
					{"emissionFactorId": "%s"}""".formatted(factorId(orgId, "TEST:diesel"))))
			.andExpect(status().isOk());
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/freeze").with(asMember()).with(csrf()))
			.andExpect(status().isOk());
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/runs").with(asMember()).with(csrf())
			.contentType("application/json").content("""
					{"label": "First run"}""")).andExpect(status().isCreated());
		return orgId;
	}

	String factorId(String organizationId, String code) {
		return emissionFactors.findAllByOrganizationIdAndPackCodeIsNotNull(UUID.fromString(organizationId))
			.stream()
			.filter(factor -> code.equals(factor.getPackCode()))
			.findFirst()
			.orElseThrow(() -> new AssertionError("no factor for " + code))
			.getId()
			.toString();
	}

	/** Every factor value the organization holds, by lineage: the numbers a publication must not move. */
	Map<String, BigDecimal> factorValues(String organizationId) {
		var values = new LinkedHashMap<String, BigDecimal>();
		emissionFactors.findAllByOrganizationIdAndPackCodeIsNotNull(UUID.fromString(organizationId))
			.forEach(factor -> values.put(factor.getPackCode(), factor.getKgCo2ePerUnit()));
		return values;
	}

	/** Every run total the organization holds, by run identifier. */
	Map<UUID, BigDecimal> runTotals(String organizationId) {
		var totals = new LinkedHashMap<UUID, BigDecimal>();
		for (var inventory : inventories.findAllByOrganizationIdOrderByCreatedAtDesc(UUID.fromString(organizationId))) {
			runs.findAllByInventoryIdOrderByCreatedAtDesc(inventory.getId())
				.forEach(run -> totals.put(run.getId(), run.getTotalKgCo2e()));
		}
		return totals;
	}

	// --- the gate -----------------------------------------------------------

	@Test
	void theApproverCannotBeTheCurator() throws Exception {
		createFamily();
		createDraft(FIRST, null, 2026);
		addRow(FIRST, row("TEST:diesel", "Diesel", "litre", "2.66", 2026)).andExpect(status().isCreated());
		uploadEvidence(FIRST, "The 2026 tables.");

		publish(FIRST, asCurator(), """
				{"sourceDocument": "A test publication, 2026 tables", "appliesFrom": "2026-01-01"}""")
			.andExpect(status().isUnprocessableEntity())
			.andExpect(jsonPath("$.errors.approver").exists());
		mvc.perform(get("/api/admin/factor-packs/editions/" + FIRST).with(asCurator()))
			.andExpect(jsonPath("$.status").value("DRAFT"));

		// somebody else checks it against the source document and publishes it
		publish(FIRST, asApprover(), """
				{"sourceDocument": "A test publication, 2026 tables", "appliesFrom": "2026-01-01"}""")
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("PUBLISHED"))
			.andExpect(jsonPath("$.approver").value("kofi@ecoriv.com"))
			.andExpect(jsonPath("$.curator").value("ama@ecoriv.com"));
	}

	@Test
	void publishingNeedsAnEvidenceFileWithAChecksum() throws Exception {
		createFamily();
		createDraft(FIRST, null, 2026);
		addRow(FIRST, row("TEST:diesel", "Diesel", "litre", "2.66", 2026)).andExpect(status().isCreated());

		publish(FIRST, asApprover(), """
				{"sourceDocument": "A test publication, 2026 tables", "appliesFrom": "2026-01-01"}""")
			.andExpect(status().isUnprocessableEntity())
			.andExpect(jsonPath("$.errors.evidence").exists());

		// the checksum is over the bytes stored, not a figure the caller states
		var checksum = uploadEvidence(FIRST, "The 2026 tables.");
		assertThat(checksum).hasSize(64)
			.isEqualTo(java.util.HexFormat.of()
				.formatHex(java.security.MessageDigest.getInstance("SHA-256")
					.digest("The 2026 tables.".getBytes(StandardCharsets.UTF_8))));
		mvc.perform(get("/api/admin/factor-packs/editions/" + FIRST).with(asCurator()))
			.andExpect(jsonPath("$.evidenceChecksum").value(checksum))
			.andExpect(jsonPath("$.evidenceName").value("tables-2027.pdf"));

		publish(FIRST, asApprover(), """
				{"sourceDocument": "A test publication, 2026 tables", "appliesFrom": "2026-01-01"}""")
			.andExpect(status().isOk());
	}

	@Test
	void publishingIsRefusedWhileAnyRuleIsBroken() throws Exception {
		createFamily();
		createDraft(FIRST, null, 2026);
		// no namespace in the code and a free-text unit: two hard failures, never warnings
		addRow(FIRST, """
				{"code": "nonamespace", "name": "Diesel", "defaultScope": "SCOPE_1",
				 "defaultCategory": "STATIONARY_COMBUSTION", "unit": "widgets", "kgCo2ePerUnit": 2.66,
				 "co2KgPerUnit": 2.66, "approved": true, "dataYear": 2026,
				 "sourcePublication": "A test publication, 2026 tables",
				 "sourceUrl": "https://example.test/tables-2026.xlsx", "publicationYear": 2026}""")
			.andExpect(status().isCreated());
		uploadEvidence(FIRST, "The 2026 tables.");

		publish(FIRST, asApprover(), """
				{"sourceDocument": "A test publication, 2026 tables", "appliesFrom": "2026-01-01"}""")
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("code")))
			.andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("unit")));
		mvc.perform(get("/api/admin/factor-packs/editions/" + FIRST).with(asCurator()))
			.andExpect(jsonPath("$.status").value("DRAFT"));
	}

	@Test
	void publishingNeedsTheSourceDocumentAndAnAppliesFromDate() throws Exception {
		createFamily();
		createDraft(FIRST, null, 2026);
		addRow(FIRST, row("TEST:diesel", "Diesel", "litre", "2.66", 2026)).andExpect(status().isCreated());
		uploadEvidence(FIRST, "The 2026 tables.");

		publish(FIRST, asApprover(), """
				{"sourceDocument": "  ", "appliesFrom": "2026-01-01"}""")
			.andExpect(status().isUnprocessableEntity())
			.andExpect(jsonPath("$.errors.sourceDocument").exists());

		// the draft carries a date of its own; publishing with the field cleared
		// must not fall back to it (walkthrough finding 4)
		publish(FIRST, asApprover(), """
				{"sourceDocument": "A test publication, 2026 tables", "appliesFrom": null}""")
			.andExpect(status().isUnprocessableEntity())
			.andExpect(jsonPath("$.errors.appliesFrom").value(
					"Give the date the edition applies from. It is the vintage boundary an adoption is run from."));
		mvc.perform(get("/api/admin/factor-packs/editions/" + FIRST).with(asCurator()))
			.andExpect(jsonPath("$.status").value("DRAFT"));
	}

	// --- what publication freezes -------------------------------------------

	@Test
	void publishingFreezesTheEditionAndItsRowsForever() throws Exception {
		publishTheFirstEdition();

		var rows = body(mvc.perform(get("/api/admin/factor-packs/editions/" + FIRST + "/rows").with(asCurator()))
			.andExpect(status().isOk()));
		var rowId = JsonPath.<List<String>>read(rows, "$.items[?(@.code == 'TEST:diesel')].id").getFirst();
		mvc.perform(put("/api/admin/factor-packs/editions/" + FIRST + "/rows/" + rowId).with(asCurator()).with(csrf())
			.contentType("application/json").content(row("TEST:diesel", "Diesel", "litre", "9.99", 2026)))
			.andExpect(status().isConflict());
		mvc.perform(put("/api/admin/factor-packs/editions/" + FIRST).with(asCurator()).with(csrf())
			.contentType("application/json")
			.content("""
					{"name": "Rewritten", "source": "Somewhere else", "publicationYear": 2026, "gwpBasis": "AR5"}"""))
			.andExpect(status().isConflict());
		// and it is published once: a second publication is refused rather than rewriting the record
		publish(FIRST, asApprover(), """
				{"sourceDocument": "Again", "appliesFrom": "2026-01-01"}""").andExpect(status().isConflict());

		mvc.perform(get("/api/admin/factor-packs/editions/" + FIRST).with(asCurator()))
			.andExpect(jsonPath("$.status").value("PUBLISHED"))
			.andExpect(jsonPath("$.publishedAt").exists())
			.andExpect(jsonPath("$.appliesFrom").value("2026-01-01"))
			.andExpect(jsonPath("$.sourceDocument").exists())
			.andExpect(jsonPath("$.mutable").value(false))
			// an edition authored in the console can never carry the seed's exemption
			.andExpect(jsonPath("$.provenanceReview").value("REVIEWED"));
	}

	@Test
	void theChangeLogIsComputedAgainstThePredecessor() throws Exception {
		publishTheFirstEdition();
		authorTheSecondEdition();
		publish(SECOND).andExpect(status().isOk());

		var log = body(mvc.perform(get("/api/admin/factor-packs/editions/" + SECOND + "/changes").with(asCurator()))
			.andExpect(status().isOk()));
		assertThat(JsonPath.<List<String>>read(log, "$[?(@.kind == 'ADDED')].code")).containsExactly("TEST:lpg");
		assertThat(JsonPath.<List<String>>read(log, "$[?(@.kind == 'CHANGED')].code")).containsExactly("TEST:diesel");
		assertThat(JsonPath.<List<String>>read(log, "$[?(@.kind == 'DISCONTINUED')].code"))
			.containsExactly("TEST:coal");
		assertThat(JsonPath.<List<String>>read(log, "$[?(@.kind == 'UNCHANGED')].code")).containsExactly("TEST:petrol");
		// 2.66 to 2.80 is 5.2632 percent, and the fields that moved are named beside it
		assertThat(JsonPath.<List<Double>>read(log, "$[?(@.code == 'TEST:diesel')].percentChange").getFirst())
			.isEqualTo(5.2632, within(0.0001));
		assertThat(JsonPath.<List<String>>read(log, "$[?(@.code == 'TEST:diesel')].fields").getFirst())
			.contains("kg CO2e per unit");
		// the log is frozen: the edition records the predecessor it was computed against
		mvc.perform(get("/api/admin/factor-packs/editions/" + SECOND).with(asCurator()))
			.andExpect(jsonPath("$.supersedesId").value(FIRST));
		// and the predecessor left the import list
		mvc.perform(get("/api/admin/factor-packs/editions/" + FIRST).with(asCurator()))
			.andExpect(jsonPath("$.status").value("SUPERSEDED"));
	}

	@Test
	void anErratumMarksThePredecessorSupersededAndFlagsTheError() throws Exception {
		publishTheFirstEdition();
		authorTheSecondEdition();

		publish(SECOND, asApprover(), """
				{"sourceDocument": "A test publication, 2027 tables", "appliesFrom": "2027-01-01",
				 "erratum": true, "erratumNote": "The diesel row was transcribed from the wrong column."}""")
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.erratum").value(true));

		mvc.perform(get("/api/admin/factor-packs/editions/" + FIRST).with(asCurator()))
			.andExpect(jsonPath("$.status").value("SUPERSEDED"))
			// the wrong values are never edited, because reports already rest on them
			.andExpect(jsonPath("$.errorNote").value(org.hamcrest.Matchers.containsString("wrong column")));
		var rows = body(mvc.perform(get("/api/admin/factor-packs/editions/" + FIRST + "/rows").with(asCurator())
			.param("search", "diesel")).andExpect(status().isOk()));
		assertThat(JsonPath.<List<Double>>read(rows, "$.items[*].kgCo2ePerUnit")).containsExactly(2.66);
	}

	// --- the blast radius ---------------------------------------------------

	@Test
	void theBlastRadiusNamesEveryHolderAndTheTonnageItWouldMove() throws Exception {
		publishTheFirstEdition();
		var orgId = holdingOrganization("Asante Gold Resources");
		authorTheSecondEdition();

		var report = blastRadius(SECOND);
		assertThat(JsonPath.<String>read(report, "$.predecessorEditionId")).isEqualTo(FIRST);
		assertThat(JsonPath.<Integer>read(report, "$.holderCount")).isEqualTo(1);
		assertThat(JsonPath.<List<String>>read(report, "$.organizations[*].organizationName"))
			.containsExactly("Asante Gold Resources");
		assertThat(JsonPath.<List<String>>read(report, "$.organizations[*].organizationId")).containsExactly(orgId);
		// 1,000 litres at 2.66 is 2,660 kg CO2e; at 2.80 it is 2,800, so the estimate is 140
		assertThat(JsonPath.<List<Double>>read(report, "$.organizations[*].estimatedKgCo2eDelta").getFirst())
			.isEqualTo(140.0, within(0.5));
		assertThat(JsonPath.<List<Integer>>read(report, "$.organizations[*].lineagesHeld").getFirst()).isEqualTo(3);
		// the lineages this edition drops are named apart, because accepting never retires them
		assertThat(JsonPath.<List<String>>read(report, "$.discontinuedLineages")).containsExactly("TEST:coal");
		assertThat(JsonPath.<List<List<String>>>read(report, "$.organizations[*].discontinued").getFirst())
			.containsExactly("TEST:coal");
		// the report keys on the code, and the run it estimated from is named
		assertThat(JsonPath.<List<String>>read(report, "$.organizations[*].lastRunLabel"))
			.containsExactly("First run");
	}

	@Test
	void theBlastRadiusFlagsRowsMovingMoreThanFivePercent() throws Exception {
		publishTheFirstEdition();
		holdingOrganization("Asante Gold Resources");
		authorTheSecondEdition();

		var report = blastRadius(SECOND);
		assertThat(JsonPath.<Integer>read(report, "$.rowsOverThreshold")).isEqualTo(1);
		assertThat(JsonPath.<List<String>>read(report, "$.rows[?(@.overThreshold == true)].code"))
			.containsExactly("TEST:diesel");
		assertThat(JsonPath.<List<Double>>read(report, "$.rows[?(@.code == 'TEST:diesel')].percentChange").getFirst())
			.isEqualTo(5.2632, within(0.0001));
		assertThat(JsonPath.<List<Double>>read(report, "$.rows[?(@.code == 'TEST:diesel')].absoluteChange").getFirst())
			.isEqualTo(0.14, within(0.0001));
		// petrol stands still, so it is neither counted nor flagged
		assertThat(JsonPath.<List<Boolean>>read(report, "$.rows[?(@.code == 'TEST:petrol')].overThreshold"))
			.containsExactly(false);
		assertThat(JsonPath.<Integer>read(report, "$.rowsChanged")).isEqualTo(1);
		assertThat(JsonPath.<Integer>read(report, "$.rowsUnchanged")).isEqualTo(1);
		assertThat(JsonPath.<Integer>read(report, "$.rowsAdded")).isEqualTo(1);
		assertThat(JsonPath.<Integer>read(report, "$.rowsDiscontinued")).isEqualTo(1);
	}

	@Test
	void theBlastRadiusNamesOpenDraftsAndRowsInsideALockedPeriod() throws Exception {
		publishTheFirstEdition();
		holdingOrganization("Asante Gold Resources");
		authorTheSecondEdition();

		var report = blastRadius(SECOND);
		// the 2025 inventory was frozen to run, so the diesel lineage feeds a period that is not the
		// organization's to change any more
		assertThat(JsonPath.<List<List<String>>>read(report, "$.organizations[*].blocked").getFirst())
			.containsExactly("TEST:diesel");
		assertThat(JsonPath.<List<String>>read(report, "$.organizations[0].lockedPeriods[*].name"))
			.containsExactly("2025");
		assertThat(JsonPath.<List<String>>read(report, "$.organizations[0].openDrafts[*].name")).isEmpty();
	}

	// --- the invariant ------------------------------------------------------

	@Test
	void publishingChangesNoOrganizationsNumbers() throws Exception {
		publishTheFirstEdition();
		var orgId = holdingOrganization("Asante Gold Resources");
		var other = holdingOrganization("Sankofa Gold plc");
		authorTheSecondEdition();

		var valuesBefore = factorValues(orgId);
		var otherValuesBefore = factorValues(other);
		var totalsBefore = runTotals(orgId);
		var otherTotalsBefore = runTotals(other);
		assertThat(valuesBefore).isNotEmpty();
		assertThat(totalsBefore).isNotEmpty();

		publish(SECOND).andExpect(status().isOk());

		// every organization factor's value and every run total, unchanged
		assertThat(factorValues(orgId)).isEqualTo(valuesBefore);
		assertThat(factorValues(other)).isEqualTo(otherValuesBefore);
		assertThat(runTotals(orgId)).isEqualTo(totalsBefore);
		assertThat(runTotals(other)).isEqualTo(otherTotalsBefore);
		// and the lineages the new edition would have moved still read the 2026 figure
		assertThat(factorValues(orgId).get("TEST:diesel")).isEqualByComparingTo("2.66");
		// the assignment still points at the factor it was classified with
		assertThat(assignments.findAll())
			.allSatisfy(assignment -> assertThat(assignment.getEmissionFactor()).isNotNull());
	}

	@Test
	void publishingRaisesOneOpenNoticePerHolder() throws Exception {
		publishTheFirstEdition();
		var orgId = holdingOrganization("Asante Gold Resources");
		var other = createOrganization("Keta Salt Works");
		authorTheSecondEdition();

		publish(SECOND).andExpect(status().isOk());

		var raised = notices.findAllByEditionIdOrderByRaisedAtAsc(SECOND);
		// one per holder; an organization holding none of the predecessor's lineages gets none
		assertThat(raised).hasSize(1);
		var notice = raised.getFirst();
		assertThat(notice.getOrganizationId()).isEqualTo(UUID.fromString(orgId));
		assertThat(notice.getPredecessorEditionId()).isEqualTo(FIRST);
		assertThat(notice.getStatus().name()).isEqualTo("OPEN");
		assertThat(notice.getRowsAffected()).isEqualTo(1);
		assertThat(notice.getRowsOverThreshold()).isEqualTo(1);
		assertThat(notice.getEstimatedKgCo2eDelta()).isEqualByComparingTo("140.000");
		// the diff hash is what a verifier confirms the diff the decider saw against
		assertThat(notice.getDiffHash()).hasSize(64);
		assertThat(notices.findAllByOrganizationIdOrderByRaisedAtDesc(UUID.fromString(other))).isEmpty();
	}

	// --- withdrawal ---------------------------------------------------------

	@Test
	void withdrawingHidesAnEditionFromNewImportsAndLeavesHeldDataAlone() throws Exception {
		publishTheFirstEdition();
		var orgId = holdingOrganization("Asante Gold Resources");
		var valuesBefore = factorValues(orgId);
		var totalsBefore = runTotals(orgId);
		authorTheSecondEdition();
		publish(SECOND).andExpect(status().isOk());
		assertThat(notices.findAllByEditionIdOrderByRaisedAtAsc(SECOND)).hasSize(1);

		mvc.perform(post("/api/admin/factor-packs/editions/" + SECOND + "/withdraw").with(asApprover()).with(csrf())
			.contentType("application/json").content("""
					{"reason": "short"}"""))
			.andExpect(status().isUnprocessableEntity())
			.andExpect(jsonPath("$.errors.reason").exists());

		// the blast radius of a withdrawal names the open notices it would close
		var report = blastRadius(SECOND);
		assertThat(JsonPath.<String>read(report, "$.act")).isEqualTo("WITHDRAW");
		assertThat(JsonPath.<Integer>read(report, "$.openNoticeCount")).isEqualTo(1);
		assertThat(JsonPath.<List<String>>read(report, "$.organizations[*].organizationName"))
			.containsExactly("Asante Gold Resources");

		mvc.perform(post("/api/admin/factor-packs/editions/" + SECOND + "/withdraw").with(asApprover()).with(csrf())
			.contentType("application/json")
			.content("""
					{"reason": "The publisher retracted the 2027 tables pending a correction."}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("WITHDRAWN"))
			.andExpect(jsonPath("$.withdrawalReason")
				.value(org.hamcrest.Matchers.containsString("retracted")));

		// it leaves the import list, and a new import cannot ask for it
		var packs = body(mvc.perform(get("/api/ghg/factor-packs").with(asMember())).andExpect(status().isOk()));
		assertThat(JsonPath.<List<String>>read(packs, "$[*].id")).doesNotContain(SECOND);
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/factor-packs/" + SECOND + "/import").with(asMember())
			.with(csrf())).andExpect(status().isNotFound());
		// a superseded edition stays readable by identifier, so a past import can still be explained
		mvc.perform(get("/api/ghg/factor-packs/" + SECOND).with(asMember())).andExpect(status().isOk());

		// the rows the organization holds stay exactly as they are
		assertThat(factorValues(orgId)).isEqualTo(valuesBefore);
		assertThat(runTotals(orgId)).isEqualTo(totalsBefore);
		// and the open notice closed, so nobody is asked to decide on a withdrawn edition
		assertThat(notices.findAllByEditionIdOrderByRaisedAtAsc(SECOND))
			.allSatisfy(notice -> assertThat(notice.getStatus().name()).isEqualTo("WITHDRAWN"));
	}

	@Test
	void aDraftNeverPublishedMayBeDeletedAndAPublishedOneMayNot() throws Exception {
		createFamily();
		createDraft(FIRST, null, 2026);
		addRow(FIRST, row("TEST:diesel", "Diesel", "litre", "2.66", 2026)).andExpect(status().isCreated());

		createDraft(SECOND, FIRST, 2027);
		mvc.perform(delete("/api/admin/factor-packs/editions/" + SECOND).with(asCurator()).with(csrf()))
			.andExpect(status().isNoContent());

		uploadEvidence(FIRST, "The 2026 tables.");
		publish(FIRST, asApprover(), """
				{"sourceDocument": "A test publication, 2026 tables", "appliesFrom": "2026-01-01"}""")
			.andExpect(status().isOk());
		// clause 8.2 retains the records behind a reported figure, so a published edition is never deleted
		mvc.perform(delete("/api/admin/factor-packs/editions/" + FIRST).with(asCurator()).with(csrf()))
			.andExpect(status().isConflict());
		// nor is a draft withdrawn: no organization can see it, so there is nothing to withdraw
		createDraft(SECOND, FIRST, 2027);
		mvc.perform(post("/api/admin/factor-packs/editions/" + SECOND + "/withdraw").with(asApprover()).with(csrf())
			.contentType("application/json")
			.content("""
					{"reason": "Nothing to withdraw here at all."}""")).andExpect(status().isConflict());
	}

	@Test
	void thePublicationTrailRecordsTheEvidenceThePublicationAndTheSupersession() throws Exception {
		publishTheFirstEdition();
		authorTheSecondEdition();
		publish(SECOND).andExpect(status().isOk());

		var trail = body(mvc.perform(get("/api/admin/factor-packs/editions/" + SECOND + "/events").with(asCurator()))
			.andExpect(status().isOk()));
		assertThat(JsonPath.<List<String>>read(trail, "$[*].action")).containsExactly("EVIDENCE_ATTACHED",
				"PUBLISHED");
		assertThat(JsonPath.<List<String>>read(trail, "$[?(@.action == 'PUBLISHED')].actor"))
			.containsExactly("kofi@ecoriv.com");
		var first = body(mvc.perform(get("/api/admin/factor-packs/editions/" + FIRST + "/events").with(asCurator()))
			.andExpect(status().isOk()));
		assertThat(JsonPath.<List<String>>read(first, "$[*].action")).contains("SUPERSEDED");
	}

	@Test
	void aNonAdministratorCannotPublishOrReadTheBlastRadius() throws Exception {
		publishTheFirstEdition();
		authorTheSecondEdition();

		mvc.perform(get("/api/admin/factor-packs/editions/" + SECOND + "/blast-radius").with(asMember()))
			.andExpect(status().isForbidden());
		publish(SECOND, asMember(), """
				{"sourceDocument": "Mine now", "appliesFrom": "2027-01-01"}""")
			.andExpect(status().isForbidden());
	}
}
