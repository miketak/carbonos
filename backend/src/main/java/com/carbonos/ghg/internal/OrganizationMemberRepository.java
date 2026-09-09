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

	@Query("select m.organization from OrganizationMember m where m.userId = :userId order by m.organization.createdAt")
	List<Organization> findOrganizationsOfUser(UUID userId);
}
