package com.carbonos.ghg.internal;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoundaryTreatmentRepository extends JpaRepository<BoundaryTreatment, UUID> {

	// the entity and the included facilities render with each treatment and
	// feed version cutting; fetch them eagerly because open-in-view is off
	@EntityGraph(attributePaths = { "entity", "facilities", "facilities.facility" })
	List<BoundaryTreatment> findAllByInventoryId(UUID inventoryId);

	@EntityGraph(attributePaths = { "entity", "facilities", "facilities.facility" })
	Optional<BoundaryTreatment> findByInventoryIdAndEntityId(UUID inventoryId, UUID entityId);
}
