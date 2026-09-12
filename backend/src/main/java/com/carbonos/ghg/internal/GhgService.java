package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
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
	private final InventoryRepository inventories;
	private final SupportAccessRepository supportAccess;
	private final GhgAuditEventRepository auditEvents;

	GhgService(OrganizationRepository organizations, LegalEntityRepository entities, FacilityRepository facilities,
			EmissionFactorRepository emissionFactors, ActivityRecordRepository activities,
			SourceStreamRepository streams, GhgRunLineRepository runLines, FactorPacks factorPacks, UnitConverter units,
			OrganizationMemberRepository members, UserDirectory userDirectory, GhgAccess access,
			ActivityRevisionRepository revisions, BoundaryTreatmentRepository boundaryTreatments,
			EvidenceRepository evidence, CustomUnitRepository customUnits, DensityRepository densities,
			InventoryAssignmentRepository assignments, InventoryRepository inventories,
			SupportAccessRepository supportAccess, GhgAuditEventRepository auditEvents) {
		this.inventories = inventories;
		this.supportAccess = supportAccess;
		this.auditEvents = auditEvents;
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

	/**
	 * The organizations the caller is a member of, plus, for a platform
	 * administrator, those they hold active support access to (spec 01.3).
	 * Removed organizations are listed for nobody.
	 */
	@Transactional(readOnly = true)
	public List<Organization> listOrganizations() {
		var userId = access.currentUserId();
		var result = new java.util.LinkedHashMap<UUID, Organization>();
		members.findOrganizationsOfUser(userId).forEach(organization -> result.put(organization.getId(), organization));
		if (access.isCurrentUserAdmin()) {
			var granted = supportAccess.findAllByAdminUserIdAndEndedAtIsNullAndExpiresAtAfter(userId, Instant.now())
				.stream()
				.map(SupportAccess::getOrganizationId)
				.toList();
			organizations.findAllById(granted)
				.stream()
				.filter(organization -> !organization.isDeleted())
				.forEach(organization -> result.putIfAbsent(organization.getId(), organization));
		}
		return result.values().stream().sorted(Comparator.comparing(Organization::getCreatedAt)).toList();
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
		if (organizations.existsByNameIgnoreCaseAndDeletedAtIsNull(trimmed)) {
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

	/**
	 * The caller's role in an organization, for the response (spec 01.2): the
	 * member's own, or ADMIN while a platform administrator holds active support
	 * access (spec 01.3).
	 */
	@Transactional(readOnly = true)
	public String roleIn(Organization organization) {
		if (access.isUnderSupportAccess(organization)) {
			return "ADMIN";
		}
		return access.roleIn(organization).map(Enum::name).orElse(null);
	}

	/** The active support grants on an organization, for its owners' overview (spec 01.3). */
	@Transactional(readOnly = true)
	public List<SupportAccess> activeSupportAccess(Organization organization) {
		return supportAccess.findAllByOrganizationIdAndEndedAtIsNullAndExpiresAtAfterOrderByGrantedAtAsc(
				organization.getId(), Instant.now());
	}

	public Organization updateOrganization(UUID id, String name, String address, String contact) {
		var organization = getOrganization(id);
		access.checkOwner(organization);
		var trimmed = name.trim();
		if (!trimmed.equalsIgnoreCase(organization.getName())
				&& organizations.existsByNameIgnoreCaseAndDeletedAtIsNull(trimmed)) {
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

	/**
	 * The inventories that block the organization's deletion (spec 01.3): any
	 * that is published or final, or that has a run designated final.
	 */
	@Transactional(readOnly = true)
	public List<Inventory> deletionBlockers(UUID organizationId) {
		return inventories.findAllByOrganizationIdOrderByCreatedAtDesc(organizationId)
			.stream()
			.filter(inventory -> inventory.getStatus() == InventoryStatus.PUBLISHED
					|| inventory.getStatus() == InventoryStatus.FINAL || inventory.getFinalRunId() != null)
			.toList();
	}

	/**
	 * Removes an organization with a tombstone (spec 01.3): an owner by
	 * membership types the name exactly and gives a reason; refused while any
	 * inventory is published or final. Nothing under it is cascaded.
	 */
	public void deleteOrganization(UUID id, String typedName, String reason) {
		var organization = getOrganization(id);
		access.checkMemberOwner(organization);
		var blockers = deletionBlockers(id);
		if (!blockers.isEmpty()) {
			var names = blockers.stream()
				.map(inventory -> inventory.getName() + ": " + label(inventory.getStatus()))
				.collect(Collectors.joining(", "));
			throw new OrganizationDeletionBlockedException(
					"'" + organization.getName() + "' cannot be deleted while its records stand: " + names
							+ ". Publish records are kept: withdraw the final designation or supersede the published inventory first.",
					blockers);
		}
		if (typedName == null || !typedName.trim().equals(organization.getName())) {
			throw new GhgFieldException("name", "Type the organization's name exactly to confirm.");
		}
		var trimmedReason = reason == null ? "" : reason.trim();
		if (trimmedReason.length() < 10) {
			throw new GhgFieldException("reason", "Give a reason of at least 10 characters.");
		}
		organization.remove(access.currentUserEmail(), trimmedReason);
		auditEvents.save(new GhgAuditEvent(organization.getId(), GhgAuditEvent.Action.ORGANIZATION_DELETED,
				access.currentUserId(), access.currentUserEmail(), trimmedReason));
	}

	/** "Published" or "Final", as the delete dialog and the 409 name an inventory's status. */
	private static String label(InventoryStatus status) {
		var name = status.name();
		return name.charAt(0) + name.substring(1).toLowerCase(Locale.ROOT);
	}

	/** The organization-level history (spec 01.3): support access assumed, ended, expired; the deletion. */
	@Transactional(readOnly = true)
	public List<GhgAuditEvent> organizationEvents(UUID organizationId) {
		getOrganization(organizationId);
		return auditEvents.findAllByOrganizationIdAndInventoryIdIsNullOrderByCreatedAtDesc(organizationId);
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
		access.checkMemberOwner(organization);
		var account = userDirectory.findByEmail(email).orElseThrow(() -> GhgNotFoundException.account(email));
		if (members.findByOrganizationIdAndUserId(organizationId, account.id()).isPresent()) {
			throw new GhgRuleViolationException(account.email() + " is already a member of '" + organization.getName() + "'.");
		}
		return members.save(new OrganizationMember(organization, account.id(), account.email(), account.displayName(), role));
	}

	public OrganizationMember changeMemberRole(UUID organizationId, UUID memberId, OrgRole role) {
		var organization = getOrganization(organizationId);
		access.checkMemberOwner(organization);
		var member = requireMember(organizationId, memberId);
		if (member.getRole() == OrgRole.OWNER && role != OrgRole.OWNER && isLastOwner(organizationId)) {
			throw new GhgRuleViolationException("'" + organization.getName() + "' needs at least one owner.");
		}
		member.setRole(role);
		return member;
	}

	public void removeMember(UUID organizationId, UUID memberId) {
		var organization = getOrganization(organizationId);
		access.checkMemberOwner(organization);
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
			UUID parentEntityId, LocalDate effectiveFrom, LocalDate effectiveTo, String jurisdiction,
			Boolean financialControlOverride, String controlNote) {
	}

	private static void requireStructure(EntityFacts facts) {
		if (facts.effectiveFrom() != null && facts.effectiveTo() != null
				&& facts.effectiveTo().isBefore(facts.effectiveFrom())) {
			throw new GhgFieldException("effectiveTo", "The disposal date is before the acquisition date.");
		}
	}

	public LegalEntity createEntity(UUID organizationId, EntityFacts facts) {
		var organization = getOrganization(organizationId);
		access.checkWrite(organization);
		var trimmed = facts.name().trim();
		if (entities.existsByOrganizationIdAndNameIgnoreCaseAndDeletedAtIsNull(organizationId, trimmed)) {
			throw new GhgRuleViolationException("An entity named '" + trimmed + "' already exists.");
		}
		var parent = requireParent(facts.parentEntityId(), organizationId, null);
		requireStructure(facts);
		var entity = new LegalEntity(organization, trimmed, facts.relationshipType(),
				facts.economicInterestPercent(), facts.legalOwnershipPercent(), facts.operatedByCompany(),
				controlFlag(facts), parent, false);
		entity.setStructure(facts.effectiveFrom(), facts.effectiveTo(), country(facts.jurisdiction()),
				facts.financialControlOverride(), trimToNull(facts.controlNote()));
		return entities.save(entity);
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
		requireStructure(facts);
		entity.update(trimmed, facts.relationshipType(), facts.economicInterestPercent(),
				facts.legalOwnershipPercent(), facts.operatedByCompany(), controlFlag(facts), parent);
		entity.setStructure(facts.effectiveFrom(), facts.effectiveTo(), country(facts.jurisdiction()),
				entity.isReportingCompany() ? null : facts.financialControlOverride(), trimToNull(facts.controlNote()));
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

	/** The attributes of a facility beyond its name, location and entity (spec 03.4). */
	public record FacilityAttributes(String gridRegion, FacilityType facilityType, LeaseType leaseType,
			LocalDate leaseFrom, LocalDate leaseTo) {
		public static FacilityAttributes none() {
			return new FacilityAttributes(null, null, null, null, null);
		}
	}

	private static void requireLease(FacilityAttributes attributes) {
		if (attributes.leaseFrom() != null && attributes.leaseTo() != null
				&& attributes.leaseTo().isBefore(attributes.leaseFrom())) {
			throw new GhgFieldException("leaseTo", "The lease ends before it starts.");
		}
	}

	/** Adds a facility under an entity; without one it belongs to the reporting company (spec 03.1). */
	public Facility createFacility(UUID organizationId, UUID entityId, String name, String location,
			String country, FacilityAttributes attributes) {
		var organization = getOrganization(organizationId);
		access.checkWrite(organization);
		var entity = requireEntityInOrganization(entityId, organizationId);
		requireLease(attributes);
		var facility = new Facility(organization, entity, name.trim(), location.trim(), country(country));
		facility.setAttributes(trimToNull(attributes.gridRegion()) == null ? null
				: attributes.gridRegion().trim().toUpperCase(Locale.ROOT), attributes.facilityType(),
				attributes.leaseType(), attributes.leaseFrom(), attributes.leaseTo());
		return facilities.save(facility);
	}

	public Facility updateFacility(UUID id, UUID entityId, String name, String location, String country,
			FacilityAttributes attributes) {
		var facility = getFacility(id);
		access.checkWrite(facility.getOrganization());
		var entity = requireEntityInOrganization(entityId, facility.getOrganization().getId());
		requireLease(attributes);
		facility.update(entity, name.trim(), location.trim(), country(country));
		facility.setAttributes(trimToNull(attributes.gridRegion()) == null ? null
				: attributes.gridRegion().trim().toUpperCase(Locale.ROOT), attributes.facilityType(),
				attributes.leaseType(), attributes.leaseFrom(), attributes.leaseTo());
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
		return listEmissionFactors(organizationId, true, null);
	}

	/**
	 * The shared library and the organization's own factors, filtered as the
	 * classification picker asks (spec 02.3): unapproved rows hidden until the
	 * toggle reveals them, and a search over name, publication and pack tag.
	 */
	@Transactional(readOnly = true)
	public List<EmissionFactor> listEmissionFactors(UUID organizationId, boolean includeUnapproved, String query) {
		getOrganization(organizationId);
		var all = emissionFactors
			.findAllByOrganizationIdIsNullOrOrganizationIdOrderByDefaultScopeAscNameAsc(organizationId);
		var needle = trimToNull(query) == null ? null : query.trim().toLowerCase(Locale.ROOT);
		return all.stream()
			.filter(factor -> includeUnapproved || factor.isApproved())
			.filter(factor -> needle == null || matches(factor, needle))
			.toList();
	}

	/** Whether a factor answers a picker search: its name, its publication or one of its pack tags. */
	private static boolean matches(EmissionFactor factor, String needle) {
		if (factor.getName().toLowerCase(Locale.ROOT).contains(needle)
				|| factor.getSource().toLowerCase(Locale.ROOT).contains(needle)) {
			return true;
		}
		return factor.getPacks().stream().anyMatch(pack -> pack.toLowerCase(Locale.ROOT).contains(needle));
	}

	/** The facts of a factor as a request states them. */
	public record FactorFacts(String name, Scope defaultScope, ActivityCategory defaultCategory, boolean scopeAgnostic,
			String unit, BigDecimal kgCo2ePerUnit, EmissionFactor.Gases gases, String blendComposition,
			String blendGwpSource, EmissionFactor.Provenance provenance, boolean approved,
			ReportingBasis reportingBasis) {
	}

	public EmissionFactor createEmissionFactor(UUID organizationId, FactorFacts facts) {
		var organization = getOrganization(organizationId);
		access.checkWrite(organization);
		requireFactorFacts(facts);
		var factor = new EmissionFactor(organization.getId(), facts.name().trim(), facts.defaultScope(),
				facts.defaultCategory(), facts.scopeAgnostic(), facts.unit().trim(), facts.kgCo2ePerUnit(),
				facts.gases(), trimToNull(facts.blendComposition()), trimToNull(facts.blendGwpSource()),
				facts.provenance(), facts.approved(), null, null);
		factor.setReportingBasis(facts.reportingBasis());
		return emissionFactors.save(factor);
	}

	public EmissionFactor updateEmissionFactor(UUID id, FactorFacts facts) {
		var factor = getOwnFactor(id);
		requireFactorFacts(facts);
		factor.update(facts.name().trim(), facts.defaultScope(), facts.defaultCategory(), facts.scopeAgnostic(),
				facts.unit().trim(), facts.kgCo2ePerUnit(), facts.gases(), trimToNull(facts.blendComposition()),
				trimToNull(facts.blendGwpSource()), facts.provenance(), facts.approved());
		factor.setReportingBasis(facts.reportingBasis());
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

	/**
	 * What an import did (spec 02.3): rows created, rows refreshed, and rows
	 * another pack had already delivered that only gained this pack's tag.
	 */
	public record ImportResult(String pack, int created, int updated, int tagged) {
	}

	/** A shipped pack with its factors, or 404. */
	public FactorPacks.Pack pack(String packId) {
		return factorPacks.find(packId).orElseThrow(() -> GhgNotFoundException.pack(packId));
	}

	/**
	 * Imports a pack as the organization's factors (spec 02.3). The publication
	 * row identifier is the identity of a factor within an organization: a row
	 * the organization already holds gains this pack's tag and has its values
	 * refreshed, never a copy. Approval belongs to the one factor, so a pack
	 * neither approves a factor a user unapproved nor unapproves one another
	 * import approved.
	 */
	public ImportResult importPack(UUID organizationId, String packId) {
		var organization = getOrganization(organizationId);
		access.checkWrite(organization);
		var pack = factorPacks.find(packId).orElseThrow(() -> GhgNotFoundException.pack(packId));
		var existing = emissionFactors.findAllByOrganizationIdAndPackCodeIsNotNull(organizationId)
			.stream()
			.collect(Collectors.toMap(EmissionFactor::getPackCode, Function.identity(), (a, b) -> a));
		int created = 0;
		int updated = 0;
		int tagged = 0;
		for (var row : pack.factors()) {
			if (units.dimensionOf(row.unit()).isEmpty()) {
				continue; // a unit the registry cannot convert; the generator keeps them out, but a pack may carry one
			}
			var gases = new EmissionFactor.Gases(nz(row.co2()), nz(row.ch4()), row.ch4Fossil(), nz(row.n2o()),
					nz(row.hfcsKg()), nz(row.pfcsKg()), nz(row.sf6()), nz(row.nf3()), nz(row.biogenicCo2()));
			// spec 02.3: the row cites the publication it comes from, not the pack that delivered it
			var citation = row.citation(pack);
			var provenance = new EmissionFactor.Provenance(citation.length() > 500 ? citation.substring(0, 497) + "..." : citation,
					row.citationUrl(pack), row.citationYear(pack), row.dataYear(), null, null, trimToNull(row.notes()));
			var current = existing.get(row.code());
			if (current == null) {
				var factor = new EmissionFactor(organization.getId(), row.name(), row.defaultScope(),
						row.defaultCategory(), row.scopeAgnostic(), row.unit(), row.kgCo2ePerUnit(), gases,
						trimToNull(row.blendComposition()), trimToNull(row.blendGwpSource()), provenance, row.approved(),
						packId, row.code());
				factor.setGridRegion(gridRegionOf(row.code()));
				factor.setReportingBasis(row.basis());
				existing.put(row.code(), emissionFactors.save(factor));
				created++;
			}
			else {
				var alreadyTagged = current.getPacks().contains(packId);
				// approval is a property of the one factor, not of the pack that delivered it again
				current.update(row.name(), row.defaultScope(), row.defaultCategory(), row.scopeAgnostic(), row.unit(),
						row.kgCo2ePerUnit(), gases, trimToNull(row.blendComposition()), trimToNull(row.blendGwpSource()),
						provenance, current.isApproved());
				current.setGridRegion(gridRegionOf(row.code()));
				current.setReportingBasis(row.basis());
				current.addPack(packId);
				if (alreadyTagged) {
					updated++;
				}
				else {
					tagged++;
				}
			}
		}
		return new ImportResult(packId, created, updated, tagged);
	}

	/** The grid a pack row serves (spec 03.4): Ember rows carry the alpha-3 code, eGRID rows the subregion. */
	static String gridRegionOf(String code) {
		if (code == null) {
			return null;
		}
		var parts = code.split(":");
		if (code.startsWith("EMBER:grid:") && parts.length >= 3) {
			return parts[2];
		}
		if (code.startsWith("EPA:Electricity_US_eGRID_subregion") && parts.length >= 3) {
			return "US-" + parts[2].split("_")[0];
		}
		return null;
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
			.anyMatch(activity -> activity.getUnit() != null && activity.getUnit().equalsIgnoreCase(unit.getCode()));
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

	/** A record with how much evidence and how many revisions it carries (spec 04.4), and its readiness (spec 04.6). */
	public record ActivitySummary(ActivityRecord activity, long evidenceCount, long revisionCount,
			ActivityReadiness readiness) {
	}

	/** The register's search, filters, sort and page (spec 04.5), and its readiness filter (spec 04.6). */
	public record ActivityQuery(String q, UUID facilityId, UUID streamId, LocalDate from, LocalDate to,
			ActivityStatus status, String sort, boolean descending, int page, int size) {
	}

	/** How the records that match the search and filters (status aside) divide by readiness (spec 04.6). */
	public record ActivityCounts(long total, long ready, long readyWithDocument, long needsAttention, long drafts) {
	}

	/** One page of the register with the total that matches and the counts by readiness. */
	public record ActivityPage(List<ActivitySummary> items, int page, int size, long total, ActivityCounts counts) {
	}

	private static final java.util.Map<String, String> SORTS = java.util.Map.of("periodEnd", "periodEnd", "periodStart",
			"periodStart", "facility", "facility.name", "activityType", "activityType", "quantity", "quantity",
			"createdAt", "createdAt", "recordNo", "recordNo");

	// "ACT-0012", "act12" or "12" in the search box finds the record by number (spec 04.6)
	private static final java.util.regex.Pattern RECORD_REF = java.util.regex.Pattern
		.compile("(?i)^(?:act-?)?0*(\\d{1,9})$");

	@Transactional(readOnly = true)
	public ActivityPage searchActivities(UUID organizationId, ActivityQuery query) {
		getOrganization(organizationId);
		var trimmed = query.q() == null ? "" : query.q().trim();
		var like = trimmed.isEmpty() ? null : "%" + trimmed.toLowerCase(Locale.ROOT) + "%";
		var refMatch = RECORD_REF.matcher(trimmed);
		var recordNo = refMatch.matches() ? Integer.valueOf(refMatch.group(1)) : null;
		org.springframework.data.jpa.domain.Specification<ActivityRecord> base = (root, cq, cb) -> {
			var facility = root.join("facility");
			var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
			predicates.add(cb.equal(root.get("organizationId"), organizationId));
			predicates.add(cb.isNull(root.get("deletedAt")));
			if (query.facilityId() != null) {
				predicates.add(cb.equal(facility.get("id"), query.facilityId()));
			}
			if (query.streamId() != null) {
				predicates.add(cb.equal(root.get("stream").get("id"), query.streamId()));
			}
			if (query.from() != null) {
				predicates.add(cb.greaterThanOrEqualTo(root.get("periodEnd"), query.from()));
			}
			if (query.to() != null) {
				predicates.add(cb.lessThanOrEqualTo(root.get("periodStart"), query.to()));
			}
			if (like != null) {
				var stream = root.join("stream", jakarta.persistence.criteria.JoinType.LEFT);
				var text = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>(List.of(
						cb.like(cb.lower(root.get("activityType")), like), cb.like(cb.lower(facility.get("name")), like),
						cb.like(cb.lower(cb.coalesce(root.get("dataSource"), "")), like),
						cb.like(cb.lower(cb.coalesce(root.get("evidenceRef"), "")), like),
						cb.like(cb.lower(cb.coalesce(root.get("note"), "")), like),
						cb.like(cb.lower(cb.coalesce(stream.get("name"), "")), like),
						cb.like(cb.lower(cb.coalesce(root.get("unit"), "")), like)));
				if (recordNo != null) {
					text.add(cb.equal(root.get("recordNo"), recordNo));
				}
				predicates.add(cb.or(text.toArray(jakarta.persistence.criteria.Predicate[]::new)));
			}
			return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
		};
		org.springframework.data.jpa.domain.Specification<ActivityRecord> readySpec = ActivityReadiness::ready;
		org.springframework.data.jpa.domain.Specification<ActivityRecord> draftSpec = (root, cq, cb) -> cb
			.isTrue(root.get("draft"));
		org.springframework.data.jpa.domain.Specification<ActivityRecord> withDocumentSpec = (root, cq, cb) -> {
			var attached = cq.subquery(Integer.class);
			var item = attached.from(Evidence.class);
			attached.select(cb.literal(1)).where(cb.equal(item.get("activityId"), root.get("id")));
			return cb.exists(attached);
		};
		var spec = query.status() == null ? base : base.and(
				(root, cq, cb) -> ActivityReadiness.forStatus(query.status(), root, cq, cb));
		var total = activities.count(base);
		var ready = activities.count(base.and(readySpec));
		var readyWithDocument = activities.count(base.and(readySpec).and(withDocumentSpec));
		var drafts = activities.count(base.and(draftSpec));
		var counts = new ActivityCounts(total, ready, readyWithDocument, total - ready, drafts);
		var property = SORTS.getOrDefault(query.sort() == null ? "periodEnd" : query.sort(), "periodEnd");
		var direction = query.descending() ? org.springframework.data.domain.Sort.Direction.DESC
				: org.springframework.data.domain.Sort.Direction.ASC;
		var sort = org.springframework.data.domain.Sort.by(direction, property)
			.and(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt"));
		var size = Math.max(1, Math.min(query.size(), 500));
		var page = activities.findAll(spec,
				org.springframework.data.domain.PageRequest.of(Math.max(0, query.page()), size, sort));
		var ids = page.getContent().stream().map(ActivityRecord::getId).toList();
		var evidenceCounts = new java.util.HashMap<UUID, Long>();
		var revisionCounts = new java.util.HashMap<UUID, Long>();
		if (!ids.isEmpty()) {
			for (var item : evidence.findAllByActivityIdIn(ids)) {
				evidenceCounts.merge(item.getActivityId(), 1L, Long::sum);
			}
			for (var revision : revisions.findAllByActivityIdIn(ids)) {
				revisionCounts.merge(revision.getActivityId(), 1L, Long::sum);
			}
		}
		var items = page.getContent().stream().map(record -> {
			// the facility and stream render outside the transaction: initialize them here
			record.getFacility().getName();
			if (record.getStream() != null) {
				record.getStream().getName();
			}
			var attached = evidenceCounts.getOrDefault(record.getId(), 0L);
			return new ActivitySummary(record, attached, revisionCounts.getOrDefault(record.getId(), 0L),
					ActivityReadiness.of(record, attached > 0));
		}).toList();
		return new ActivityPage(items, page.getNumber(), size, page.getTotalElements(), counts);
	}

	/** One record with its counts and readiness (spec 04.6), for the drawer and after a save. */
	@Transactional(readOnly = true)
	public ActivitySummary summary(UUID id) {
		var activity = getActivity(id);
		activity.getFacility().getName();
		if (activity.getStream() != null) {
			activity.getStream().getName();
		}
		var attached = evidence.countByActivityId(id);
		return new ActivitySummary(activity, attached, revisions.findAllByActivityIdIn(List.of(id)).size(),
				ActivityReadiness.of(activity, attached > 0));
	}

	@Transactional(readOnly = true)
	public long countActivities(UUID organizationId) {
		getOrganization(organizationId);
		return activities.countByFacilityOrganizationIdAndDeletedAtIsNull(organizationId);
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
			.map(record -> {
				var attached = evidenceCounts.getOrDefault(record.getId(), 0L);
				return new ActivitySummary(record, attached, revisionCounts.getOrDefault(record.getId(), 0L),
						ActivityReadiness.of(record, attached > 0));
			})
			.toList();
	}

	/**
	 * The facts of a record as a request states them (spec 04.4: with its quality
	 * tier and uncertainty; spec 04.6: as a draft, which may lack quantity, unit
	 * or period).
	 */
	public record ActivityFacts(boolean draft, UUID facilityId, UUID streamId, String activityType,
			BigDecimal quantity, String unit, LocalDate periodStart, LocalDate periodEnd, String dataSource,
			String evidenceRef, DataQuality dataQuality, String note, Integer dataQualityTier,
			BigDecimal uncertaintyPercent) {

		String unitOrNull() {
			return unit == null || unit.isBlank() ? null : unit.trim();
		}
	}

	public ActivityRecord createActivity(UUID organizationId, ActivityFacts facts) {
		// row-locked: the record number is taken from the organization's counter (spec 04.6)
		var organization = organizations.lockById(organizationId)
			.orElseThrow(() -> GhgNotFoundException.organization(organizationId));
		access.checkWrite(organization);
		var facility = requireFacilityInOrganization(facts.facilityId(), organizationId);
		requireFactComplete(facts);
		if (facts.dataQualityTier() != null) {
			DataQualityTier.require(facts.dataQualityTier());
		}
		var recordNo = organization.allocateRecordNumbers(1);
		return activities.save(new ActivityRecord(recordNo, facts.draft(), facility,
				requireStreamOfFacility(facts.streamId(), facility), facts.activityType().trim(), facts.quantity(),
				facts.unitOrNull(), facts.periodStart(), facts.periodEnd(), trimToNull(facts.dataSource()),
				trimToNull(facts.evidenceRef()), facts.dataQuality(), trimToNull(facts.note()),
				facts.dataQualityTier(), facts.uncertaintyPercent()));
	}

	/** A fact carries quantity, unit and period; only a draft may leave them out (spec 04.6). */
	private static void requireFactComplete(ActivityFacts facts) {
		if (!facts.draft()) {
			if (facts.quantity() == null) {
				throw new GhgFieldException("quantity", "A quantity is required unless the record is saved as a draft.");
			}
			if (facts.unitOrNull() == null) {
				throw new GhgFieldException("unit", "A unit is required unless the record is saved as a draft.");
			}
			if (facts.periodStart() == null) {
				throw new GhgFieldException("periodStart",
						"A period is required unless the record is saved as a draft.");
			}
		}
		if (facts.periodStart() != null && facts.periodEnd() != null) {
			requirePeriod(facts.periodStart(), facts.periodEnd());
		}
		else if (facts.periodStart() == null && facts.periodEnd() != null) {
			throw new GhgFieldException("periodStart", "A period end needs a period start.");
		}
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
		if (activity.isDeleted()) {
			throw new GhgRuleViolationException("This record was removed and cannot be corrected.");
		}
		// spec 04.6: a draft is not yet a fact, so editing it needs no reason; a fact never goes back
		if (!activity.isDraft() && facts.draft()) {
			throw new GhgRuleViolationException(
					"A saved record is corrected with a reason or removed with a reason; it cannot go back to a draft.");
		}
		var promoting = activity.isDraft() && !facts.draft();
		if (!activity.isDraft()) {
			requireReason(reason, "A correction");
		}
		var organizationId = activity.getFacility().getOrganization().getId();
		var facility = requireFacilityInOrganization(facts.facilityId(), organizationId);
		requireFactComplete(facts);
		var tier = facts.dataQualityTier() == null ? activity.getDataQualityTier() : facts.dataQualityTier();
		DataQualityTier.require(tier);
		var stream = requireStreamOfFacility(facts.streamId(), facility);
		var changes = activity.changesTo(facts.draft(), facility, stream, facts.activityType().trim(),
				facts.quantity(), facts.unitOrNull(), facts.periodStart(), facts.periodEnd(),
				trimToNull(facts.dataSource()), trimToNull(facts.evidenceRef()), facts.dataQuality(),
				trimToNull(facts.note()), tier, facts.uncertaintyPercent());
		activity.update(facts.draft(), facility, stream, facts.activityType().trim(), facts.quantity(),
				facts.unitOrNull(), facts.periodStart(), facts.periodEnd(), trimToNull(facts.dataSource()),
				trimToNull(facts.evidenceRef()), facts.dataQuality(), trimToNull(facts.note()), tier,
				facts.uncertaintyPercent());
		if (promoting) {
			// the audit trail names who entered the figures, not who opened the stub
			revisions.save(new ActivityRevision(id, ActivityRevision.Kind.ENTERED, "Entered from a draft.",
					activity.entered(), access.currentUserId(), access.currentUserEmail()));
		}
		else if (!activity.isDraft()) {
			revisions.save(new ActivityRevision(id, ActivityRevision.Kind.CORRECTED, reason.trim(), changes,
					access.currentUserId(), access.currentUserEmail()));
		}
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
