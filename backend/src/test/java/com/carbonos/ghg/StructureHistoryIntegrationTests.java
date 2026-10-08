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

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import com.carbonos.TestcontainersConfiguration;
import com.carbonos.user.AuthenticatedUser;
import com.jayway.jsonpath.JsonPath;

/**
 * Specs 01.7 and 03.1 (amended 2026-09-29): a change to an organization's
 * structure is a row in its history, naming who, when and what changed from
 * what to what. Every act writes exactly one row; an edit that changes nothing
 * writes none; an act under support access is marked.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class StructureHistoryIntegrationTests {

	private static final String OWNER_EMAIL = "yaa@structure.test";

	@Autowired
	MockMvc mvc;

	@Autowired
	com.carbonos.user.internal.UserService userService;

	private final UUID ownerId = UUID.randomUUID();

	RequestPostProcessor asOwner() {
		return user(new AuthenticatedUser(ownerId, OWNER_EMAIL, "irrelevant", "MEMBER", true));
	}

	String body(org.springframework.test.web.servlet.ResultActions actions) throws Exception {
		return actions.andReturn().getResponse().getContentAsString();
	}

	String createOrganization(String name) throws Exception {
		return JsonPath.read(body(mvc.perform(post("/api/ghg/organizations").with(asOwner()).with(csrf())
			.contentType("application/json")
			.content("""
					{"name": "%s", "allowDuplicateName": true}""".formatted(name)))
			.andExpect(status().isCreated())), "$.id");
	}

	/** The organization's history, newest first. */
	List<java.util.Map<String, Object>> history(String orgId) throws Exception {
		return JsonPath.read(body(mvc.perform(get("/api/ghg/organizations/" + orgId + "/events").with(asOwner()))
			.andExpect(status().isOk())), "$");
	}

	List<java.util.Map<String, Object>> rows(String orgId, String action) throws Exception {
		return history(orgId).stream().filter(row -> action.equals(row.get("action"))).toList();
	}

	private static final String CAMP_SERVICES = """
			{"name": "Gye Nyame Camp Services Ltd", "relationshipType": "SUBSIDIARY",
			 "economicInterestPercent": %s, "legalOwnershipPercent": %s, "operatedByCompany": true}""";

	private static final String CAMP = """
			{"name": "Nkran camp", "location": "%s", "entityId": "%s", "facilityType": "CAMP"}""";

	@Test
	void everyStructuralActWritesOneRowWithWhoWhenAndWhatChanged() throws Exception {
		var orgId = createOrganization("Adansi Structure plc");
		// creating the organization creates the reporting company; that is the organization's creation, not a row
		assertThat(history(orgId)).isEmpty();

		// an entity added
		String entityId = JsonPath.read(body(mvc.perform(post("/api/ghg/organizations/" + orgId + "/entities")
			.with(asOwner()).with(csrf()).contentType("application/json").content(CAMP_SERVICES.formatted(100, 100)))
			.andExpect(status().isCreated())), "$.id");
		var added = rows(orgId, "ENTITY_ADDED");
		assertThat(added).hasSize(1);
		assertThat(added.getFirst().get("actor")).isEqualTo(OWNER_EMAIL);
		assertThat(added.getFirst().get("at")).isNotNull();
		assertThat(added.getFirst().get("reason"))
			.isEqualTo("Gye Nyame Camp Services Ltd added: subsidiary, economic interest 100%, legal ownership 100%");

		// the ownership share changed: the question the history now answers
		mvc.perform(put("/api/ghg/entities/" + entityId).with(asOwner()).with(csrf()).contentType("application/json")
			.content(CAMP_SERVICES.formatted(60, 60))).andExpect(status().isOk());
		var updated = rows(orgId, "ENTITY_UPDATED");
		assertThat(updated).hasSize(1);
		assertThat(updated.getFirst().get("actor")).isEqualTo(OWNER_EMAIL);
		assertThat(updated.getFirst().get("reason")).isEqualTo(
				"Gye Nyame Camp Services Ltd: economic interest 100% → 60%, legal ownership 100% → 60%");

		// saving the same facts again is not an act
		mvc.perform(put("/api/ghg/entities/" + entityId).with(asOwner()).with(csrf()).contentType("application/json")
			.content(CAMP_SERVICES.formatted("60.00", 60))).andExpect(status().isOk());
		assertThat(rows(orgId, "ENTITY_UPDATED")).hasSize(1);

		// a facility added, edited, saved unchanged
		String facilityId = JsonPath.read(body(mvc.perform(post("/api/ghg/organizations/" + orgId + "/facilities")
			.with(asOwner()).with(csrf()).contentType("application/json")
			.content(CAMP.formatted("Nkran", entityId))).andExpect(status().isCreated())), "$.id");
		assertThat(rows(orgId, "FACILITY_ADDED")).singleElement()
			.extracting(row -> row.get("reason"))
			.isEqualTo("Nkran camp added under Gye Nyame Camp Services Ltd, location Nkran");
		mvc.perform(put("/api/ghg/facilities/" + facilityId).with(asOwner()).with(csrf())
			.contentType("application/json").content(CAMP.formatted("Nkran, Ashanti", entityId)))
			.andExpect(status().isOk());
		assertThat(rows(orgId, "FACILITY_UPDATED")).singleElement()
			.extracting(row -> row.get("reason"))
			.isEqualTo("Nkran camp: location Nkran → Nkran, Ashanti");
		mvc.perform(put("/api/ghg/facilities/" + facilityId).with(asOwner()).with(csrf())
			.contentType("application/json").content(CAMP.formatted("Nkran, Ashanti", entityId)))
			.andExpect(status().isOk());
		assertThat(rows(orgId, "FACILITY_UPDATED")).hasSize(1);

		// a stream added and removed
		String streamId = JsonPath.read(body(mvc.perform(post("/api/ghg/facilities/" + facilityId + "/streams")
			.with(asOwner()).with(csrf()).contentType("application/json").content("""
					{"name": "Camp generator diesel", "kind": "STATIONARY_COMBUSTION"}"""))
			.andExpect(status().isCreated())), "$.id");
		assertThat(rows(orgId, "STREAM_ADDED")).singleElement()
			.extracting(row -> row.get("reason"))
			.isEqualTo("Camp generator diesel added at Nkran camp: stationary combustion");
		mvc.perform(delete("/api/ghg/streams/" + streamId).with(asOwner()).with(csrf()))
			.andExpect(status().isNoContent());
		assertThat(rows(orgId, "STREAM_REMOVED")).singleElement()
			.extracting(row -> row.get("reason"))
			.isEqualTo("Camp generator diesel removed from Nkran camp");

		// removals carry the reason the owner typed
		mvc.perform(delete("/api/ghg/facilities/" + facilityId).with(asOwner()).with(csrf())
			.param("reason", "camp closed at the end of the contract")).andExpect(status().isNoContent());
		assertThat(rows(orgId, "FACILITY_REMOVED")).singleElement()
			.extracting(row -> row.get("reason"))
			.isEqualTo("Nkran camp removed: camp closed at the end of the contract");
		mvc.perform(delete("/api/ghg/entities/" + entityId).with(asOwner()).with(csrf())
			.param("reason", "company sold to the contractor")).andExpect(status().isNoContent());
		assertThat(rows(orgId, "ENTITY_REMOVED")).singleElement()
			.extracting(row -> row.get("reason"))
			.isEqualTo("Gye Nyame Camp Services Ltd removed: company sold to the contractor");

		// one row per act, eight acts, and the refused ones leave nothing
		assertThat(history(orgId)).hasSize(8);
	}

	/**
	 * Spec 04.3 (amended 2026-10-07): editing a source writes a row with the old
	 * and new values; a change of kind or operator on a source with records needs
	 * a reason of at least 10 characters, which the row carries; the duplicate
	 * check skips the source itself.
	 */
	@Test
	void editingASourceWritesARowAndReclassifyingOneWithRecordsNeedsAReason() throws Exception {
		var orgId = createOrganization("Adansi Sources plc");
		String entityId = JsonPath.read(body(mvc.perform(post("/api/ghg/organizations/" + orgId + "/entities")
			.with(asOwner()).with(csrf()).contentType("application/json").content(CAMP_SERVICES.formatted(100, 100)))
			.andExpect(status().isCreated())), "$.id");
		String facilityId = JsonPath.read(body(mvc.perform(post("/api/ghg/organizations/" + orgId + "/facilities")
			.with(asOwner()).with(csrf()).contentType("application/json")
			.content(CAMP.formatted("Nkran", entityId))).andExpect(status().isCreated())), "$.id");
		String streamId = JsonPath.read(body(mvc.perform(post("/api/ghg/facilities/" + facilityId + "/streams")
			.with(asOwner()).with(csrf()).contentType("application/json").content("""
					{"name": "Camp genset", "kind": "STATIONARY_COMBUSTION", "fuel": "Diesel"}"""))
			.andExpect(status().isCreated())), "$.id");
		mvc.perform(post("/api/ghg/facilities/" + facilityId + "/streams").with(asOwner()).with(csrf())
			.contentType("application/json").content("""
					{"name": "Camp kitchen LPG", "kind": "STATIONARY_COMBUSTION", "fuel": "LPG"}"""))
			.andExpect(status().isCreated());

		// a rename and a meter: no records yet, so no reason is asked; the row names the fields
		mvc.perform(put("/api/ghg/streams/" + streamId).with(asOwner()).with(csrf()).contentType("application/json")
			.content("""
					{"name": "Camp genset 1", "kind": "STATIONARY_COMBUSTION", "fuel": "Diesel",
					 "meterOrSupplier": "Tank dip, genset 1", "contractorOperated": false}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.name").value("Camp genset 1"))
			.andExpect(jsonPath("$.recordCount").value(0));
		assertThat(rows(orgId, "STREAM_EDITED")).singleElement()
			.extracting(row -> row.get("reason"))
			.isEqualTo("Camp genset 1 at Nkran camp: name Camp genset → Camp genset 1, "
					+ "meter or supplier none → Tank dip, genset 1");

		// the same facts again, and the source's own name in another case: not an act, not a duplicate
		mvc.perform(put("/api/ghg/streams/" + streamId).with(asOwner()).with(csrf()).contentType("application/json")
			.content("""
					{"name": "camp genset 1", "kind": "STATIONARY_COMBUSTION", "fuel": "Diesel",
					 "meterOrSupplier": "Tank dip, genset 1", "contractorOperated": false}"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.name").value("camp genset 1"));
		assertThat(rows(orgId, "STREAM_EDITED")).hasSize(2);
		mvc.perform(put("/api/ghg/streams/" + streamId).with(asOwner()).with(csrf()).contentType("application/json")
			.content("""
					{"name": "Camp genset 1", "kind": "STATIONARY_COMBUSTION", "fuel": "Diesel",
					 "meterOrSupplier": "Tank dip, genset 1", "contractorOperated": false}"""))
			.andExpect(status().isOk());
		mvc.perform(put("/api/ghg/streams/" + streamId).with(asOwner()).with(csrf()).contentType("application/json")
			.content("""
					{"name": "Camp genset 1", "kind": "STATIONARY_COMBUSTION", "fuel": "Diesel",
					 "meterOrSupplier": "Tank dip, genset 1", "contractorOperated": false}"""))
			.andExpect(status().isOk());
		assertThat(rows(orgId, "STREAM_EDITED")).hasSize(3);
		// another source's name is still refused
		mvc.perform(put("/api/ghg/streams/" + streamId).with(asOwner()).with(csrf()).contentType("application/json")
			.content("""
					{"name": "camp kitchen lpg", "kind": "STATIONARY_COMBUSTION", "contractorOperated": false}"""))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.rule").value("ghg.stream.name-duplicate"));

		// a change of kind without records needs no reason
		mvc.perform(put("/api/ghg/streams/" + streamId).with(asOwner()).with(csrf()).contentType("application/json")
			.content("""
					{"name": "Camp genset 1", "kind": "MOBILE_COMBUSTION", "fuel": "Diesel",
					 "meterOrSupplier": "Tank dip, genset 1", "contractorOperated": false}"""))
			.andExpect(status().isOk());
		assertThat(rows(orgId, "STREAM_EDITED").getFirst().get("reason"))
			.isEqualTo("Camp genset 1 at Nkran camp: kind stationary combustion → mobile combustion");

		// a record names the source: the kind and the operator now need a reason
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/activities").with(asOwner()).with(csrf())
			.contentType("application/json").content("""
					{"facilityId": "%s", "streamId": "%s", "activityType": "Diesel consumption", "quantity": 900,
					 "unit": "litre", "periodStart": "2025-06-01", "periodEnd": "2025-06-30", "dataQuality": "MEASURED"}"""
				.formatted(facilityId, streamId)))
			.andExpect(status().isCreated());
		mvc.perform(get("/api/ghg/facilities/" + facilityId + "/streams").with(asOwner()))
			.andExpect(jsonPath("$[?(@.name == 'Camp genset 1')].recordCount").value(1));
		var reclassify = """
				{"name": "Camp genset 1", "kind": "STATIONARY_COMBUSTION", "fuel": "Diesel",
				 "meterOrSupplier": "Tank dip, genset 1", "contractorOperated": false%s}""";
		mvc.perform(put("/api/ghg/streams/" + streamId).with(asOwner()).with(csrf()).contentType("application/json")
			.content(reclassify.formatted("")))
			.andExpect(status().isUnprocessableEntity())
			.andExpect(jsonPath("$.rule").value("ghg.stream.reclassify-reason-required"))
			.andExpect(jsonPath("$.errors.reclassifyReason").value("'Camp genset 1' has activity records. Say in at "
					+ "least 10 characters why its kind or operator changes; the records already filed keep their "
					+ "scope and category."));
		mvc.perform(put("/api/ghg/streams/" + streamId).with(asOwner()).with(csrf()).contentType("application/json")
			.content(reclassify.formatted(", \"reclassifyReason\": \"moved\"")))
			.andExpect(status().isUnprocessableEntity())
			.andExpect(jsonPath("$.rule").value("ghg.stream.reclassify-reason-required"));
		var count = rows(orgId, "STREAM_EDITED").size();
		mvc.perform(put("/api/ghg/streams/" + streamId).with(asOwner()).with(csrf()).contentType("application/json")
			.content(reclassify.formatted(", \"reclassifyReason\": \"unit was taken off the trailer and fixed to the camp slab in March\"")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.kind").value("STATIONARY_COMBUSTION"))
			.andExpect(jsonPath("$.recordCount").value(1));
		assertThat(rows(orgId, "STREAM_EDITED")).hasSize(count + 1);
		assertThat(rows(orgId, "STREAM_EDITED").getFirst().get("reason"))
			.isEqualTo("Camp genset 1 at Nkran camp: kind mobile combustion → stationary combustion; "
					+ "reason: unit was taken off the trailer and fixed to the camp slab in March");
		// the record still names the source
		mvc.perform(get("/api/ghg/organizations/" + orgId + "/activities").with(asOwner()))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].streamName").value("Camp genset 1"));

		// a fuel change on a source with records needs no reason
		mvc.perform(put("/api/ghg/streams/" + streamId).with(asOwner()).with(csrf()).contentType("application/json")
			.content("""
					{"name": "Camp genset 1", "kind": "STATIONARY_COMBUSTION", "fuel": "Diesel (B7)",
					 "meterOrSupplier": "Tank dip, genset 1", "contractorOperated": false}"""))
			.andExpect(status().isOk());
		assertThat(rows(orgId, "STREAM_EDITED").getFirst().get("reason"))
			.isEqualTo("Camp genset 1 at Nkran camp: fuel Diesel → Diesel (B7)");
	}

	@Test
	void anEditNamesEveryFieldItChangedAndOnlyThose() throws Exception {
		var orgId = createOrganization("Adansi Fields plc");
		String parentId = JsonPath.read(body(mvc.perform(post("/api/ghg/organizations/" + orgId + "/entities")
			.with(asOwner()).with(csrf()).contentType("application/json").content("""
					{"name": "Adansi Holdings BV", "relationshipType": "SUBSIDIARY",
					 "economicInterestPercent": 100, "operatedByCompany": true}"""))
			.andExpect(status().isCreated())), "$.id");
		String entityId = JsonPath.read(body(mvc.perform(post("/api/ghg/organizations/" + orgId + "/entities")
			.with(asOwner()).with(csrf()).contentType("application/json").content("""
					{"name": "Tarkwa JV", "relationshipType": "JOINT_VENTURE",
					 "economicInterestPercent": 40, "operatedByCompany": true}"""))
			.andExpect(status().isCreated())), "$.id");
		mvc.perform(put("/api/ghg/entities/" + entityId).with(asOwner()).with(csrf()).contentType("application/json")
			.content("""
					{"name": "Tarkwa Gold JV Ltd", "relationshipType": "ASSOCIATE",
					 "economicInterestPercent": 30, "operatedByCompany": false, "parentEntityId": "%s",
					 "effectiveFrom": "2025-07-01", "jurisdiction": "gh", "financialControlOverride": true,
					 "controlNote": "Board control under the shareholders' agreement"}""".formatted(parentId)))
			.andExpect(status().isOk());
		assertThat(rows(orgId, "ENTITY_UPDATED")).singleElement()
			.extracting(row -> row.get("reason"))
			.isEqualTo("Tarkwa Gold JV Ltd: name Tarkwa JV → Tarkwa Gold JV Ltd, relationship joint venture "
					+ "→ associate, economic interest 40% → 30%, operated yes → no, held through "
					+ "directly → Adansi Holdings BV, acquired on none → 2025-07-01, jurisdiction none "
					+ "→ GH, financial control follows Table 1 → consolidated by decision, basis of the "
					+ "decision changed");
	}

	@Test
	void anActUnderSupportAccessIsTheAdministratorsOwnAndMarked() throws Exception {
		var admin = userService.create("structure-" + UUID.randomUUID() + "@ecoriv.com", "Kwesi Support",
				com.carbonos.user.internal.UserRole.ADMIN, "support-passw0rd");
		RequestPostProcessor asAdmin = user(
				new AuthenticatedUser(admin.getId(), admin.getEmail(), "irrelevant", "ADMIN", true));
		var orgId = createOrganization("Adansi Support plc");
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/support-access").with(asAdmin).with(csrf())
			.contentType("application/json").content("""
					{"reason": "ticket 5120: set up the camp company"}"""))
			.andExpect(status().isCreated());
		mvc.perform(post("/api/ghg/organizations/" + orgId + "/entities").with(asAdmin).with(csrf())
			.contentType("application/json").content(CAMP_SERVICES.formatted(100, 100)))
			.andExpect(status().isCreated());
		var added = rows(orgId, "ENTITY_ADDED");
		assertThat(added).hasSize(1);
		assertThat(added.getFirst().get("actor")).isEqualTo(admin.getEmail());
		assertThat(added.getFirst().get("reason")).isEqualTo(
				"Gye Nyame Camp Services Ltd added: subsidiary, economic interest 100%, legal ownership 100% "
						+ "(under support access)");
	}
}
