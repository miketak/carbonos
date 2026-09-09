package com.carbonos.ghg.internal;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FacilityRepository extends JpaRepository<Facility, UUID> {

	// the entity renders with each facility; fetch it eagerly because
	// open-in-view is off and mapping happens outside the transaction
	@EntityGraph(attributePaths = "entity")
	List<Facility> findAllByOrganizationIdAndDeletedAtIsNullOrderByCreatedAtAsc(UUID organizationId);

	long countByOrganizationIdAndDeletedAtIsNull(UUID organizationId);

	boolean existsByEntityIdAndDeletedAtIsNull(UUID entityId);
}
