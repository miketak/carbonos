package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.carbonos.user.UserDirectory;

/**
 * The organizational-facts side of spec 02 and spec 03.1: organizations,
 * their legal entities and facilities, the emission-factor library, and
 * activity records. Accounting views live in {@link InventoryService}. Every
 * entry is tenant-checked via {@link GhgAccess} (spec 01).
 */
@Service
@Transactional
public class GhgService {

	private final OrganizationRepository organizations;
	private final LegalEntityRepository entities;
	private final FacilityRepository facilities;
	private final EmissionFactorRepository emissionFactors;
	private final ActivityRecordRepository activities;
	private final SourceStreamRepository streams;
	private final GhgRunLineRepository runLines;
	private final FactorPacks factorPacks;
	private final UnitConverter units;
	private final OrganizationMemberRepository members;
	private final UserDirectory userDirectory;
	private final GhgAccess access;
	private final ActivityRevisionRepository revisions;
	private final BoundaryTreatmentRepository boundaryTreatments;
	private final EvidenceRepository evidence;
	private final CustomUnitRepository customUnits;
	private final DensityRepository densities;
	private final InventoryAssignmentRepository assignments;

	GhgService(OrganizationRepository organizations, LegalEntityRepository entities, FacilityRepository facilities,
			EmissionFactorRepository emissionFactors, ActivityRecordRepository activities,
			SourceStreamRepository streams, GhgRunLineRepository runLines, FactorPacks factorPacks, UnitConverter units,
			OrganizationMemberRepository members, UserDirectory userDirectory, GhgAccess access,
			ActivityRevisionRepository revisions, BoundaryTreatmentRepository boundaryTreatments,
			EvidenceRepository evidence, CustomUnitRepository customUnits, DensityRepository densities,
			InventoryAssignmentRepository assignments) {
		this.customUnits = customUnits;
		this.densities = densities;
		this.assignments = assignments;
		this.evidence = evidence;
		this.revisions = revisions;
		this.boundaryTreatments = boundaryTreatments;
		this.organizations = organizations;
		this.entities = entities;
		this.facilities = facilities;
		this.emissionFactors = emissionFactors;
		this.activities = activities;
		this.streams = streams;
		this.runLines = runLines;
		this.factorPacks = factorPacks;
		this.units = units;
		this.members = members;
		this.userDirectory = userDirectory;
		this.access = access;
	}

	// --- organizations -----------------------------------------------------

	@Transactional(readOnly = true)
	public List<Organization> listOrganizations() {
		if (access.isCurrentUserAdmin()) {
			return organizations.findAllByOrderByCreatedAtAsc();
		}
		// spec 01.2: the organizations the caller is a member of
		return members.findOrganizationsOfUser(access.currentUserId());
	}

	@Transactional(readOnly = true)
	public Organization getOrganization(UUID id) {
		var organization = organizations.findById(id).orElseThrow(() -> GhgNotFoundException.organization(id));
		access.check(organization);
		return organization;
	}

	/** Creates the organization and its own legal entity, the wholly owned reporting company (spec 03.1). */
	public Organization createOrganization(String name) {
		return createOrganization(name, null, null);
	}

	public Organization createOrganization(String name, String address, String contact) {
		var trimmed = name.trim();
		if (organizations.existsByNameIgnoreCase(trimmed)) {
			throw new DuplicateOrganizationException(trimmed);
		}
		Organization organization;
		try {
			organization = organizations.saveAndFlush(new Organization(trimmed, access.currentUserId()));
		}
		catch (DataIntegrityViolationException ex) {
			// unique-constraint race between the existence check and the insert
			throw new DuplicateOrganizationException(trimmed);
		}
		organization.setHeader(trimToNull(address), trimToNull(contact));
		// spec 01.2: the creator is the first owner
		var creator = userDirectory.findById(access.currentUserId());
		members.save(new OrganizationMember(organization, access.currentUserId(),
				creator.map(UserDirectory.UserSummary::email).orElse(access.currentUserEmail()),
				creator.map(UserDirectory.UserSummary::displayName).orElse(access.currentUserEmail()), OrgRole.OWNER));
		entities.save(new LegalEntity(organization, trimmed, RelationshipType.SUBSIDIARY, new BigDecimal("100.00"),
				new BigDecimal("100.00"), true, true, null, true));
		return organization;
	}

	/** The caller's role in an organization, for the response (spec 01.2). */
	@Transactional(readOnly = true)
	public String roleIn(Organization organization) {
		if (access.isCurrentUserAdmin()
				&& members.findByOrganizationIdAndUserId(organization.getId(), access.currentUserId()).isEmpty()) {
			return "ADMIN";
		}
		return access.roleIn(organization).map(Enum::name).orElse(null);
	}

	public Organization updateOrganization(UUID id, String name, String address, String contact) {
		var organization = getOrganization(id);
		access.checkOwner(organization);
		var trimmed = name.trim();
		if (!trimmed.equalsIgnoreCase(organization.getName()) && organizations.existsByNameIgnoreCase(trimmed)) {
			throw new DuplicateOrganizationException(trimmed);
		}
		// the reporting company's entity follows the organization's name unless it was renamed by hand
		entities.findByOrganizationIdAndReportingCompanyTrue(id)
			.filter(own -> own.getName().equals(organization.getName()))
			.ifPresent(own -> own.setName(trimmed));
		organization.setName(trimmed);
		organization.setHeader(trimToNull(address), trimToNull(contact));
		return organization;
	}

	public void deleteOrganization(UUID id) {
		var organization = getOrganization(id);
		access.checkOwner(organization);
		organizations.delete(organization);
	}
	// --- members (spec 01.2) -------------------------------------------------------

	@Transactional(readOnly = true)
	public List<OrganizationMember> listMembers(UUID organizationId) {
		getOrganization(organizationId);
		return members.findAllByOrganizationIdOrderByCreatedAtAsc(organizationId);
	}

	/** Adds a platform account as a member; owners (and platform administrators) only. */
	public OrganizationMember addMember(UUID organizationId, String email, OrgRole role) {
		var organization = getOrganization(organizationId);
		access.checkOwner(organization);
		var account = userDirectory.findByEmail(email).orElseThrow(() -> GhgNotFoundException.account(email));
		if (members.findByOrganizationIdAndUserId(organizationId, account.id()).isPresent()) {
			throw new GhgRuleViolationException(account.email() + " is already a member of '" + organization.getName() + "'.");
		}
		return members.save(new OrganizationMember(organization, account.id(), account.email(), account.displayName(), role));
	}

	public OrganizationMember changeMemberRole(UUID organizationId, UUID memberId, OrgRole role) {
		var organization = getOrganization(organizationId);
		access.checkOwner(organization);
		var member = requireMember(organizationId, memberId);
		if (member.getRole() == OrgRole.OWNER && role != OrgRole.OWNER && isLastOwner(organizationId)) {
			throw new GhgRuleViolationException("'" + organization.getName() + "' needs at least one owner.");
		}
		member.setRole(role);
		return member;
	}

	public void removeMember(UUID organizationId, UUID memberId) {
		var organization = getOrganization(organizationId);
		access.checkOwner(organization);
		var member = requireMember(organizationId, memberId);
		if (member.getRole() == OrgRole.OWNER && isLastOwner(organizationId)) {
			throw new GhgRuleViolationException("'" + organization.getName() + "' needs at least one owner.");
		}
		members.delete(member);
	}

	private boolean isLastOwner(UUID organizationId) {
		return members.countByOrganizationIdAndRole(organizationId, OrgRole.OWNER) <= 1;
	}

	private OrganizationMember requireMember(UUID organizationId, UUID memberId) {
		var member = members.findById(memberId).orElseThrow(() -> GhgNotFoundException.member(memberId));
		if (!member.getOrganization().getId().equals(organizationId)) {
			throw GhgNotFoundException.member(memberId);
		}
		return member;
	}


	@Transactional(readOnly = true)
	public long facilityCount(UUID organizationId) {
		return facilities.countByOrganizationIdAndDeletedAtIsNull(organizationId);
	}

	// --- legal entities (spec 03.1) ------------------------------------------

	@Transactional(readOnly = true)
	public List<LegalEntity> listEntities(UUID organizationId) {
		getOrganization(organizationId);
		return entities.findAllByOrganizationIdAndDeletedAtIsNullOrderByReportingCompanyDescCreatedAtAsc(organizationId);
	}

	@Transactional(readOnly = true)
	public LegalEntity getEntity(UUID id) {
		var entity = entities.findById(id)
			.filter(found -> !found.isDeleted())
			.orElseThrow(() -> GhgNotFoundException.entity(id));
		access.check(entity.getOrganization());
		return entity;
	}

	/** The facts of an entity as a request states them (spec 03.1, 03.3). */
	public record EntityFacts(String name, RelationshipType relationshipType, BigDecimal economicInterestPercent,
			BigDecimal legalOwnershipPercent, boolean operatedByCompany, Boolean controlledByCompany,
			UUID parentEntityId) {
	}

	public LegalEntity createEntity(UUID organizationId, EntityFacts facts) {
		var organization = getOrganization(organizationId);
		access.checkWrite(organization);
		var trimmed = facts.name().trim();
		if (entities.existsByOrganizationIdAndNameIgnoreCaseAndDeletedAtIsNull(organizationId, trimmed)) {
			throw new GhgRuleViolationException("An entity named '" + trimmed + "' already exists.");
		}
		var parent = requireParent(facts.parentEntityId(), organizationId, null);
		return entities.save(new LegalEntity(organization, trimmed, facts.relationshipType(),
				facts.economicInterestPercent(), facts.legalOwnershipPercent(), facts.operatedByCompany(),
				controlFlag(facts), parent, false));
	}

	/** Financial control is a fact only for franchises (spec 03.3); every other row implies it or rules it out. */
	private static boolean controlFlag(EntityFacts facts) {
		if (facts.relationshipType() != RelationshipType.FRANCHISE) {
			if (facts.controlledByCompany() != null) {
				throw new GhgRuleViolationException(
						"controlledByCompany is recorded for franchises only; Table 1 settles control for "
								+ facts.relationshipType().name().toLowerCase().replace('_', ' ') + ".");
			}
			return facts.relationshipType() == RelationshipType.SUBSIDIARY;
		}
		return Boolean.TRUE.equals(facts.controlledByCompany());
	}

	/** The parent the company holds this entity through: same organization, no cycle, never the reporting company's parent. */
	private LegalEntity requireParent(UUID parentEntityId, UUID organizationId, LegalEntity self) {
		if (parentEntityId == null) {
			return null;
		}
		var parent = entities.findById(parentEntityId)
			.orElseThrow(() -> GhgNotFoundException.entity(parentEntityId));
		if (!parent.getOrganization().getId().equals(organizationId)) {
			throw GhgNotFoundException.entity(parentEntityId);
		}
		if (self != null && parent.isOrDescendsFrom(self)) {
			throw new GhgRuleViolationException("'" + parent.getName() + "' is held through '" + self.getName()
					+ "': a parent chain cannot loop.");
		}
		return parent;
	}

	/**
	 * Edits the entity's facts only. Existing boundary treatments are decisions
	 * and stay as they are (spec 03); the BOUNDARY gate reports the drift.
	 */
	public LegalEntity updateEntity(UUID id, EntityFacts facts) {
		var entity = getEntity(id);
		access.checkWrite(entity.getOrganization());
		var trimmed = facts.name().trim();
		if (entity.isReportingCompany() && (facts.relationshipType() != RelationshipType.SUBSIDIARY
				|| facts.economicInterestPercent().compareTo(new BigDecimal("100")) != 0
				|| !facts.operatedByCompany() || facts.parentEntityId() != null)) {
			throw new GhgRuleViolationException("The reporting company is the group's own wholly owned operation "
					+ "by definition. Record other structures as separate entities.");
		}
		if (!trimmed.equalsIgnoreCase(entity.getName())
				&& entities.existsByOrganizationIdAndNameIgnoreCaseAndDeletedAtIsNull(entity.getOrganization().getId(), trimmed)) {
			throw new GhgRuleViolationException("An entity named '" + trimmed + "' already exists.");
		}
		var parent = requireParent(facts.parentEntityId(), entity.getOrganization().getId(), entity);
		entity.update(trimmed, facts.relationshipType(), facts.economicInterestPercent(),
				facts.legalOwnershipPercent(), facts.operatedByCompany(), controlFlag(facts), parent);
		return entity;
	}

	/** Removes an entity with a reason; it stays as a tombstone (spec 04.4). */
	public void deleteEntity(UUID id, String reason) {
		var entity = getEntity(id);
		access.checkWrite(entity.getOrganization());
		if (entity.isReportingCompany()) {
			throw new GhgRuleViolationException("The reporting company cannot be deleted.");
		}
		if (facilities.existsByEntityIdAndDeletedAtIsNull(id)) {
			throw new GhgRuleViolationException("'" + entity.getName()
					+ "' still has facilities. Move them to another entity before deleting it.");
		}
		if (entities.existsByParentIdAndDeletedAtIsNull(id)) {
			throw new GhgRuleViolationException("'" + entity.getName()
					+ "' is the parent of other entities. Re-parent them before deleting it.");
		}
		requireReason(reason, "Removing a legal entity");
		entity.markRemoved(access.currentUserEmail(), reason.trim());
	}

	// --- facilities ---------------------------------------------------------

	@Transactional(readOnly = true)
	public List<Facility> listFacilities(UUID organizationId) {
		getOrganization(organizationId);
		return facilities.findAllByOrganizationIdAndDeletedAtIsNullOrderByCreatedAtAsc(organizationId);
	}

	/** Adds a facility under an entity; without one it belongs to the reporting company (spec 03.1). */
	public Facility createFacility(UUID organizationId, UUID entityId, String name, String location,
			String country) {
		var organization = getOrganization(organizationId);
		access.checkWrite(organization);
		var entity = requireEntityInOrganization(entityId, organizationId);
		return facilities.save(new Facility(organization, entity, name.trim(), location.trim(), country(country)));
	}

	public Facility updateFacility(UUID id, UUID entityId, String name, String location, String country) {
		var facility = getFacility(id);
		access.checkWrite(facility.getOrganization());
		var entity = requireEntityInOrganization(entityId, facility.getOrganization().getId());
		facility.update(entity, name.trim(), location.trim(), country(country));
		return facility;
	}

	/** An ISO 3166-1 alpha-2 code, upper-cased, or null (spec 07.4). */
	private static String country(String value) {
		var trimmed = trimToNull(value);
		return trimmed == null ? null : trimmed.toUpperCase(Locale.ROOT);
	}

	/**
	 * TRACE-02: a facility with recorded facts is history; it cannot be deleted.
	 * One without them is removed with a reason and stays as a tombstone
	 * (spec 04.4), unless an unpublished inventory still holds it.
	 */
	public void deleteFacility(UUID id, String reason) {
		var facility = getFacility(id);
		access.checkWrite(facility.getOrganization());
		if (activities.existsByFacilityIdAndDeletedAtIsNull(id)) {
			throw new GhgRuleViolationException(
					"'" + facility.getName() + "' has recorded activity data. Facts are the audit trail: "
							+ "remove or reassign its activity records before deleting the facility.");
		}
		var holders = boundaryTreatments.unpublishedInventoriesHolding(id);
		if (!holders.isEmpty()) {
			throw new GhgRuleViolationException("'" + facility.getName() + "' is in the boundary of "
					+ String.join(", ", holders) + ". Remove it from the boundary first.");
		}
		requireReason(reason, "Removing a facility");
		facility.markRemoved(access.currentUserEmail(), reason.trim());
	}

	private static void requireReason(String reason, String what) {
		if (reason == null || reason.trim().length() < 5) {
			throw new GhgFieldException("reason", what + " needs a reason of at least 5 characters.");
		}
	}

	// --- source streams (spec 04.3) ----------------------------------------------

	@Transactional(readOnly = true)
	public List<SourceStream> listStreams(UUID organizationId) {
		getOrganization(organizationId);
		return streams.findAllByFacilityOrganizationIdOrderByNameAsc(organizationId);
	}

	@Transactional(readOnly = true)
	public List<SourceStream> listStreamsOfFacility(UUID facilityId) {
		getFacility(facilityId);
		return streams.findAllByFacilityIdOrderByNameAsc(facilityId);
	}

	/** The facts of a stream as a request states them. */
	public record StreamFacts(String name, StreamKind kind, String fuel, String meterOrSupplier,
			boolean contractorOperated, String note) {
	}

	public SourceStream createStream(UUID facilityId, StreamFacts facts) {
		var facility = getFacility(facilityId);
		access.checkWrite(facility.getOrganization());
		var trimmed = facts.name().trim();
		if (streams.existsByFacilityIdAndNameIgnoreCase(facilityId, trimmed)) {
			throw new GhgRuleViolationException("'" + facility.getName() + "' already has a stream named '" + trimmed + "'.");
		}
		return streams.save(new SourceStream(facility, trimmed, facts.kind(), trimToNull(facts.fuel()),
				trimToNull(facts.meterOrSupplier()), facts.contractorOperated(), trimToNull(facts.note())));
	}

	public SourceStream updateStream(UUID id, StreamFacts facts) {
		var stream = getStream(id);
		access.checkWrite(stream.getFacility().getOrganization());
		var trimmed = facts.name().trim();
		if (!trimmed.equalsIgnoreCase(stream.getName())
				&& streams.existsByFacilityIdAndNameIgnoreCase(stream.getFacility().getId(), trimmed)) {
			throw new GhgRuleViolationException("'" + stream.getFacility().getName() + "' already has a stream named '"
					+ trimmed + "'.");
		}
		stream.update(trimmed, facts.kind(), trimToNull(facts.fuel()), trimToNull(facts.meterOrSupplier()),
				facts.contractorOperated(), trimToNull(facts.note()));
		return stream;
	}

	/** A stream with records is part of the register the facts are filed under; it cannot be deleted. */
	public void deleteStream(UUID id) {
		var stream = getStream(id);
		access.checkWrite(stream.getFacility().getOrganization());
		if (activities.existsByStreamIdAndDeletedAtIsNull(id)) {
			throw new GhgRuleViolationException("'" + stream.getName()
					+ "' has activity records. Move them to another stream before deleting it.");
		}
		streams.delete(stream);
	}

	private SourceStream getStream(UUID id) {
		var stream = streams.findById(id).orElseThrow(() -> GhgNotFoundException.stream(id));
		access.check(stream.getFacility().getOrganization());
		return stream;
	}

	/** The stream a record names must belong to the record's facility. */
	private SourceStream requireStreamOfFacility(UUID streamId, Facility facility) {
		if (streamId == null) {
			return null;
		}
		var stream = streams.findById(streamId).orElseThrow(() -> GhgNotFoundException.stream(streamId));
		if (!stream.getFacility().getId().equals(facility.getId())) {
			throw new GhgRuleViolationException("The stream '" + stream.getName() + "' belongs to '"
					+ stream.getFacility().getName() + "', not to '" + facility.getName() + "'.");
		}
		return stream;
	}

	// --- emission factors (spec 02.1) --------------------------------------------

	@Transactional(readOnly = true)
	public List<EmissionFactor> listEmissionFactors() {
		return emissionFactors.findAllByOrganizationIdIsNullOrderByDefaultScopeAscNameAsc();
	}

	/** The shared library and the organization's own factors together. */
	@Transactional(readOnly = true)
	public List<EmissionFactor> listEmissionFactors(UUID organizationId) {
		getOrganization(organizationId);
		return emissionFactors.findAllByOrganizationIdIsNullOrOrganizationIdOrderByDefaultScopeAscNameAsc(organizationId);
	}

	/** The facts of a factor as a request states them. */
	public record FactorFacts(String name, Scope defaultScope, ActivityCategory defaultCategory, boolean scopeAgnostic,
			String unit, BigDecimal kgCo2ePerUnit, EmissionFactor.Gases gases, String blendComposition,
			String blendGwpSource, EmissionFactor.Provenance provenance, boolean approved) {
	}

	public EmissionFactor createEmissionFactor(UUID organizationId, FactorFacts facts) {
		var organization = getOrganization(organizationId);
		access.checkWrite(organization);
		requireFactorFacts(facts);
		return emissionFactors.save(new EmissionFactor(organization.getId(), facts.name().trim(), facts.defaultScope(),
				facts.defaultCategory(), facts.scopeAgnostic(), facts.unit().trim(), facts.kgCo2ePerUnit(),
				facts.gases(), trimToNull(facts.blendComposition()), trimToNull(facts.blendGwpSource()),
				facts.provenance(), facts.approved(), null, null));
	}

	public EmissionFactor updateEmissionFactor(UUID id, FactorFacts facts) {
		var factor = getOwnFactor(id);
		requireFactorFacts(facts);
		factor.update(facts.name().trim(), facts.defaultScope(), facts.defaultCategory(), facts.scopeAgnostic(),
				facts.unit().trim(), facts.kgCo2ePerUnit(), facts.gases(), trimToNull(facts.blendComposition()),
				trimToNull(facts.blendGwpSource()), facts.provenance(), facts.approved());
		return factor;
	}

	public EmissionFactor setFactorApproval(UUID id, boolean approved) {
		var factor = getOwnFactor(id);
		factor.setApproved(approved);
		return factor;
	}

	/** A factor a run applied is part of the record; retire it by its validity end instead. */
	public void deleteEmissionFactor(UUID id) {
		var factor = getOwnFactor(id);
		if (runLines.existsByFactorId(id)) {
			throw new GhgRuleViolationException("'" + factor.getName()
					+ "' was applied by a calculation run. Set its validity end to retire it instead of deleting it.");
		}
		emissionFactors.delete(factor);
	}

	public record ImportResult(String pack, int created, int updated) {
	}

	/** A shipped pack with its factors, or 404. */
	public FactorPacks.Pack pack(String packId) {
		return factorPacks.find(packId).orElseThrow(() -> GhgNotFoundException.pack(packId));
	}

	/** Imports a pack as the organization's factors; a re-import updates the rows it created (by pack and code). */
	public ImportResult importPack(UUID organizationId, String packId) {
		var organization = getOrganization(organizationId);
		access.checkWrite(organization);
		var pack = factorPacks.find(packId).orElseThrow(() -> GhgNotFoundException.pack(packId));
		var existing = emissionFactors.findAllByOrganizationIdAndPack(organizationId, packId)
			.stream()
			.collect(Collectors.toMap(EmissionFactor::getPackCode, Function.identity(), (a, b) -> a));
		int created = 0;
		int updated = 0;
		for (var row : pack.factors()) {
			if (units.dimensionOf(row.unit()).isEmpty()) {
				continue; // a unit the registry cannot convert; the generator keeps them out, but a pack may carry one
			}
			var gases = new EmissionFactor.Gases(nz(row.co2()), nz(row.ch4()), row.ch4Fossil(), nz(row.n2o()),
					nz(row.hfcsKg()), nz(row.pfcsKg()), nz(row.sf6()), nz(row.nf3()), nz(row.biogenicCo2()));
			var citation = pack.source() + ": " + row.sourceDetail();
			var provenance = new EmissionFactor.Provenance(citation.length() > 500 ? citation.substring(0, 497) + "..." : citation,
					pack.sourceUrl(),
					pack.publicationYear(), row.dataYear(), null, null, trimToNull(row.notes()));
			var current = existing.get(row.code());
			if (current == null) {
				emissionFactors.save(new EmissionFactor(organization.getId(), row.name(), row.defaultScope(),
						row.defaultCategory(), row.scopeAgnostic(), row.unit(), row.kgCo2ePerUnit(), gases,
						trimToNull(row.blendComposition()), trimToNull(row.blendGwpSource()), provenance, row.approved(),
						packId, row.code()));
				created++;
			}
			else {
				current.update(row.name(), row.defaultScope(), row.defaultCategory(), row.scopeAgnostic(), row.unit(),
						row.kgCo2ePerUnit(), gases, trimToNull(row.blendComposition()), trimToNull(row.blendGwpSource()),
						provenance, current.isApproved());
				updated++;
			}
		}
		return new ImportResult(packId, created, updated);
	}

	private static BigDecimal nz(BigDecimal value) {
		return value == null ? BigDecimal.ZERO : value;
	}

	private EmissionFactor getOwnFactor(UUID id) {
		var factor = emissionFactors.findById(id).orElseThrow(() -> GhgNotFoundException.emissionFactor(id));
		if (factor.getOrganizationId() == null) {
			throw new GhgRuleViolationException("'" + factor.getName()
					+ "' is a shared library factor and cannot be changed. Add an organization factor instead.");
		}
		access.checkWrite(getOrganization(factor.getOrganizationId()));
		return factor;
	}

	private void requireFactorFacts(FactorFacts facts) {
		if (facts.defaultCategory().scope() != facts.defaultScope()) {
			throw new GhgRuleViolationException(facts.defaultCategory() + " is not a " + facts.defaultScope().name()
				.toLowerCase().replace('_', ' ') + " category.");
		}
		if (units.dimensionOf(facts.unit()).isEmpty()) {
			throw new GhgRuleViolationException("'" + facts.unit() + "' is not a registered unit; records in it could "
					+ "not be converted. Choose a unit from the registry.");
		}
		var p = facts.provenance();
		if (p.validFrom() != null && p.validTo() != null && p.validTo().isBefore(p.validFrom())) {
			throw new InvalidPeriodException();
		}
		if (facts.blendComposition() != null && !facts.blendComposition().isBlank()) {
			try {
				BlendComposition.parse(facts.blendComposition());
			}
			catch (RuntimeException ex) {
				throw new GhgRuleViolationException("The blend composition must read like 'HFC-32:0.5,HFC-125:0.5'.");
			}
		}
	}

	// --- units and densities (spec 02.2) ------------------------------------------

	/** The registry plus the organization's custom units, for the unit picker and conversion previews. */
	@Transactional(readOnly = true)
	public List<UnitConverter.UnitDef> listUnits(UUID organizationId) {
		getOrganization(organizationId);
		return units.with(customUnits.findAllByOrganizationIdOrderByCodeAsc(organizationId)).all();
	}

	@Transactional(readOnly = true)
	public List<CustomUnit> listCustomUnits(UUID organizationId) {
		getOrganization(organizationId);
		return customUnits.findAllByOrganizationIdOrderByCodeAsc(organizationId);
	}

	public record CustomUnitFacts(String code, String label, String baseUnit, BigDecimal factor) {
	}

	public CustomUnit createCustomUnit(UUID organizationId, CustomUnitFacts facts) {
		var organization = getOrganization(organizationId);
		access.checkWrite(organization);
		var code = facts.code().trim();
		requireCustomUnit(organizationId, code, facts, null);
		return customUnits.save(new CustomUnit(organizationId, code, facts.label().trim(),
				units.registered(facts.baseUnit()).orElseThrow().code(), facts.factor()));
	}

	public CustomUnit updateCustomUnit(UUID id, CustomUnitFacts facts) {
		var unit = getCustomUnit(id);
		var code = facts.code().trim();
		requireCustomUnit(unit.getOrganizationId(), code, facts, unit);
		unit.update(code, facts.label().trim(), units.registered(facts.baseUnit()).orElseThrow().code(),
				facts.factor());
		return unit;
	}

	/** A unit records are recorded in stays defined; the records would stop converting without it. */
	public void deleteCustomUnit(UUID id) {
		var unit = getCustomUnit(id);
		var inUse = activities
			.findAllByFacilityOrganizationIdAndDeletedAtIsNullOrderByPeriodEndDesc(unit.getOrganizationId())
			.stream()
			.anyMatch(activity -> activity.getUnit().equalsIgnoreCase(unit.getCode()));
		if (inUse) {
			throw new GhgRuleViolationException("Records are recorded in " + unit.getCode()
					+ ". Correct them into another unit before deleting the definition.");
		}
		customUnits.delete(unit);
	}

	private void requireCustomUnit(UUID organizationId, String code, CustomUnitFacts facts, CustomUnit self) {
		if (units.registered(code).isPresent()) {
			throw new GhgFieldException("code", "'" + code + "' is already a registered unit.");
		}
		if ((self == null || !self.getCode().equalsIgnoreCase(code))
				&& customUnits.existsByOrganizationIdAndCodeIgnoreCase(organizationId, code)) {
			throw new GhgFieldException("code", "A custom unit named '" + code + "' already exists.");
		}
		if (units.registered(facts.baseUnit()).isEmpty()) {
			throw new GhgFieldException("baseUnit", "'" + facts.baseUnit()
					+ "' is not a registered unit. A custom unit is a multiple of a registered one.");
		}
	}

	private CustomUnit getCustomUnit(UUID id) {
		var unit = customUnits.findById(id).orElseThrow(() -> GhgNotFoundException.customUnit(id));
		access.checkWrite(getOrganization(unit.getOrganizationId()));
		return unit;
	}

	/** The shared typical densities and the organization's own, by material. */
	@Transactional(readOnly = true)
	public List<Density> listDensities(UUID organizationId) {
		getOrganization(organizationId);
		return densities.findAllByOrganizationIdIsNullOrOrganizationIdOrderByMaterialAsc(organizationId);
	}

	public record DensityFacts(String material, BigDecimal kgPerLitre, String source, String note) {
	}

	public Density createDensity(UUID organizationId, DensityFacts facts) {
		var organization = getOrganization(organizationId);
		access.checkWrite(organization);
		var material = facts.material().trim();
		if (densities.existsByOrganizationIdAndMaterialIgnoreCase(organizationId, material)) {
			throw new GhgFieldException("material", "A density for '" + material + "' already exists.");
		}
		return densities.save(new Density(organizationId, material, facts.kgPerLitre(), facts.source().trim(),
				trimToNull(facts.note())));
	}

	public Density updateDensity(UUID id, DensityFacts facts) {
		var density = getOwnDensity(id);
		var material = facts.material().trim();
		if (!material.equalsIgnoreCase(density.getMaterial())
				&& densities.existsByOrganizationIdAndMaterialIgnoreCase(density.getOrganizationId(), material)) {
			throw new GhgFieldException("material", "A density for '" + material + "' already exists.");
		}
		density.update(material, facts.kgPerLitre(), facts.source().trim(), trimToNull(facts.note()));
		return density;
	}

	/** A density a classification applies is part of the record; retire it by correcting the classification. */
	public void deleteDensity(UUID id) {
		var density = getOwnDensity(id);
		if (assignments.existsByDensityId(id)) {
			throw new GhgRuleViolationException("The density of " + density.getMaterial()
					+ " is applied by a classification. Choose another density there before deleting it.");
		}
		densities.delete(density);
	}

	private Density getOwnDensity(UUID id) {
		var density = densities.findById(id).orElseThrow(() -> GhgNotFoundException.density(id));
		if (density.getOrganizationId() == null) {
			throw new GhgRuleViolationException("The typical density of " + density.getMaterial()
					+ " is shared and cannot be changed. Record the organization's own density instead.");
		}
		access.checkWrite(getOrganization(density.getOrganizationId()));
		return density;
	}

	// --- activity data (organizational facts) -------------------------------

	/** A record with how much evidence and how many revisions it carries (spec 04.4). */
	public record ActivitySummary(ActivityRecord activity, long evidenceCount, long revisionCount) {
	}

	@Transactional(readOnly = true)
	public List<ActivitySummary> listActivities(UUID organizationId) {
		getOrganization(organizationId);
		var records = activities.findAllByFacilityOrganizationIdAndDeletedAtIsNullOrderByPeriodEndDesc(organizationId);
		var ids = records.stream().map(ActivityRecord::getId).toList();
		var evidenceCounts = new java.util.HashMap<UUID, Long>();
		if (!ids.isEmpty()) {
			for (var item : evidence.findAllByActivityIdIn(ids)) {
				evidenceCounts.merge(item.getActivityId(), 1L, Long::sum);
			}
		}
		var revisionCounts = new java.util.HashMap<UUID, Long>();
		for (var revision : revisions.findAllByActivityIdIn(ids)) {
			revisionCounts.merge(revision.getActivityId(), 1L, Long::sum);
		}
		return records.stream()
			.map(record -> new ActivitySummary(record, evidenceCounts.getOrDefault(record.getId(), 0L),
					revisionCounts.getOrDefault(record.getId(), 0L)))
			.toList();
	}

	/** The facts of a record as a request states them (spec 04.4: with its quality tier and uncertainty). */
	public record ActivityFacts(UUID facilityId, UUID streamId, String activityType, BigDecimal quantity, String unit,
			LocalDate periodStart, LocalDate periodEnd, String dataSource, String evidenceRef, DataQuality dataQuality,
			String note, Integer dataQualityTier, BigDecimal uncertaintyPercent) {
	}

	public ActivityRecord createActivity(UUID organizationId, ActivityFacts facts) {
		access.checkWrite(getOrganization(organizationId));
		var facility = requireFacilityInOrganization(facts.facilityId(), organizationId);
		requirePeriod(facts.periodStart(), facts.periodEnd());
		if (facts.dataQualityTier() != null) {
			DataQualityTier.require(facts.dataQualityTier());
		}
		return activities.save(new ActivityRecord(facility, requireStreamOfFacility(facts.streamId(), facility),
				facts.activityType().trim(), facts.quantity(), facts.unit().trim(), facts.periodStart(),
				facts.periodEnd(), trimToNull(facts.dataSource()), trimToNull(facts.evidenceRef()),
				facts.dataQuality(), trimToNull(facts.note()), facts.dataQualityTier(), facts.uncertaintyPercent()));
	}

	/**
	 * CORRECT-01: corrections to facts edit the record in place. Past runs are
	 * unaffected (they snapshot); inventory views see the corrected fact and
	 * their validation gates re-evaluate against it. The correction needs a
	 * reason and leaves a revision with each field's old and new value (spec
	 * 04.4).
	 */
	public ActivityRecord updateActivity(UUID id, ActivityFacts facts, String reason) {
		var activity = getActivity(id);
		access.checkWrite(activity.getFacility().getOrganization());
		requireReason(reason, "A correction");
		if (activity.isDeleted()) {
			throw new GhgRuleViolationException("This record was removed and cannot be corrected.");
		}
		var organizationId = activity.getFacility().getOrganization().getId();
		var facility = requireFacilityInOrganization(facts.facilityId(), organizationId);
		requirePeriod(facts.periodStart(), facts.periodEnd());
		var tier = facts.dataQualityTier() == null ? activity.getDataQualityTier() : facts.dataQualityTier();
		DataQualityTier.require(tier);
		var stream = requireStreamOfFacility(facts.streamId(), facility);
		var changes = activity.changesTo(facility, stream, facts.activityType().trim(), facts.quantity(),
				facts.unit().trim(), facts.periodStart(), facts.periodEnd(), trimToNull(facts.dataSource()),
				trimToNull(facts.evidenceRef()), facts.dataQuality(), trimToNull(facts.note()), tier,
				facts.uncertaintyPercent());
		activity.update(facility, stream, facts.activityType().trim(), facts.quantity(), facts.unit().trim(),
				facts.periodStart(), facts.periodEnd(), trimToNull(facts.dataSource()), trimToNull(facts.evidenceRef()),
				facts.dataQuality(), trimToNull(facts.note()), tier, facts.uncertaintyPercent());
		revisions.save(new ActivityRevision(id, ActivityRevision.Kind.CORRECTED, reason.trim(), changes,
				access.currentUserId(), access.currentUserEmail()));
		return activity;
	}

	/** The corrections and the removal of a record, newest first (spec 04.4). */
	@Transactional(readOnly = true)
	public List<ActivityRevision> revisions(UUID activityId) {
		getActivity(activityId);
		return revisions.findAllByActivityIdOrderByChangedAtDesc(activityId);
	}

	/**
	 * TRACE-01: a fact referenced by a calculation run is audit trail; it cannot
	 * be deleted. One that is not is removed with a reason and stays as a
	 * tombstone (spec 04.4); reviews exclude it from every draft inventory.
	 */
	public void deleteActivity(UUID id, String reason) {
		var activity = getActivity(id);
		access.checkWrite(activity.getFacility().getOrganization());
		if (activity.isDeleted()) {
			throw new GhgRuleViolationException("This record was already removed.");
		}
		if (runLines.existsByActivityId(id)) {
			throw new GhgRuleViolationException(
					"This record has been calculated into one or more runs. Reported results must stay "
							+ "traceable to their source: correct the record instead of deleting it.");
		}
		requireReason(reason, "Removing a record");
		activity.markRemoved(access.currentUserEmail(), reason.trim());
		revisions.save(new ActivityRevision(id, ActivityRevision.Kind.REMOVED, reason.trim(), List.of(),
				access.currentUserId(), access.currentUserEmail()));
	}

	// --- helpers -------------------------------------------------------------

	private Facility getFacility(UUID id) {
		var facility = facilities.findById(id)
			.filter(found -> !found.isDeleted())
			.orElseThrow(() -> GhgNotFoundException.facility(id));
		access.check(facility.getOrganization());
		return facility;
	}

	/** A record by id, tombstones included: their history and evidence stay readable. */
	ActivityRecord getActivity(UUID id) {
		var activity = activities.findById(id).orElseThrow(() -> GhgNotFoundException.activity(id));
		access.check(activity.getFacility().getOrganization());
		return activity;
	}

	private Facility requireFacilityInOrganization(UUID facilityId, UUID organizationId) {
		var facility = facilities.findById(facilityId)
			.filter(found -> !found.isDeleted())
			.orElseThrow(() -> GhgNotFoundException.facility(facilityId));
		if (!facility.getOrganization().getId().equals(organizationId)) {
			throw GhgNotFoundException.facility(facilityId);
		}
		return facility;
	}

	private LegalEntity requireEntityInOrganization(UUID entityId, UUID organizationId) {
		if (entityId == null) {
			return entities.findByOrganizationIdAndReportingCompanyTrue(organizationId)
				.orElseThrow(() -> new IllegalStateException("Organization " + organizationId + " has no own entity"));
		}
		var entity = entities.findById(entityId)
			.filter(found -> !found.isDeleted())
			.orElseThrow(() -> GhgNotFoundException.entity(entityId));
		if (!entity.getOrganization().getId().equals(organizationId)) {
			throw GhgNotFoundException.entity(entityId);
		}
		return entity;
	}

	/** A record's period end may not precede its start (spec 04.2). */
	private static void requirePeriod(LocalDate start, LocalDate end) {
		if (end.isBefore(start)) {
			throw new InvalidPeriodException();
		}
	}

	private static String trimToNull(String value) {
		if (value == null || value.trim().isEmpty()) {
			return null;
		}
		return value.trim();
	}
}
