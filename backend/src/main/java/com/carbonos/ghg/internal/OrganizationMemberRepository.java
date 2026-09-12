package com.carbonos.ghg.internal;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface OrganizationMemberRepository extends JpaRepository<OrganizationMember, UUID> {

	List<OrganizationMember> findAllByOrganizationIdOrderByCreatedAtAsc(UUID organizationId);

	Optional<OrganizationMember> findByOrganizationIdAndUserId(UUID organizationId, UUID userId);

	long countByOrganizationIdAndRole(UUID organizationId, OrgRole role);

	/** The live organizations the user is a member of; removed ones are listed for nobody (spec 01.3). */
	@Query("select m.organization from OrganizationMember m where m.userId = :userId and m.organization.deletedAt is null order by m.organization.createdAt")
	List<Organization> findOrganizationsOfUser(UUID userId);

	/** The owners' emails of an organization, for the administrators' support list (spec 01.3). */
	@Query("select m.email from OrganizationMember m where m.organization.id = :organizationId and m.role = com.carbonos.ghg.internal.OrgRole.OWNER order by m.createdAt")
	List<String> findOwnerEmails(UUID organizationId);

	long countByOrganizationId(UUID organizationId);
}
