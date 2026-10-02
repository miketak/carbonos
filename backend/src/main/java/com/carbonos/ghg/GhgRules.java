package com.carbonos.ghg;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import com.carbonos.shared.web.Rule;
import com.carbonos.shared.web.RuleSource;

/**
 * The refusals the {@code ghg} module makes, named for the QA scenarios. The
 * list grows as the procedures are transliterated; a throw site not yet named
 * keeps its message-only constructor.
 */
@Component
public class GhgRules implements RuleSource {

	// roles (spec 01.2)
	public static final Rule ROLE_REQUIRED = Rule.of("ghg.role.required", HttpStatus.FORBIDDEN,
			"This action needs the {needed} role in the organization.");

	// organizations and members (specs 01.2, 01.7, 01.8)
	public static final Rule ORGANIZATION_NAME_DUPLICATE = Rule.of("ghg.organization.name-duplicate",
			HttpStatus.CONFLICT,
			"An organization named '{name}' already exists: {duplicates}. Confirm to use the name anyway.");

	public static final Rule ACCOUNT_NOT_FOUND = Rule.of("ghg.account.not-found", HttpStatus.NOT_FOUND,
			"No account with that email.");

	public static final Rule MEMBER_DUPLICATE = Rule.of("ghg.member.duplicate", HttpStatus.CONFLICT,
			"{email} is already a member of '{organization}'.");

	public static final Rule LAST_OWNER = Rule.of("ghg.member.last-owner", HttpStatus.CONFLICT,
			"'{organization}' needs at least one owner.");

	// legal entities (specs 03.1, 03.3, 03.4)
	public static final Rule ENTITY_DISPOSAL_BEFORE_ACQUISITION = Rule.field("ghg.entity.disposal-before-acquisition",
			"effectiveTo", "The disposal date is before the acquisition date.");

	public static final Rule ENTITY_PERCENT_RANGE = Rule.field("ghg.entity.percent-range", "economicInterestPercent",
			"{field} must be between 0 and 100.");

	public static final Rule ENTITY_NAME_DUPLICATE = Rule.of("ghg.entity.name-duplicate", HttpStatus.CONFLICT,
			"An entity named '{name}' already exists.");

	public static final Rule ENTITY_PARENT_LOOP = Rule.of("ghg.entity.parent-loop", HttpStatus.CONFLICT,
			"'{parent}' is held through '{entity}': a parent chain cannot loop.");

	public static final Rule ENTITY_HAS_FACILITIES = Rule.of("ghg.entity.has-facilities", HttpStatus.CONFLICT,
			"'{entity}' still has facilities. Move them to another entity before deleting it.");

	// facilities and streams (specs 03.4, 04.3)
	public static final Rule LEASE_ENDS_BEFORE_START = Rule.field("ghg.facility.lease-ends-before-start", "leaseTo",
			"The lease ends before it starts.");

	public static final Rule STREAM_NAME_DUPLICATE = Rule.of("ghg.stream.name-duplicate", HttpStatus.CONFLICT,
			"'{facility}' already has a stream named '{name}'.");

	// units and densities (spec 02.2)
	public static final Rule UNIT_REGISTERED = Rule.field("ghg.unit.registered", "code",
			"'{code}' is already a registered unit.");

	public static final Rule UNIT_DUPLICATE = Rule.field("ghg.unit.duplicate", "code",
			"A custom unit named '{code}' already exists.");

	public static final Rule DENSITY_DUPLICATE = Rule.field("ghg.density.duplicate", "material",
			"A density for '{material}' already exists.");

	// emission factors (specs 02.1, 02.4, 02.11)
	public static final Rule BLEND_FRACTIONS = Rule.field("ghg.factor.blend-fractions", "blendComposition",
			"The mass fractions of a blend must add up to 1 (for example HFC-32:0.5,HFC-125:0.5).");

	public static final Rule FACTOR_SELF_APPROVAL = Rule.of("ghg.factor.self-approval", HttpStatus.CONFLICT,
			"You entered '{name}'. A factor is checked by someone other than the person who typed it "
					+ "(Corporate Standard chapter 7): ask {checker} to approve it.");

	// activity data, corrections, removals and evidence (specs 04.4, 04.5, 04.6)
	public static final Rule REASON_TOO_SHORT = Rule.field("ghg.reason-too-short", "reason",
			"{what} needs a reason of at least 5 characters.");

	public static final Rule ACTIVITY_REMOVED_CANNOT_CORRECT = Rule.of("ghg.activity.removed-cannot-correct",
			HttpStatus.CONFLICT, "This record was removed and cannot be corrected.");

	public static final Rule ACTIVITY_NO_WAY_BACK_TO_DRAFT = Rule.of("ghg.activity.no-way-back-to-draft",
			HttpStatus.CONFLICT,
			"A saved record is corrected with a reason or removed with a reason; it cannot go back to a draft.");

	public static final Rule ACTIVITY_ALREADY_REMOVED = Rule.of("ghg.activity.already-removed", HttpStatus.CONFLICT,
			"This record was already removed.");

	public static final Rule FACILITY_HAS_RECORDS = Rule.of("ghg.facility.has-records", HttpStatus.CONFLICT,
			"'{facility}' has recorded activity data. Facts are the audit trail: "
					+ "remove or reassign its activity records before deleting the facility.");

	public static final Rule EVIDENCE_UNSUPPORTED_TYPE = Rule.field("ghg.evidence.unsupported-type", "file",
			"Attach a PDF, an image (PNG, JPEG, WebP), a spreadsheet (XLSX, XLS, CSV) or a text file.");

	public static final Rule EVIDENCE_LINK_SCHEME = Rule.field("ghg.evidence.link-scheme", "url",
			"A link starts with https:// or http://.");

	// inventories, the boundary and the declaration (specs 03.2, 05.5, 07.2, 07.6)
	public static final Rule BOUNDARY_WINDOW_ENDS_BEFORE_START = Rule.of("ghg.boundary.window-ends-before-start",
			HttpStatus.CONFLICT, "The membership window ends before it starts.");

	public static final Rule BOUNDARY_EMPTY = Rule.of("ghg.boundary.empty", HttpStatus.CONFLICT,
			"The organizational boundary is empty. Add at least one facility before freezing it.");

	public static final Rule INVENTORY_ALREADY_FROZEN = Rule.of("ghg.inventory.already-frozen", HttpStatus.CONFLICT,
			"The inventory is already frozen.");

	public static final Rule INVENTORY_FREEZE_BLOCKED = Rule.of("ghg.inventory.freeze-blocked", HttpStatus.CONFLICT,
			"{records} the freeze: {listed}. Classify or exclude them first.");

	public static final Rule DECLARATION_NOT_SCOPE_3 = Rule.of("ghg.declaration.not-scope-3", HttpStatus.CONFLICT,
			"{category} is not a scope 3 category.");

	public static final Rule DECLARATION_NOT_DECLARED = Rule.of("ghg.declaration.not-declared", HttpStatus.CONFLICT,
			"'{category}' is not declared as covered; only a declared category can be marked as not quantified.");

	public static final Rule DECLARATION_REASON_TOO_SHORT = Rule.field("ghg.declaration.reason-too-short",
			"notQuantified", "Say why '{category}' is not quantified (at least 10 characters).");

	// classification, exclusions, the method and the reopen (specs 04.1, 04.4, 04.7, 05.5, 07.2)
	public static final Rule PROXY_JUSTIFICATION = Rule.of("ghg.classification.proxy-justification",
			HttpStatus.CONFLICT, "A proxy factor needs a justification: say what the factor stands in for.");

	public static final Rule EXCLUSION_JUSTIFICATION_TOO_SHORT = Rule.field("ghg.exclusion.justification-too-short",
			"justification", "A record exclusion needs a justification of at least 10 characters.");

	public static final Rule UPSTREAM_UNIT_MISMATCH = Rule.field("ghg.upstream-rule.unit-mismatch", "upstreamFactorId",
			"'{upstream}' is per {upstreamUnit}, which does not convert from '{primary}' per {primaryUnit}. "
					+ "Choose an upstream factor in a unit the primary factor converts to.");

	public static final Rule RESIDUAL_MIX_FACTOR_REQUIRED = Rule.of("ghg.residual-mix.factor-required",
			HttpStatus.CONFLICT, "A residual mix that is available needs its factor in kg CO2e per kWh.");

	public static final Rule INVENTORY_REOPEN_REASON = Rule.field("ghg.inventory.reopen-reason", "reason",
			"Reopening needs a reason of at least 10 characters: what the draft will change. "
					+ "The next freeze cuts a new boundary version.");

	public static final Rule INVENTORY_ALREADY_DRAFT = Rule.of("ghg.inventory.already-draft", HttpStatus.CONFLICT,
			"The inventory is already a draft.");

	// runs, the final designation, publication and the correction (specs 05.1, 05.2, 05.3, 05.7)
	public static final Rule RUN_FINAL_HOLDS = Rule.of("ghg.run.final-holds", HttpStatus.CONFLICT,
			"Run {run} cannot be designated final. {holds}");

	public static final Rule RUN_VOIDED_NOT_FINAL = Rule.of("ghg.run.voided-not-final", HttpStatus.CONFLICT,
			"Run {run} is voided and cannot be designated final.");

	public static final Rule RUN_FINAL_NOT_VOIDABLE = Rule.of("ghg.run.final-not-voidable", HttpStatus.CONFLICT,
			"Run {run} is designated final. Withdraw the designation, with a reason, before voiding it.");

	public static final Rule RUN_ALREADY_VOIDED = Rule.of("ghg.run.already-voided", HttpStatus.CONFLICT,
			"Run {run} is already voided.");

	public static final Rule RUNS_ARE_A_RECORD = Rule.of("ghg.run.published-not-voidable", HttpStatus.CONFLICT,
			"A published inventory's runs are a record and cannot be voided.");

	public static final Rule NO_FINAL_RUN = Rule.of("ghg.inventory.no-final-run", HttpStatus.CONFLICT,
			"No run is designated final.");

	public static final Rule PUBLISH_NEEDS_FINAL = Rule.of("ghg.inventory.publish-needs-final", HttpStatus.CONFLICT,
			"Designate a final run before publishing the inventory.");

	public static final Rule CORRECTION_NEEDS_PUBLISHED = Rule.of("ghg.correction.needs-published", HttpStatus.CONFLICT,
			"Only a published inventory can be superseded.");

	public static final Rule CORRECTION_ALREADY_SUPERSEDED = Rule.of("ghg.correction.already-superseded",
			HttpStatus.CONFLICT, "This inventory has already been superseded.");

	public static final Rule CORRECTION_REASON_TOO_SHORT = Rule.field("ghg.correction.reason-too-short", "reason",
			"A correction needs a reason of at least 10 characters: what was wrong in the published inventory.");

	private static final List<Rule> ALL = List.of(ROLE_REQUIRED, ORGANIZATION_NAME_DUPLICATE, ACCOUNT_NOT_FOUND,
			MEMBER_DUPLICATE, LAST_OWNER, ENTITY_DISPOSAL_BEFORE_ACQUISITION, ENTITY_PERCENT_RANGE,
			ENTITY_NAME_DUPLICATE, ENTITY_PARENT_LOOP, ENTITY_HAS_FACILITIES, LEASE_ENDS_BEFORE_START,
			STREAM_NAME_DUPLICATE, UNIT_REGISTERED, UNIT_DUPLICATE, DENSITY_DUPLICATE, BLEND_FRACTIONS,
			FACTOR_SELF_APPROVAL, REASON_TOO_SHORT, ACTIVITY_REMOVED_CANNOT_CORRECT, ACTIVITY_NO_WAY_BACK_TO_DRAFT,
			ACTIVITY_ALREADY_REMOVED, FACILITY_HAS_RECORDS, EVIDENCE_UNSUPPORTED_TYPE, EVIDENCE_LINK_SCHEME,
			BOUNDARY_WINDOW_ENDS_BEFORE_START, BOUNDARY_EMPTY, INVENTORY_ALREADY_FROZEN, INVENTORY_FREEZE_BLOCKED,
			DECLARATION_NOT_SCOPE_3, DECLARATION_NOT_DECLARED, DECLARATION_REASON_TOO_SHORT, PROXY_JUSTIFICATION,
			EXCLUSION_JUSTIFICATION_TOO_SHORT, UPSTREAM_UNIT_MISMATCH, RESIDUAL_MIX_FACTOR_REQUIRED,
			INVENTORY_REOPEN_REASON, INVENTORY_ALREADY_DRAFT, RUN_FINAL_HOLDS, RUN_VOIDED_NOT_FINAL,
			RUN_FINAL_NOT_VOIDABLE, RUN_ALREADY_VOIDED, RUNS_ARE_A_RECORD, NO_FINAL_RUN, PUBLISH_NEEDS_FINAL,
			CORRECTION_NEEDS_PUBLISHED, CORRECTION_ALREADY_SUPERSEDED, CORRECTION_REASON_TOO_SHORT);

	@Override
	public String module() {
		return "ghg";
	}

	@Override
	public List<Rule> rules() {
		return ALL;
	}
}
