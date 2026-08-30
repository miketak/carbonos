package com.carbonos.ghg.internal;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryAssignmentRepository extends JpaRepository<InventoryAssignment, UUID> {

	// activity (and its facility) plus factor render with each assignment
	@EntityGraph(attributePaths = { "activity", "activity.facility", "emissionFactor" })
	List<InventoryAssignment> findAllByInventoryIdOrderByCreatedAtAsc(UUID inventoryId);

	// single-assignment mutations map to DTOs outside the transaction
	@EntityGraph(attributePaths = { "activity", "activity.facility", "emissionFactor" })
	java.util.Optional<InventoryAssignment> findWithDetailsById(UUID id);

	List<InventoryAssignment> findAllByActivityId(UUID activityId);

}
