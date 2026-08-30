package com.carbonos.ghg.internal;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoundaryTreatmentRepository extends JpaRepository<BoundaryTreatment, UUID> {

	@EntityGraph(attributePaths = "facility")
	List<BoundaryTreatment> findAllByInventoryId(UUID inventoryId);

	Optional<BoundaryTreatment> findByInventoryIdAndFacilityId(UUID inventoryId, UUID facilityId);

}
