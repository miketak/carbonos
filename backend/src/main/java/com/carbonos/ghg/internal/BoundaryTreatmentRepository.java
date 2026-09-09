package com.carbonos.ghg.internal;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface BoundaryTreatmentRepository extends JpaRepository<BoundaryTreatment, UUID> {

	// the entity and the included facilities render with each treatment and
	// feed version cutting; fetch them eagerly because open-in-view is off
	@EntityGraph(attributePaths = { "entity", "facilities", "facilities.facility" })
	List<BoundaryTreatment> findAllByInventoryId(UUID inventoryId);

	@EntityGraph(attributePaths = { "entity", "facilities", "facilities.facility" })
	Optional<BoundaryTreatment> findByInventoryIdAndEntityId(UUID inventoryId, UUID entityId);

	/** The names of unpublished inventories whose boundary still holds the facility (spec 04.4). */
	@Query("select distinct t.inventory.name from BoundaryFacility f join f.treatment t "
			+ "where f.facility.id = :facilityId and t.inventory.status <> com.carbonos.ghg.internal.InventoryStatus.PUBLISHED")
	List<String> unpublishedInventoriesHolding(UUID facilityId);
}
