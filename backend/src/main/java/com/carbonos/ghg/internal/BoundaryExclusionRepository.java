package com.carbonos.ghg.internal;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoundaryExclusionRepository extends JpaRepository<BoundaryExclusion, UUID> {

	@EntityGraph(attributePaths = { "entity", "facility", "facility.entity" })
	List<BoundaryExclusion> findAllByInventoryIdOrderByCreatedAtAsc(UUID inventoryId);

	Optional<BoundaryExclusion> findByInventoryIdAndEntityId(UUID inventoryId, UUID entityId);

	Optional<BoundaryExclusion> findByInventoryIdAndFacilityId(UUID inventoryId, UUID facilityId);
}
