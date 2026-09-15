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
import com.carbonos.ghg.internal.ActivityRecordRepository;
import com.carbonos.ghg.internal.BaseYearRepository;
import com.carbonos.ghg.internal.BoundaryTreatmentRepository;
import com.carbonos.ghg.internal.BoundaryVersionRepository;
import com.carbonos.ghg.internal.EmissionFactorRepository;
import com.carbonos.ghg.internal.FacilityRepository;
import com.carbonos.ghg.internal.FactorPackEditionRepository;
import com.carbonos.ghg.internal.FactorPackFamilyRepository;
import com.carbonos.ghg.internal.FactorPackNoticeRepository;
import com.carbonos.ghg.internal.FactorPackRowRepository;
import com.carbonos.ghg.internal.GhgRunRepository;
import com.carbonos.ghg.internal.InventoryAssignmentRepository;
import com.carbonos.ghg.internal.InventoryRepository;
import com.carbonos.ghg.internal.LegalEntityRepository;
import com.carbonos.ghg.internal.OrganizationRepository;
import com.carbonos.user.AuthenticatedUser;
import com.jayway.jsonpath.JsonPath;

/**
 * Adopting a new edition (spec 02.7). Publishing raises a notice and changes
 * nothing; this is the inbox, the diff and the decision that follow. The
 * decision is one act by one named person holding {@code REVIEWER} or
 * {@code OWNER}, it answers the recalculation question chapter 5 asks, and the
 * answer is kept whatever it is, because there is no "not triggered" status in
 * the recalculation model.
 *
 * <p>The fixture is one organization holding the 2026 edition, with a final
 * 2024 base year of 2,660 kg CO2e and a 2026 draft carrying 1,000 litres of
 * diesel. The 2027 edition moves diesel from 2.66 to 2.80, so the estimated
 * movement is 140 kg, 5.26% of the base year: just above a 5% threshold and
 * comfortably below a 10% one, which is what the significance test needs.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class FactorPackAdoptionApiIntegrationTests {

	private static final String FAMILY = "adoptpack";

	private static final String FIRST = "adoptpack-2026";

	private static final String SECOND = "adoptpack-2027";

	/** A third edition on a different Global Warming Potential basis (chapter 1, spec 02.7). */
	private static final String AR6 = "adoptpack-2028";

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
	BaseYearRepository baseYears;

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
	com.carbonos.user.internal.UserService userService;

	private final UUID curatorId = UUID.randomUUID();

	private final UUID approverId = UUID.randomUUID();

	private final UUID memberId = UUID.randomUUID();

	RequestPostProcessor asCurator() {
		return user(new AuthenticatedUser(curatorId, "ama@ecoriv.com", "irrelevant", "ADMIN", true));
	}

	RequestPostProcessor asApprover() {
		return user(new AuthenticatedUser(approverId, "kofi@ecoriv.com", "irrelevant", "ADMIN", true));
	}

	/** The organization's owner: the account that creates it, so it may accept and decline. */
	RequestPostProcessor asOwner() {
		return user(new AuthenticatedUser(memberId, "yaa@asantegold.test", "irrelevant", "MEMBER", true));
	}

	RequestPostProcessor as(com.carbonos.user.internal.User account) {
		return user(new AuthenticatedUser(account.getId(), account.getEmail(), "irrelevant", "MEMBER", true));
	}

	@BeforeEach
	@AfterEach
	void reset() {
		runs.deleteAll();
		assignments.deleteAll();
		baseYears.deleteAll();
		boundaryTreatments.deleteAll();
		boundaryVersions.deleteAll();
		inventories.deleteAll();
		activities.deleteAll();
		facilities.deleteAll();
		entities.deleteAll();
		organizations.deleteAll();
		// the seeded editions stay; everything this class published goes. Notices first, because a notice
		// points at an edition and nothing cascades to it, then the editions newest first, because a
		// successor holds a foreign key to the predecessor it superseded.
		notices.deleteAll();
		var written = new java.util.ArrayList<>(editions.findAllByPackKeyOrderByEditionIdAsc(FAMILY));
		java.util.Collections.reverse(written);
		for (var edition : written) {
			editions.delete(edition);
			editions.flush();
		}
		families.findById(FAMILY).ifPresent(families::delete);
	}

	// --- the catalogue fixture ----------------------------------------------

	String body(ResultActions actions) throws Exception {
		return actions.andReturn().getResponse().getContentAsString();
	}

	private static String row(String code, String name, String unit, String value, int year) {
		return """
				{"code": "%s", "name": "%s", "defaultScope": "SCOPE_1",
				 "defaultCategory": "STATIONARY_COMBUSTION", "scopeAgnostic": true, "unit": "%s",
				 "dataYear": %d, "sourcePublication": "An adoption test publication, %d tables",
				 "sourceUrl": "https://example.test/adopt-%d.xlsx", "publicationYear": %d,
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

	void createFamily() throws Exception {
		mvc.perform(post("/api/admin/factor-packs").with(asCurator()).with(csrf()).contentType("application/json")
			.content("""
					{"packKey": "%s", "name": "An adoption test publication", "kind": "SOURCE",
					 "summary": "Written by a test."}""".formatted(FAMILY))).andExpect(status().isCreated());
	}

	void createDraft(String editionId, String cloneFrom, int year, String gwpBasis, String appliesFrom)
			throws Exception {
		var clone = cloneFrom == null ? "null" : "\"" + cloneFrom + "\"";
		mvc.perform(post("/api/admin/factor-packs/" + FAMILY + "/editions").with(asCurator()).with(csrf())
			.contentType("application/json")
			.content("""
					{"editionId": "%s", "cloneFrom": %s, "name": "An adoption test publication %d",
					 "source": "An adoption test publication, %d tables",
					 "sourceUrl": "https://example.test/adopt-%d.xlsx",
					 "publicationYear": %d, "gwpBasis": "%s", "license": "Test licence",
					 "retrieved": "%d-01-04", "notes": "For the tests.", "appliesFrom": "%s"}"""
				.formatted(editionId, clone, year, year, year, year, gwpBasis, year, appliesFrom)))
			.andExpect(status().isCreated());
	}

	String uploadEvidence(String editionId, String content) throws Exception {
		var file = new MockMultipartFile("file", "adopt.pdf", "application/pdf",
				content.getBytes(StandardCharsets.UTF_8));
		return JsonPath.read(body(mvc.perform(multipart("/api/admin/factor-packs/editions/" + editionId + "/evidence")
			.file(file).with(asCurator()).with(csrf())).andExpect(status().isOk())), "$.checksum");
	}

	ResultActions publish(String editionId, String appliesFrom) throws Exception {
		return mvc.perform(post("/api/admin/factor-packs/editions/" + editionId + "/publish").with(asApprover())
			.with(csrf())
			.contentType("application/json")
			.content("""
					{"sourceDocument": "An adoption test publication (PDF)", "appliesFrom": "%s"}"""
				.formatted(appliesFrom)));
	}

	/** The 2026 edition, published from 2024: three rows an organization can then import. */
	void publishTheFirstEdition() throws Exception {
		createFamily();
		createDraft(FIRST, null, 2026, "AR5", "2024-01-01");
		addRow(FIRST, row("ADOPT:diesel", "Diesel", "litre", "2.66", 2026)).andExpect(status().isCreated());
		addRow(FIRST, row("ADOPT:petrol", "Petrol", "litre", "2.31", 2026)).andExpect(status().isCreated());
		addRow(FIRST, row("ADOPT:coal", "Coal", "tonne", "2400", 2026)).andExpect(status().isCreated());
		uploadEvidence(FIRST, "The 2026 tables, as published.");
		publish(FIRST, "2024-01-01").andExpect(status().isOk());
	}

	/**
	 * The 2027 edition: diesel moves 5.26 percent, petrol stands still, coal is
	 * dropped and LPG is new. It applies from 2026-01-01, which is the start of
	 * the organization's open draft period and inside no locked one.
	 */
	void publishTheSecondEdition() throws Exception {
		createDraft(SECOND, FIRST, 2027, "AR5", "2026-01-01");
		var rows = body(mvc.perform(get("/api/admin/factor-packs/editions/" + SECOND + "/rows").with(asCurator())
			.param("size", "200")).andExpect(status().isOk()));
		var dieselId = JsonPath.<List<String>>read(rows, "$.items[?(@.code == 'ADOPT:diesel')].id").getFirst();
		var coalId = JsonPath.<List<String>>read(rows, "$.items[?(@.code == 'ADOPT:coal')].id").getFirst();
		mvc.perform(put("/api/admin/factor-packs/editions/" + SECOND + "/rows/" + dieselId).with(asCurator())
			.with(csrf())
			.contentType("application/json")
			.content(row("ADOPT:diesel", "Diesel", "litre", "2.80", 2027))).andExpect(status().isOk());
		mvc.perform(delete("/api/admin/factor-packs/editions/" + SECOND + "/rows/" + coalId).with(asCurator())
			.with(csrf())).andExpect(status().isNoContent());
		addRow(SECOND, row("ADOPT:lpg", "LPG", "litre", "1.56", 2027)).andExpect(status().isCreated());
		uploadEvidence(SECOND, "The 2027 tables, as published.");
		publish(SECOND, "2026-01-01").andExpect(status().isOk());
	}

	// --- the tenant fixture -------------------------------------------------

	String createOrganization(String name) throws Exception {
		return JsonPath.read(body(mvc
			.perform(post("/api/ghg/organizations").with(asOwner()).with(csrf()).contentType("application/json")
				.content("""
						{"name": "%s"}""".formatted(name)))
			.andExpect(status().isCreated())), "$.id");
	}

	String createFacility(String orgId, String name) throws Exception {
		return JsonPath.read(body(mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/facilities").with(asOwner()).with(csrf())
				.contentType("application/json")
				.content("""
						{"name": "%s", "location": "Tema, Ghana", "entityId": null}""".formatted(name)))
			.andExpect(status().isCreated())), "$.id");
	}

	String createActivity(String orgId, String facilityId, String date, String quantity) throws Exception {
		return JsonPath.read(body(mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/activities").with(asOwner()).with(csrf())
				.contentType("application/json")
				.content("""
						{"facilityId": "%s", "activityType": "Diesel", "quantity": %s, "unit": "litre",
						 "periodStart": "%s", "periodEnd": "%s", "dataSource": "Fuel invoice",
						 "evidenceRef": "INV-2938", "dataQuality": "MEASURED"}"""
					.formatted(facilityId, quantity, date, date)))
			.andExpect(status().isCreated())), "$.id");
	}

	/** An inventory over the year, with the facility in its boundary and the diesel record classified. */
	String createInventory(String orgId, String name, String start, String end, String facilityId, String activityId)
			throws Exception {
		var inventoryId = JsonPath.<String>read(body(mvc
			.perform(post("/api/ghg/organizations/" + orgId + "/inventories").with(asOwner()).with(csrf())
				.contentType("application/json")
				.content("""
						{"name": "%s", "periodStart": "%s", "periodEnd": "%s",
						 "purpose": "Corporate reporting", "consolidationApproach": "OPERATIONAL_CONTROL"}"""
					.formatted(name, start, end)))
			.andExpect(status().isCreated())), "$.id");
		mvc.perform(put("/api/ghg/inventories/" + inventoryId + "/boundary/" + facilityId).with(asOwner()).with(csrf())
			.contentType("application/json").content("{}")).andExpect(status().isOk());
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/assignments/sync").with(asOwner()).with(csrf()))
			.andExpect(status().isOk());
		var listing = body(mvc.perform(get("/api/ghg/inventories/" + inventoryId + "/assignments").with(asOwner()))
			.andExpect(status().isOk()));
		var assignmentId = JsonPath.<List<String>>read(listing, "$[?(@.activityId == '" + activityId + "')].id")
			.getFirst();
		mvc.perform(put("/api/ghg/assignments/" + assignmentId + "/classify").with(asOwner()).with(csrf())
			.contentType("application/json")
			.content("""
					{"emissionFactorId": "%s"}""".formatted(factorId(orgId, "ADOPT:diesel"))))
			.andExpect(status().isOk());
		return inventoryId;
	}

	/** Freezes, runs, and designates the run final; returns the run's identifier. */
	String reportOn(String inventoryId) throws Exception {
		mvc.perform(post("/api/ghg/inventories/" + inventoryId + "/freeze").with(asOwner()).with(csrf()))
			.andExpect(status().isOk());
		var runId = JsonPath.<String>read(body(mvc
			.perform(post("/api/ghg/inventories/" + inventoryId + "/runs").with(asOwner()).with(csrf())
				.contentType("application/json").content("""
						{"label": "Run"}"""))
			.andExpect(status().isCreated())), "$.run.id");
		mvc.perform(post("/api/ghg/runs/" + runId + "/finalize").with(asOwner()).with(csrf())
			.contentType("application/json").content("{}")).andExpect(status().isOk());
		return runId;
	}

	/** The whole fixture: the catalogue, the holder, its base year and its open draft. */
	Holder holder() throws Exception {
		return holder(new BigDecimal("5"));
	}

	Holder holder(BigDecimal thresholdPercent) throws Exception {
		publishTheFirstEdition();
		var orgId = createOrganization("Asante Gold Resources");
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/factor-packs/" + FIRST + "/import").with(asOwner())
			.with(csrf())).andExpect(status().isOk());
		var facilityId = createFacility(orgId, "Obuom Processing Plant");
		var baseActivity = createActivity(orgId, facilityId, "2024-06-01", "1000");
		var baseInventory = createInventory(orgId, "2024", "2024-01-01", "2024-12-31", facilityId, baseActivity);
		var baseRun = reportOn(baseInventory);
		mvc.perform(put("/api/ghg/organizations/" + orgId + "/base-year").with(asOwner()).with(csrf())
			.contentType("application/json")
			.content("""
					{"inventoryId": "%s", "thresholdPercent": %s,
					 "reason": "First year with metered data at every site."}"""
				.formatted(baseInventory, thresholdPercent.toPlainString())))
			.andExpect(status().isOk());
		var draftActivity = createActivity(orgId, facilityId, "2026-06-01", "1000");
		var draft = createInventory(orgId, "2026", "2026-01-01", "2026-12-31", facilityId, draftActivity);
		publishTheSecondEdition();
		return new Holder(orgId, facilityId, baseInventory, baseRun, draft);
	}

	record Holder(String orgId, String facilityId, String baseInventoryId, String baseRunId, String draftInventoryId) {
	}

	String factorId(String organizationId, String code) {
		return emissionFactors.findAllByOrganizationIdAndPackCodeIsNotNull(UUID.fromString(organizationId))
			.stream()
			.filter(factor -> code.equals(factor.getPackCode()))
			.filter(com.carbonos.ghg.internal.EmissionFactor::isLive)
			.findFirst()
			.orElseThrow(() -> new AssertionError("no live factor for " + code))
			.getId()
			.toString();
	}

	String noticeId(String organizationId) throws Exception {
		var listing = body(mvc.perform(get("/api/ghg/organizations/" + organizationId + "/factor-pack-notices")
			.with(asOwner())).andExpect(status().isOk()));
		return JsonPath.<List<String>>read(listing, "$[?(@.editionId == '" + SECOND + "')].id").getFirst();
	}

	String diff(String noticeId) throws Exception {
		return body(mvc.perform(get("/api/ghg/factor-pack-notices/" + noticeId + "/diff").with(asOwner()))
			.andExpect(status().isOk()));
	}

	ResultActions accept(String noticeId, String answer, String note, RequestPostProcessor who) throws Exception {
		var noteJson = note == null ? "null" : "\"" + note + "\"";
		return mvc.perform(post("/api/ghg/factor-pack-notices/" + noticeId + "/accept").with(who).with(csrf())
			.contentType("application/json")
			.content("""
					{"recalculationCase": %s, "note": %s}"""
				.formatted(answer == null ? "null" : "\"" + answer + "\"", noteJson)));
	}

	Map<String, BigDecimal> factorValues(String organizationId) {
		var values = new LinkedHashMap<String, BigDecimal>();
		emissionFactors.findAllByOrganizationIdAndPackCodeIsNotNull(UUID.fromString(organizationId))
			.stream()
			.filter(com.carbonos.ghg.internal.EmissionFactor::isLive)
			.forEach(factor -> values.put(factor.getPackCode(), factor.getKgCo2ePerUnit()));
		return values;
	}

	// --- publication changes nothing ----------------------------------------

	@Test
	void publishingRaisesOneNoticePerHolderAndChangesNoNumbers() throws Exception {
		var holder = holder();
		// the 2027 edition is published; every value the organization holds is exactly what it was
		assertThat(factorValues(holder.orgId())).containsEntry("ADOPT:diesel", new BigDecimal("2.660000"))
			.containsEntry("ADOPT:petrol", new BigDecimal("2.310000"));
		assertThat(runs.findById(UUID.fromString(holder.baseRunId())).orElseThrow().getTotalKgCo2e())
			.isEqualByComparingTo("2660");

		mvc.perform(get("/api/ghg/organizations/" + holder.orgId() + "/factor-pack-notices").with(asOwner()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.length()").value(1))
			.andExpect(jsonPath("$[0].editionId").value(SECOND))
			.andExpect(jsonPath("$[0].predecessorEditionId").value(FIRST))
			.andExpect(jsonPath("$[0].status").value("OPEN"))
			.andExpect(jsonPath("$[0].rowsAffected").value(1))
			.andExpect(jsonPath("$[0].rowsOverThreshold").value(1))
			.andExpect(jsonPath("$[0].diffHash").isNotEmpty());
	}

	// --- the diff -----------------------------------------------------------

	@Test
	void anOpenNoticeShowsThePerRowDiffAndTheEstimatedTonnageMovement() throws Exception {
		var holder = holder();
		var diff = diff(noticeId(holder.orgId()));

		assertThat(JsonPath.<String>read(diff, "$.editionId")).isEqualTo(SECOND);
		assertThat(JsonPath.<String>read(diff, "$.appliesFrom")).isEqualTo("2026-01-01");
		// diesel: the value held, the value the edition carries, the absolute and the percent change
		assertThat(JsonPath.<List<Object>>read(diff, "$.rows[?(@.code == 'ADOPT:diesel')].currentKgCo2ePerUnit")
			.getFirst()).asString().startsWith("2.66");
		assertThat(JsonPath.<List<Object>>read(diff, "$.rows[?(@.code == 'ADOPT:diesel')].newKgCo2ePerUnit")
			.getFirst()).asString().startsWith("2.8");
		assertThat(new BigDecimal(JsonPath
			.<List<Object>>read(diff, "$.rows[?(@.code == 'ADOPT:diesel')].percentChange").getFirst().toString()))
			.isEqualByComparingTo("5.2632");
		// which gas components changed: the 2027 row moves CO2 with the headline figure
		assertThat(JsonPath.<List<List<String>>>read(diff, "$.rows[?(@.code == 'ADOPT:diesel')].gasesChanged")
			.getFirst()).contains("CO2");
		// whether provenance changed, the publication year among the four facts it is made of
		assertThat(JsonPath.<List<Boolean>>read(diff, "$.rows[?(@.code == 'ADOPT:diesel')].provenanceChanged")
			.getFirst()).isTrue();
		// the estimated movement over the current draft period: 1,000 litres x 0.14 kg = 140 kg
		assertThat(new BigDecimal(JsonPath
			.<List<Object>>read(diff, "$.rows[?(@.code == 'ADOPT:diesel')].estimatedKgCo2eDelta").getFirst()
			.toString())).isEqualByComparingTo("140");
		assertThat(new BigDecimal(JsonPath.<Object>read(diff, "$.estimatedKgCo2eDelta").toString()))
			.isEqualByComparingTo("140");
		assertThat(JsonPath.<String>read(diff, "$.estimatedOver")).isEqualTo("2026");
		// 140 of 2,660 kg is 5.26% of base-year emissions, measured against the 5% threshold
		assertThat(new BigDecimal(JsonPath.<Object>read(diff, "$.affectedPercent").toString()))
			.isEqualByComparingTo("5.26");
		assertThat(new BigDecimal(JsonPath.<Object>read(diff, "$.thresholdPercent").toString()))
			.isEqualByComparingTo("5");
		// petrol stands still and is still shown, because the decision applies to it too
		assertThat(JsonPath.<List<Object>>read(diff, "$.rows[?(@.code == 'ADOPT:petrol')].code")).hasSize(1);
		// the diff hash is the notice's own, so the record describes the diff the decider saw
		assertThat(JsonPath.<String>read(diff, "$.diffHash"))
			.isEqualTo(notices.findById(UUID.fromString(noticeId(holder.orgId()))).orElseThrow().getDiffHash());
	}

	@Test
	void theDiffListsConflictsBlockedRowsAndDiscontinuedLineagesApart() throws Exception {
		var holder = holder();
		// petrol is corrected here, so spec 02.6 never touches it, whatever the decision
		mvc.perform(put("/api/ghg/emission-factors/" + factorId(holder.orgId(), "ADOPT:petrol")).with(asOwner())
			.with(csrf())
			.contentType("application/json")
			.content("""
					{"name": "Petrol", "defaultScope": "SCOPE_1", "defaultCategory": "STATIONARY_COMBUSTION",
					 "scopeAgnostic": true, "unit": "litre", "kgCo2ePerUnit": 2.40, "co2KgPerUnit": 2.40,
					 "source": "Corrected from the meter", "approved": true}"""))
			.andExpect(status().isOk());
		// the draft period is frozen, and 2026-01-01 falls inside it, so diesel cannot move there
		mvc.perform(post("/api/ghg/inventories/" + holder.draftInventoryId() + "/freeze").with(asOwner())
			.with(csrf())).andExpect(status().isOk());

		var diff = diff(noticeId(holder.orgId()));
		assertThat(JsonPath.<List<String>>read(diff, "$.conflicts[*].code")).containsExactly("ADOPT:petrol");
		assertThat(JsonPath.<List<String>>read(diff, "$.blocked[*].code")).containsExactly("ADOPT:diesel");
		assertThat(JsonPath.<List<String>>read(diff, "$.discontinued[*].code")).containsExactly("ADOPT:coal");
		assertThat(JsonPath.<String>read(diff, "$.discontinued[0].reason")).contains("does not carry this lineage")
			.contains("separate decision");
		assertThat(JsonPath.<String>read(diff, "$.lockedPeriod.name")).isEqualTo("2026");
	}

	@Test
	void theDiffListsEarlierPeriodsThatWillRaiseCoverageWarnings() throws Exception {
		var holder = holder();
		var diff = diff(noticeId(holder.orgId()));
		// the 2024 base year ends before 2026-01-01, so the new version does not cover it; the warning
		// that follows is correct and is what a vintage means
		assertThat(JsonPath.<List<String>>read(diff, "$.earlierPeriods[*].name")).containsExactly("2024");
		assertThat(JsonPath.<List<String>>read(diff, "$.earlierPeriods[*].inventoryId"))
			.containsExactly(holder.baseInventoryId());
	}

	@Test
	void aGwpBasisChangeIsShownAndCannotBeAnsweredAsAVintageProgression() throws Exception {
		var holder = holder();
		// a 2028 edition on AR6: chapter 1 requires one basis across the inventory and across years
		createDraft(AR6, SECOND, 2028, "AR6", "2027-01-01");
		uploadEvidence(AR6, "The 2028 tables, on AR6.");
		publish(AR6, "2027-01-01").andExpect(status().isOk());
		var listing = body(mvc.perform(get("/api/ghg/organizations/" + holder.orgId() + "/factor-pack-notices")
			.with(asOwner())).andExpect(status().isOk()));
		var ar6Notice = JsonPath.<List<String>>read(listing, "$[?(@.editionId == '" + AR6 + "')].id").getFirst();

		var diff = diff(ar6Notice);
		assertThat(JsonPath.<Boolean>read(diff, "$.gwpBasisChanged")).isTrue();
		assertThat(JsonPath.<String>read(diff, "$.currentGwpBasis")).isEqualTo("AR5");
		assertThat(JsonPath.<String>read(diff, "$.newGwpBasis")).isEqualTo("AR6");

		accept(ar6Notice, "VINTAGE_PROGRESSION", null, asOwner()).andExpect(status().isUnprocessableEntity())
			.andExpect(jsonPath("$.errors.recalculationCase").exists());
		// answered as what it is, the adoption goes through
		accept(ar6Notice, "RETROSPECTIVE_ADOPTION", "Restating 2026 on AR6.", asOwner()).andExpect(status().isOk());
	}

	// --- the decision -------------------------------------------------------

	@Test
	void acceptingRecordsTheNamedPersonTheTimestampTheEditionIdsAndTheDiffHash() throws Exception {
		var holder = holder();
		var noticeId = noticeId(holder.orgId());
		var hashBefore = notices.findById(UUID.fromString(noticeId)).orElseThrow().getDiffHash();

		accept(noticeId, "VINTAGE_PROGRESSION", "Above the threshold: the 2027 tables are the current vintage.",
				asOwner()).andExpect(status().isOk());

		var notice = notices.findById(UUID.fromString(noticeId)).orElseThrow();
		assertThat(notice.getStatus()).isEqualTo(com.carbonos.ghg.internal.FactorPackNotice.Status.ACCEPTED);
		assertThat(notice.getDecidedBy()).isEqualTo("yaa@asantegold.test");
		assertThat(notice.getDecidedByRole()).isEqualTo(com.carbonos.ghg.internal.OrgRole.OWNER);
		assertThat(notice.getDecidedAt()).isNotNull();
		assertThat(notice.getAppliedAt()).isNotNull();
		assertThat(notice.getEditionId()).isEqualTo(SECOND);
		assertThat(notice.getPredecessorEditionId()).isEqualTo(FIRST);
		assertThat(notice.getDiffHash()).isEqualTo(hashBefore);

		// the act appears on the organization's history beside freezes and publications
		mvc.perform(get("/api/ghg/organizations/" + holder.orgId() + "/events").with(asOwner()))
			.andExpect(jsonPath("$[?(@.action == 'FACTOR_PACK_ADOPTED')].actor").value(
					org.hamcrest.Matchers.hasItem("yaa@asantegold.test")));
	}

	@Test
	void acceptingAppliesTheImportFromTheEditionsAppliesFromDate() throws Exception {
		var holder = holder();
		accept(noticeId(holder.orgId()), "VINTAGE_PROGRESSION", "The 2027 tables are the current vintage.", asOwner())
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.edition").value(SECOND))
			.andExpect(jsonPath("$.appliesFrom").value("2026-01-01"))
			.andExpect(jsonPath("$.versioned").value(1))
			.andExpect(jsonPath("$.created").value(1));

		// the incumbent is closed the day before and a new version carries 2.80 from the applies-from date
		var versions = emissionFactors.findAllByOrganizationIdAndPackCodeIsNotNull(UUID.fromString(holder.orgId()))
			.stream()
			.filter(factor -> "ADOPT:diesel".equals(factor.getPackCode()))
			.toList();
		assertThat(versions).hasSize(2);
		assertThat(versions.stream().filter(com.carbonos.ghg.internal.EmissionFactor::isLive))
			.singleElement()
			.satisfies(live -> {
				assertThat(live.getKgCo2ePerUnit()).isEqualByComparingTo("2.80");
				assertThat(live.getValidFrom()).isEqualTo(java.time.LocalDate.of(2026, 1, 1));
			});
		assertThat(versions.stream().filter(factor -> !factor.isLive())).singleElement().satisfies(closed -> {
			assertThat(closed.getKgCo2ePerUnit()).isEqualByComparingTo("2.66");
			assertThat(closed.getValidTo()).isEqualTo(java.time.LocalDate.of(2025, 12, 31));
		});
		// the base year's reported figure is untouched: a cut version never reaches a past run
		assertThat(runs.findById(UUID.fromString(holder.baseRunId())).orElseThrow().getTotalKgCo2e())
			.isEqualByComparingTo("2660");
	}

	@Test
	void decliningChangesNothingAndClosesTheNotice() throws Exception {
		var holder = holder();
		var before = factorValues(holder.orgId());
		var noticeId = noticeId(holder.orgId());

		mvc.perform(post("/api/ghg/factor-pack-notices/" + noticeId + "/decline").with(asOwner()).with(csrf())
			.contentType("application/json").content("""
					{"note": "We report 2026 on the 2026 tables."}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("DECLINED"))
			.andExpect(jsonPath("$.decidedBy").value("yaa@asantegold.test"))
			.andExpect(jsonPath("$.recalculationCase").doesNotExist());

		assertThat(factorValues(holder.orgId())).isEqualTo(before);
		assertThat(baseYears.findByOrganizationId(UUID.fromString(holder.orgId())).orElseThrow().getRecalculations())
			.isEmpty();
		mvc.perform(get("/api/ghg/organizations/" + holder.orgId() + "/events").with(asOwner()))
			.andExpect(jsonPath("$[?(@.action == 'FACTOR_PACK_DECLINED')]").isNotEmpty());
		// a decision on an edition is made once
		mvc.perform(post("/api/ghg/factor-pack-notices/" + noticeId + "/decline").with(asOwner()).with(csrf())
			.contentType("application/json").content("{}")).andExpect(status().isConflict());
	}

	@Test
	void adoptionIsBlockedWhileACoveringPeriodIsLocked() throws Exception {
		var holder = holder();
		// 2026-01-01 falls inside the 2026 period, and the period is frozen
		mvc.perform(post("/api/ghg/inventories/" + holder.draftInventoryId() + "/freeze").with(asOwner())
			.with(csrf())).andExpect(status().isOk());
		var noticeId = noticeId(holder.orgId());

		accept(noticeId, "VINTAGE_PROGRESSION", "The 2027 tables.", asOwner()).andExpect(status().isConflict())
			.andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("2026")));
		assertThat(notices.findById(UUID.fromString(noticeId)).orElseThrow().getStatus())
			.isEqualTo(com.carbonos.ghg.internal.FactorPackNotice.Status.OPEN);
		assertThat(factorValues(holder.orgId())).containsEntry("ADOPT:diesel", new BigDecimal("2.660000"));

		// declining stays available, because declining writes no factor
		mvc.perform(post("/api/ghg/factor-pack-notices/" + noticeId + "/decline").with(asOwner()).with(csrf())
			.contentType("application/json").content("{}")).andExpect(status().isOk());
	}

	@Test
	void aPreparerCannotDecideAndAVerifierCannotEither() throws Exception {
		var holder = holder();
		var preparer = userService.create("kwame@asantegold.test", "Kwame Preparer",
				com.carbonos.user.internal.UserRole.MEMBER, "preparer-passw0rd");
		var verifier = userService.create("efua@verify.test", "Efua Verifier",
				com.carbonos.user.internal.UserRole.MEMBER, "verifier-passw0rd");
		for (var pair : List.of(List.of("kwame@asantegold.test", "PREPARER"),
				List.of("efua@verify.test", "VERIFIER"))) {
			mvc.perform(post("/api/ghg/organizations/" + holder.orgId() + "/members").with(asOwner()).with(csrf())
				.contentType("application/json")
				.content("""
						{"email": "%s", "role": "%s"}""".formatted(pair.get(0), pair.get(1))))
				.andExpect(status().isCreated());
		}
		var noticeId = noticeId(holder.orgId());

		// both read the diff: moving a vintage is an accounting decision, not a secret
		mvc.perform(get("/api/ghg/factor-pack-notices/" + noticeId + "/diff").with(as(preparer)))
			.andExpect(status().isOk());
		mvc.perform(get("/api/ghg/factor-pack-notices/" + noticeId + "/diff").with(as(verifier)))
			.andExpect(status().isOk());

		accept(noticeId, "VINTAGE_PROGRESSION", "A note.", as(preparer)).andExpect(status().isForbidden())
			.andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("REVIEWER or OWNER")));
		accept(noticeId, "VINTAGE_PROGRESSION", "A note.", as(verifier)).andExpect(status().isForbidden());
		mvc.perform(post("/api/ghg/factor-pack-notices/" + noticeId + "/decline").with(as(preparer)).with(csrf())
			.contentType("application/json").content("{}")).andExpect(status().isForbidden());
		mvc.perform(post("/api/ghg/factor-pack-notices/" + noticeId + "/decline").with(as(verifier)).with(csrf())
			.contentType("application/json").content("{}")).andExpect(status().isForbidden());
		assertThat(notices.findById(UUID.fromString(noticeId)).orElseThrow().getStatus())
			.isEqualTo(com.carbonos.ghg.internal.FactorPackNotice.Status.OPEN);

		// promoted to reviewer, the same person decides
		var members = body(mvc.perform(get("/api/ghg/organizations/" + holder.orgId() + "/members").with(asOwner())));
		var memberRow = JsonPath.<List<String>>read(members, "$[?(@.email == 'kwame@asantegold.test')].id").getFirst();
		mvc.perform(put("/api/ghg/organizations/" + holder.orgId() + "/members/" + memberRow).with(asOwner())
			.with(csrf()).contentType("application/json").content("""
					{"role": "REVIEWER"}""")).andExpect(status().isOk());
		accept(noticeId, "VINTAGE_PROGRESSION", "The 2027 tables are the current vintage.", as(preparer))
			.andExpect(status().isOk());
		assertThat(notices.findById(UUID.fromString(noticeId)).orElseThrow().getDecidedByRole())
			.isEqualTo(com.carbonos.ghg.internal.OrgRole.REVIEWER);
	}

	/**
	 * Spec 01.5 with spec 02.7: the platform curates and publishes the edition,
	 * so the platform must not also accept it for the tenant. Support access
	 * carries an owner's rights, but never this decision.
	 */
	@Test
	void anAdministratorUnderSupportAccessCannotDecideForTheOrganization() throws Exception {
		var holder = holder();
		var admin = userService.create("support-access@ecoriv.com", "Ama Support",
				com.carbonos.user.internal.UserRole.ADMIN, "support-passw0rd");
		var asAdmin = user(new com.carbonos.user.AuthenticatedUser(admin.getId(), admin.getEmail(), "irrelevant",
				"ADMIN", true));
		var noticeId = noticeId(holder.orgId());

		mvc.perform(post("/api/ghg/organizations/" + holder.orgId() + "/support-access").with(asAdmin).with(csrf())
			.contentType("application/json").content("""
					{"reason":"ticket 4512, the import looks wrong"}"""))
			.andExpect(status().isCreated());

		// the grant carries an owner's reach: the diff opens
		mvc.perform(get("/api/ghg/factor-pack-notices/" + noticeId + "/diff").with(asAdmin))
			.andExpect(status().isOk());

		// but not the decision itself, in either direction
		accept(noticeId, "VINTAGE_PROGRESSION", "A note.", asAdmin).andExpect(status().isForbidden())
			.andExpect(jsonPath("$.detail")
				.value(org.hamcrest.Matchers.containsString("the organization's own decision")));
		mvc.perform(post("/api/ghg/factor-pack-notices/" + noticeId + "/decline").with(asAdmin).with(csrf())
			.contentType("application/json").content("{}"))
			.andExpect(status().isForbidden());

		assertThat(notices.findById(UUID.fromString(noticeId)).orElseThrow().getStatus())
			.isEqualTo(com.carbonos.ghg.internal.FactorPackNotice.Status.OPEN);

		// the organization's own reviewer still decides
		accept(noticeId, "VINTAGE_PROGRESSION", "The 2027 tables are the current vintage.", asOwner())
			.andExpect(status().isOk());
	}

	// --- the recalculation question -----------------------------------------

	@Test
	void theRecalculationAnswerIsRecordedForEveryCase() throws Exception {
		// a 10% threshold, so the 5.26% movement is a vintage progression that triggers nothing
		var holder = holder(new BigDecimal("10"));
		var noticeId = noticeId(holder.orgId());

		// the answer is required, and only the three chapter 5 distinguishes are answers
		accept(noticeId, null, null, asOwner()).andExpect(status().isUnprocessableEntity())
			.andExpect(jsonPath("$.errors.recalculationCase").exists());
		accept(noticeId, "NOT_TRIGGERED", null, asOwner()).andExpect(status().isUnprocessableEntity())
			.andExpect(jsonPath("$.errors.recalculationCase").exists());

		accept(noticeId, "VINTAGE_PROGRESSION", null, asOwner()).andExpect(status().isOk());

		var notice = notices.findById(UUID.fromString(noticeId)).orElseThrow();
		assertThat(notice.getRecalculationCase())
			.isEqualTo(com.carbonos.ghg.internal.FactorPackNotice.RecalculationCase.VINTAGE_PROGRESSION);
		// the answer, the threshold and the affected percent are stored as they stood at the decision,
		// and that record is the "not triggered" evidence, because the model has no such status
		assertThat(notice.getSignificanceThresholdPercent()).isEqualByComparingTo("10");
		assertThat(notice.getAffectedPercent()).isEqualByComparingTo("5.26");
		assertThat(notice.getRecalculationId()).isNull();
		assertThat(notice.getScopesAffected()).isEqualTo("SCOPE_1");
		assertThat(baseYears.findByOrganizationId(UUID.fromString(holder.orgId())).orElseThrow().getRecalculations())
			.isEmpty();
	}

	@Test
	void anAboveThresholdVintageProgressionRaisesAMethodologyChangeCandidate() throws Exception {
		var holder = holder();
		var noticeId = noticeId(holder.orgId());

		// 5.26% is at or above the 5% threshold, so it is a methodology change and the note is required
		accept(noticeId, "VINTAGE_PROGRESSION", null, asOwner()).andExpect(status().isUnprocessableEntity())
			.andExpect(jsonPath("$.errors.note").exists());

		accept(noticeId, "VINTAGE_PROGRESSION", "The 2027 tables supersede the 2026 ones for 2026 onwards.",
				asOwner()).andExpect(status().isOk());

		var baseYear = baseYears.findByOrganizationId(UUID.fromString(holder.orgId())).orElseThrow();
		assertThat(baseYear.getRecalculations()).singleElement().satisfies(candidate -> {
			assertThat(candidate.getTriggerType())
				.isEqualTo(com.carbonos.ghg.internal.RecalculationTrigger.METHODOLOGY_CHANGE);
			assertThat(candidate.getReason()).contains(SECOND).contains("vintage progression");
			assertThat(candidate.getAffectedPercent()).isEqualByComparingTo("5.26");
			assertThat(candidate.isAboveThreshold()).isTrue();
		});
		var notice = notices.findById(UUID.fromString(noticeId)).orElseThrow();
		assertThat(notice.getRecalculationId()).isEqualTo(baseYear.getRecalculations().getFirst().getId());
	}

	@Test
	void aRetrospectiveAdoptionRaisesAMethodologyChangeCandidate() throws Exception {
		var holder = holder(new BigDecimal("10"));
		accept(noticeId(holder.orgId()), "RETROSPECTIVE_ADOPTION", "Restating 2024 on the 2027 tables.", asOwner())
			.andExpect(status().isOk());

		assertThat(baseYears.findByOrganizationId(UUID.fromString(holder.orgId())).orElseThrow().getRecalculations())
			.singleElement()
			.satisfies(candidate -> assertThat(candidate.getTriggerType())
				.isEqualTo(com.carbonos.ghg.internal.RecalculationTrigger.METHODOLOGY_CHANGE));
	}

	@Test
	void anErratumRaisesAnErrorCorrectionCandidate() throws Exception {
		var holder = holder(new BigDecimal("10"));
		accept(noticeId(holder.orgId()), "ERRATUM_ON_REPORTED_YEAR", "The 2026 diesel row was wrong.", asOwner())
			.andExpect(status().isOk());

		assertThat(baseYears.findByOrganizationId(UUID.fromString(holder.orgId())).orElseThrow().getRecalculations())
			.singleElement()
			.satisfies(candidate -> assertThat(candidate.getTriggerType())
				.isEqualTo(com.carbonos.ghg.internal.RecalculationTrigger.ERROR_CORRECTION));
	}

	@Test
	void anOrganizationWithNoBaseYearRecordsTheAnswerAndRaisesNoCandidate() throws Exception {
		var holder = holder();
		mvc.perform(delete("/api/ghg/organizations/" + holder.orgId() + "/base-year").with(asOwner()).with(csrf()))
			.andExpect(status().isNoContent());
		var noticeId = noticeId(holder.orgId());

		// no base year, so no threshold to measure against and no candidate to carry: the answer alone
		accept(noticeId, "RETROSPECTIVE_ADOPTION", null, asOwner()).andExpect(status().isOk());

		var notice = notices.findById(UUID.fromString(noticeId)).orElseThrow();
		assertThat(notice.getRecalculationCase())
			.isEqualTo(com.carbonos.ghg.internal.FactorPackNotice.RecalculationCase.RETROSPECTIVE_ADOPTION);
		assertThat(notice.getRecalculationId()).isNull();
		assertThat(notice.getSignificanceThresholdPercent()).isNull();
		assertThat(baseYears.findByOrganizationId(UUID.fromString(holder.orgId()))).isEmpty();
	}

	// --- the hold -----------------------------------------------------------

	@Test
	void acceptingHoldsFinalAndPublishButNeverBlocksARun() throws Exception {
		var holder = holder();
		// a 2025 inventory already reported against the 2024 base year, and not yet published
		var reportedActivity = createActivity(holder.orgId(), holder.facilityId(), "2025-06-01", "1000");
		var reported = createInventory(holder.orgId(), "2025", "2025-01-01", "2025-12-31", holder.facilityId(),
				reportedActivity);
		reportOn(reported);

		accept(noticeId(holder.orgId()), "VINTAGE_PROGRESSION", "The 2027 tables, from 2026.", asOwner())
			.andExpect(status().isOk());
		assertThat(baseYears.findByOrganizationId(UUID.fromString(holder.orgId())).orElseThrow().getRecalculations())
			.singleElement()
			.satisfies(candidate -> assertThat(candidate.isAboveThreshold()).isTrue());

		// the hold is on publishing the 2025 report
		mvc.perform(post("/api/ghg/inventories/" + reported + "/publish").with(asOwner()).with(csrf()))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("cannot be published")));

		// it is never on the run: quantifying the movement is how the recalculation is assessed
		mvc.perform(post("/api/ghg/inventories/" + holder.draftInventoryId() + "/freeze").with(asOwner())
			.with(csrf())).andExpect(status().isOk());
		var runId = JsonPath.<String>read(body(mvc
			.perform(post("/api/ghg/inventories/" + holder.draftInventoryId() + "/runs").with(asOwner()).with(csrf())
				.contentType("application/json").content("""
						{"label": "Assessing the movement"}"""))
			.andExpect(status().isCreated())), "$.run.id");

		// and the run cannot be designated final while the candidate stands
		mvc.perform(post("/api/ghg/runs/" + runId + "/finalize").with(asOwner()).with(csrf())
			.contentType("application/json").content("{}")).andExpect(status().isConflict())
			.andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("cannot be marked final")));

		// the BASE_YEAR gate still says so, as a finding rather than a refusal to calculate
		mvc.perform(get("/api/ghg/inventories/" + holder.draftInventoryId() + "/validation").with(asOwner()))
			.andExpect(jsonPath("$.gates[?(@.gate == 'BASE_YEAR')].status").value(
					org.hamcrest.Matchers.hasItem("BLOCKED")));

		// once the recalculation is decided, both acts open again
		var baseYear = baseYears.findByOrganizationId(UUID.fromString(holder.orgId())).orElseThrow();
		mvc.perform(post("/api/ghg/organizations/" + holder.orgId() + "/base-year/recalculations/"
				+ baseYear.getRecalculations().getFirst().getId() + "/decide").with(asOwner()).with(csrf())
			.contentType("application/json")
			.content("""
					{"decision": "DECLINED", "note": "Below materiality for the reported years."}"""))
			.andExpect(status().isOk());
		mvc.perform(post("/api/ghg/runs/" + runId + "/finalize").with(asOwner()).with(csrf())
			.contentType("application/json").content("{}")).andExpect(status().isOk());
	}

	// --- the report ---------------------------------------------------------

	@Test
	void theReportsBaseYearSectionPrintsEveryEditionDecision() throws Exception {
		var holder = holder();
		accept(noticeId(holder.orgId()), "VINTAGE_PROGRESSION", "The 2027 tables are the current vintage.", asOwner())
			.andExpect(status().isOk());

		mvc.perform(get("/api/ghg/runs/" + holder.baseRunId() + "/report").with(asOwner()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.baseYear.editionDecisions.length()").value(1))
			.andExpect(jsonPath("$.baseYear.editionDecisions[0].editionId").value(SECOND))
			.andExpect(jsonPath("$.baseYear.editionDecisions[0].predecessorEditionId").value(FIRST))
			.andExpect(jsonPath("$.baseYear.editionDecisions[0].recalculationCase").value("VINTAGE_PROGRESSION"))
			.andExpect(jsonPath("$.baseYear.editionDecisions[0].recalculationCaseLabel")
				.value("a vintage progression"))
			.andExpect(jsonPath("$.baseYear.editionDecisions[0].affectedPercent").value(5.26))
			.andExpect(jsonPath("$.baseYear.editionDecisions[0].thresholdPercent").value(5.00))
			.andExpect(jsonPath("$.baseYear.editionDecisions[0].decidedBy").value("yaa@asantegold.test"))
			.andExpect(jsonPath("$.baseYear.editionDecisions[0].note")
				.value("The 2027 tables are the current vintage."));
	}

	// --- withdrawal ---------------------------------------------------------

	@Test
	void withdrawingAnEditionClosesItsOpenNotices() throws Exception {
		var holder = holder();
		mvc.perform(post("/api/admin/factor-packs/editions/" + SECOND + "/withdraw").with(asApprover()).with(csrf())
			.contentType("application/json")
			.content("""
					{"reason": "The 2027 diesel row transcribed the wrong column of the source table."}"""))
			.andExpect(status().isOk());

		mvc.perform(get("/api/ghg/organizations/" + holder.orgId() + "/factor-pack-notices").with(asOwner()))
			.andExpect(jsonPath("$[0].status").value("WITHDRAWN"))
			.andExpect(jsonPath("$[0].editionStatus").value("WITHDRAWN"))
			.andExpect(jsonPath("$[0].withdrawalReason")
				.value(org.hamcrest.Matchers.containsString("wrong column")));
		// a withdrawn notice is not open, so it can no longer be decided
		accept(noticeId(holder.orgId()), "VINTAGE_PROGRESSION", "A note.", asOwner())
			.andExpect(status().isConflict());
	}
}
