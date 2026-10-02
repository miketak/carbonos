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
			"Account {email} was not found.");

	public static final Rule MEMBER_DUPLICATE = Rule.of("ghg.member.duplicate", HttpStatus.CONFLICT,
			"{email} is already a member of '{organization}'.");

	public static final Rule LAST_OWNER = Rule.of("ghg.member.last-owner", HttpStatus.CONFLICT,
			"'{organization}' needs at least one owner.");

	// legal entities (specs 03.1, 03.3, 03.4)
	public static final Rule ENTITY_DISPOSAL_BEFORE_ACQUISITION = Rule.field("ghg.entity.disposal-before-acquisition",
			"effectiveTo", "The disposal date is before the acquisition date.");

	public static final Rule ENTITY_PERCENT_RANGE = Rule.field("ghg.entity.percent-range", "economicInterestPercent",
			"A percentage is between 0 and 100.");

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

	private static final List<Rule> ALL = List.of(ROLE_REQUIRED, ORGANIZATION_NAME_DUPLICATE, ACCOUNT_NOT_FOUND,
			MEMBER_DUPLICATE, LAST_OWNER, ENTITY_DISPOSAL_BEFORE_ACQUISITION, ENTITY_PERCENT_RANGE,
			ENTITY_NAME_DUPLICATE, ENTITY_PARENT_LOOP, ENTITY_HAS_FACILITIES, LEASE_ENDS_BEFORE_START,
			STREAM_NAME_DUPLICATE, UNIT_REGISTERED, UNIT_DUPLICATE, DENSITY_DUPLICATE, BLEND_FRACTIONS,
			FACTOR_SELF_APPROVAL, REASON_TOO_SHORT, ACTIVITY_REMOVED_CANNOT_CORRECT, ACTIVITY_NO_WAY_BACK_TO_DRAFT,
			ACTIVITY_ALREADY_REMOVED, FACILITY_HAS_RECORDS, EVIDENCE_UNSUPPORTED_TYPE, EVIDENCE_LINK_SCHEME);

	@Override
	public String module() {
		return "ghg";
	}

	@Override
	public List<Rule> rules() {
		return ALL;
	}
}
