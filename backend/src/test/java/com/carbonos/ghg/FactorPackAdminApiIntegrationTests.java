package com.carbonos.ghg;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import com.carbonos.TestcontainersConfiguration;
import com.carbonos.ghg.internal.FactorPackEditionRepository;
import com.carbonos.ghg.internal.FactorPackFamilyRepository;
import com.carbonos.ghg.internal.FactorPackStatus;
import com.carbonos.user.AuthenticatedUser;
import com.jayway.jsonpath.JsonPath;

/**
 * The authoring half of the factor pack console (spec 02.5): a platform
 * administrator creates a family and a draft, clones a predecessor, authors the
 * rows, and reads the live validation report. A draft is the platform's
 * business until it is published, so nothing an organization can reach ever
 * shows one, and a published edition is frozen for good.
 *
 * <p>Publication itself, the evidence upload, the separation-of-duties gate,
 * the blast radius and the notices are
 * {@code FactorPackPublicationApiIntegrationTests}.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class FactorPackAdminApiIntegrationTests {

	private static final String FAMILY = "testpack";

	private static final String DRAFT = "testpack-2027";

	@Autowired
	MockMvc mvc;

	@Autowired
	FactorPackFamilyRepository families;

	@Autowired
	FactorPackEditionRepository editions;

	private final UUID adminId = UUID.randomUUID();

	RequestPostProcessor asAdmin() {
		return user(new AuthenticatedUser(adminId, "ama@ecoriv.com", "irrelevant", "ADMIN", true));
	}

	RequestPostProcessor asMember() {
		return user(new AuthenticatedUser(UUID.randomUUID(), "kojo@ecoriv.com", "irrelevant", "MEMBER", true));
	}

	@BeforeEach
	@AfterEach
	void removeTestEditions() {
		// the ten V43 seeded editions stay; every draft a test wrote goes, and its rows with it
		editions.findAllByStatusOrderByEditionIdAsc(FactorPackStatus.DRAFT).forEach(editions::delete);
		editions.flush();
		families.findAllByOrderByPackKeyAsc()
			.stream()
			.filter(family -> family.getPackKey().startsWith(FAMILY))
			.forEach(families::delete);
	}

	// --- helpers ------------------------------------------------------------

	String body(ResultActions actions) throws Exception {
		return actions.andReturn().getResponse().getContentAsString();
	}

	void createFamily() throws Exception {
		mvc.perform(post("/api/admin/factor-packs").with(asAdmin()).with(csrf()).contentType("application/json")
			.content("""
					{"packKey": "%s", "name": "A test publication", "kind": "SOURCE",
					 "summary": "Written by a test."}""".formatted(FAMILY))).andExpect(status().isCreated());
	}

	String createDraft(String editionId, String cloneFrom) throws Exception {
		var clone = cloneFrom == null ? "null" : "\"" + cloneFrom + "\"";
		var result = body(mvc
			.perform(post("/api/admin/factor-packs/" + FAMILY + "/editions").with(asAdmin()).with(csrf())
				.contentType("application/json")
				.content("""
						{"editionId": "%s", "cloneFrom": %s, "name": "A test publication 2027",
						 "source": "A test publication, 2027 tables",
						 "sourceUrl": "https://example.test/tables-2027.xlsx",
						 "publicationYear": 2027, "gwpBasis": "AR5", "license": "Test licence",
						 "retrieved": "2027-01-04", "notes": "For the tests.", "appliesFrom": "2027-01-01"}"""
					.formatted(editionId, clone)))
			.andExpect(status().isCreated()));
		return JsonPath.read(result, "$.editionId");
	}

	/** A row good enough to pass every rule, which each test then breaks in one way. */
	private static String row(String code) {
		return row(code, DIESEL_VALUES);
	}

	private static final String DIESEL_VALUES = "\"kgCo2ePerUnit\": 2.66, \"co2KgPerUnit\": 2.66";

	/** The same row with its values and gases stated differently. */
	private static String row(String code, String values) {
		return """
				{"code": "%s", "name": "A test row", "defaultScope": "SCOPE_1",
				 "defaultCategory": "STATIONARY_COMBUSTION", "scopeAgnostic": true, "unit": "litre",
				 "dataYear": 2027, "sourcePublication": "A test publication, 2027 tables",
				 "sourceUrl": "https://example.test/tables-2027.xlsx", "publicationYear": 2027,
				 "sourceCategory": "Fuels", "sourceActivity": "Liquid fuels / Diesel", %s}"""
			.formatted(code, values);
	}

	ResultActions addRow(String editionId, String json) throws Exception {
		return mvc.perform(post("/api/admin/factor-packs/editions/" + editionId + "/rows").with(asAdmin())
			.with(csrf())
			.contentType("application/json")
			.content(json));
	}

	List<String> brokenRules(String editionId) throws Exception {
		var report = body(mvc.perform(get("/api/admin/factor-packs/editions/" + editionId + "/validation")
			.with(asAdmin())).andExpect(status().isOk()));
		return JsonPath.read(report, "$[*].rule");
	}

	// --- the lifecycle of a draft -------------------------------------------

	@Test
	void aDraftIsCreatedEditedAndDeleted() throws Exception {
		createFamily();
		createDraft(DRAFT, null);

		mvc.perform(get("/api/admin/factor-packs/editions/" + DRAFT).with(asAdmin()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("DRAFT"))
			.andExpect(jsonPath("$.mutable").value(true))
			.andExpect(jsonPath("$.rowCount").value(0))
			.andExpect(jsonPath("$.holderCount").value(0))
			// a draft authored in the console can never carry the seed's exemption
			.andExpect(jsonPath("$.provenanceReview").value("REVIEWED"))
			.andExpect(jsonPath("$.curator").value("ama@ecoriv.com"));

		mvc.perform(put("/api/admin/factor-packs/editions/" + DRAFT).with(asAdmin()).with(csrf())
			.contentType("application/json")
			.content("""
					{"name": "A test publication 2027, revised", "source": "A test publication, 2027 tables",
					 "sourceUrl": "https://example.test/tables-2027.xlsx", "publicationYear": 2027,
					 "gwpBasis": "AR6", "appliesFrom": "2027-04-01"}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.name").value("A test publication 2027, revised"))
			.andExpect(jsonPath("$.gwpBasis").value("AR6"))
			.andExpect(jsonPath("$.appliesFrom").value("2027-04-01"));

		mvc.perform(delete("/api/admin/factor-packs/editions/" + DRAFT).with(asAdmin()).with(csrf()))
			.andExpect(status().isNoContent());
		mvc.perform(get("/api/admin/factor-packs/editions/" + DRAFT).with(asAdmin()))
			.andExpect(status().isNotFound());
	}

	@Test
	void aDraftClonesAPredecessorsRows() throws Exception {
		createFamily();
		createDraft(DRAFT, "ghana");

		mvc.perform(get("/api/admin/factor-packs/editions/" + DRAFT).with(asAdmin()))
			.andExpect(jsonPath("$.rowCount").value(7));
		var rows = body(mvc.perform(get("/api/admin/factor-packs/editions/" + DRAFT + "/rows").with(asAdmin())
			.param("search", "td-losses")).andExpect(status().isOk()));
		assertThat(JsonPath.<List<String>>read(rows, "$.items[*].code")).containsExactly("GHANA:td-losses");
		assertThat(JsonPath.<Integer>read(rows, "$.total")).isEqualTo(1);
		// the clone is a copy, not a reference: correcting it leaves the predecessor alone
		var rowId = JsonPath.<String>read(rows, "$.items[0].id");
		mvc.perform(put("/api/admin/factor-packs/editions/" + DRAFT + "/rows/" + rowId).with(asAdmin()).with(csrf())
			.contentType("application/json")
			.content(row("GHANA:td-losses", DIESEL_VALUES + ", \"notes\": \"Corrected in the draft.\"")))
			.andExpect(status().isOk());
		var ghana = body(mvc.perform(get("/api/ghg/factor-packs/ghana").with(asMember())).andExpect(status().isOk()));
		assertThat(JsonPath.<List<Double>>read(ghana, "$.factors[?(@.code == 'GHANA:td-losses')].kgCo2ePerUnit"))
			.containsExactly(0.117202);
	}

	@Test
	void aDraftIsInvisibleOnTheTenantPackList() throws Exception {
		createFamily();
		createDraft(DRAFT, "ghana");

		var packs = body(mvc.perform(get("/api/ghg/factor-packs").with(asMember())).andExpect(status().isOk()));
		assertThat(JsonPath.<List<String>>read(packs, "$[*].id")).doesNotContain(DRAFT).hasSize(10);
		// nor by its identifier, which is what an import would ask for
		mvc.perform(get("/api/ghg/factor-packs/" + DRAFT).with(asMember())).andExpect(status().isNotFound());
	}

	@Test
	void aNonAdministratorCannotSeeADraft() throws Exception {
		createFamily();
		createDraft(DRAFT, null);

		mvc.perform(get("/api/admin/factor-packs").with(asMember())).andExpect(status().isForbidden());
		mvc.perform(get("/api/admin/factor-packs/editions/" + DRAFT).with(asMember()))
			.andExpect(status().isForbidden());
		mvc.perform(get("/api/admin/factor-packs/editions/" + DRAFT + "/rows").with(asMember()))
			.andExpect(status().isForbidden());
		mvc.perform(post("/api/admin/factor-packs/editions/" + DRAFT + "/rows").with(asMember()).with(csrf())
			.contentType("application/json").content(row("TEST:one"))).andExpect(status().isForbidden());
	}

	@Test
	void aPublishedEditionsRowsCannotBeEdited() throws Exception {
		var rows = body(mvc.perform(get("/api/admin/factor-packs/editions/ghana/rows").with(asAdmin())
			.param("search", "td-losses")).andExpect(status().isOk()));
		var rowId = JsonPath.<String>read(rows, "$.items[0].id");

		mvc.perform(post("/api/admin/factor-packs/editions/ghana/rows").with(asAdmin()).with(csrf())
			.contentType("application/json").content(row("TEST:new-row")))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("never change")));
		mvc.perform(put("/api/admin/factor-packs/editions/ghana/rows/" + rowId).with(asAdmin()).with(csrf())
			.contentType("application/json").content(row("GHANA:td-losses")))
			.andExpect(status().isConflict());
		mvc.perform(delete("/api/admin/factor-packs/editions/ghana/rows/" + rowId).with(asAdmin()).with(csrf()))
			.andExpect(status().isConflict());
		// the metadata and the edition itself are frozen too: clause 8.2 retains the records behind a figure
		mvc.perform(put("/api/admin/factor-packs/editions/ghana").with(asAdmin()).with(csrf())
			.contentType("application/json")
			.content("""
					{"name": "Rewritten", "source": "Somewhere else", "publicationYear": 2027, "gwpBasis": "AR5"}"""))
			.andExpect(status().isConflict());
		mvc.perform(delete("/api/admin/factor-packs/editions/ghana").with(asAdmin()).with(csrf()))
			.andExpect(status().isConflict());
	}

	// --- the validation report ----------------------------------------------

	@Test
	void theValidationReportNamesEveryBrokenRule() throws Exception {
		createFamily();
		createDraft(DRAFT, null);
		// one row that breaks seven rules at once: no namespace in the code, no provenance, a free-text
		// unit, a gas split nowhere near the stated total, a Montreal Protocol gas inside the scopes,
		// a scope 2 category under scope 1, and a value with no source
		addRow(DRAFT, """
				{"code": "nonamespace", "name": "HCFC-22 (R-22)", "defaultScope": "SCOPE_1",
				 "defaultCategory": "PURCHASED_ELECTRICITY", "scopeAgnostic": false, "unit": "widgets",
				 "kgCo2ePerUnit": 100, "co2KgPerUnit": 1}""").andExpect(status().isCreated());
		// and one that folds the biogenic CO2 into the stated total
		addRow(DRAFT, row("TEST:biomass",
				"\"kgCo2ePerUnit\": 100, \"co2KgPerUnit\": 10, \"biogenicCo2KgPerUnit\": 90"))
			.andExpect(status().isCreated());

		assertThat(brokenRules(DRAFT)).contains("code", "provenance", "unit", "gasSplit", "nonKyoto",
				"scopeCategory", "sourceForValue", "biogenic");
	}

	@Test
	void aCodeOutsideTheNamespacePatternIsRefused() throws Exception {
		createFamily();
		createDraft(DRAFT, null);
		addRow(DRAFT, row("tdlosses")).andExpect(status().isCreated());
		assertThat(brokenRules(DRAFT)).containsExactly("code");

		// two segments are allowed: GHANA:td-losses is a derivation, not a row in a published table
		addRow(DRAFT, row("GHANA:td-losses")).andExpect(status().isCreated());
		var report = body(mvc.perform(get("/api/admin/factor-packs/editions/" + DRAFT + "/validation")
			.with(asAdmin())).andExpect(status().isOk()));
		assertThat(JsonPath.<List<String>>read(report, "$[*].code")).containsExactly("tdlosses");
	}

	@Test
	void aZeroValueIsAllowedOnlyOnAnUnapprovedTemplateNamingTheDocument() throws Exception {
		createFamily();
		createDraft(DRAFT, null);
		// a template: unapproved, no value, and its note names the document to obtain
		addRow(DRAFT, """
				{"code": "TEMPLATE:supplier:lime", "name": "Quicklime purchased (supplier factor)",
				 "defaultScope": "SCOPE_3", "defaultCategory": "PURCHASED_GOODS_SERVICES", "unit": "tonne",
				 "kgCo2ePerUnit": 0, "co2eOnly": true, "approved": false,
				 "sourcePublication": "Supplier factor, to be obtained",
				 "notes": "Obtain the supplier's product carbon footprint or environmental product declaration."}""")
			.andExpect(status().isCreated());
		assertThat(brokenRules(DRAFT)).isEmpty();

		// an approved zero reads as a measured absence of emissions
		addRow(DRAFT, """
				{"code": "TEMPLATE:supplier:cement", "name": "Cement purchased (supplier factor)",
				 "defaultScope": "SCOPE_3", "defaultCategory": "PURCHASED_GOODS_SERVICES", "unit": "tonne",
				 "kgCo2ePerUnit": 0, "co2eOnly": true, "approved": true,
				 "sourcePublication": "Supplier factor, to be obtained",
				 "notes": "Obtain the supplier's product carbon footprint."}""").andExpect(status().isCreated());
		// and a zero whose note names nothing to obtain is a false zero
		addRow(DRAFT, """
				{"code": "TEMPLATE:supplier:cyanide", "name": "Sodium cyanide purchased",
				 "defaultScope": "SCOPE_3", "defaultCategory": "PURCHASED_GOODS_SERVICES", "unit": "tonne",
				 "kgCo2ePerUnit": 0, "co2eOnly": true, "approved": false, "notes": "To do."}""")
			.andExpect(status().isCreated());

		var report = body(mvc.perform(get("/api/admin/factor-packs/editions/" + DRAFT + "/validation")
			.with(asAdmin())).andExpect(status().isOk()));
		assertThat(JsonPath.<List<String>>read(report, "$[?(@.rule == 'sourceForValue')].code"))
			.containsExactlyInAnyOrder("TEMPLATE:supplier:cement", "TEMPLATE:supplier:cyanide");
		// the one that is a template is clean; the approved zero stops being a template, so its missing
		// publication URL and years are held against it too
		assertThat(JsonPath.<List<String>>read(report, "$[*].code")).doesNotContain("TEMPLATE:supplier:lime");
		assertThat(JsonPath.<List<String>>read(report, "$[?(@.rule == 'provenance')].code"))
			.containsExactly("TEMPLATE:supplier:cement");
	}

	@Test
	void theGasSplitMustReconcileToTheStatedCo2eWithinOnePercent() throws Exception {
		createFamily();
		createDraft(DRAFT, null);
		// 2.66 CO2 against a stated 2.68 is 0.75% apart: inside the tolerance
		addRow(DRAFT, row("TEST:close", "\"kgCo2ePerUnit\": 2.68, \"co2KgPerUnit\": 2.66"))
			.andExpect(status().isCreated());
		assertThat(brokenRules(DRAFT)).isEmpty();

		// 2.66 CO2 against a stated 3.00 is 11.3% apart
		addRow(DRAFT, row("TEST:far", "\"kgCo2ePerUnit\": 3.00, \"co2KgPerUnit\": 2.66"))
			.andExpect(status().isCreated());
		// a split that reconciles only once the potentials are applied: 1 kg CH4 is 28 kg CO2e under AR5
		addRow(DRAFT, row("TEST:methane",
				"\"kgCo2ePerUnit\": 30.66, \"co2KgPerUnit\": 2.66, \"ch4KgPerUnit\": 1, \"ch4Fossil\": true"))
			.andExpect(status().isCreated());

		var report = body(mvc.perform(get("/api/admin/factor-packs/editions/" + DRAFT + "/validation")
			.with(asAdmin())).andExpect(status().isOk()));
		assertThat(JsonPath.<List<String>>read(report, "$[*].code")).containsExactly("TEST:far");
		assertThat(JsonPath.<List<String>>read(report, "$[*].rule")).containsExactly("gasSplit");
	}

	@Test
	void aCodeNamesOneRowOfAnEdition() throws Exception {
		createFamily();
		createDraft(DRAFT, null);
		addRow(DRAFT, row("TEST:one")).andExpect(status().isCreated());
		addRow(DRAFT, row("TEST:one")).andExpect(status().isUnprocessableEntity())
			.andExpect(jsonPath("$.errors.code").exists());
	}
}
