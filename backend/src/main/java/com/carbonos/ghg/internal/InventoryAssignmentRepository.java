package com.carbonos.ghg.internal;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface InventoryAssignmentRepository extends JpaRepository<InventoryAssignment, UUID> {

	// activity (and its facility) plus factor render with each assignment
	@EntityGraph(attributePaths = { "activity", "activity.facility", "activity.stream", "emissionFactor", "density" })
	List<InventoryAssignment> findAllByInventoryIdOrderByCreatedAtAsc(UUID inventoryId);

	// single-assignment mutations map to DTOs outside the transaction
	@EntityGraph(attributePaths = { "activity", "activity.facility", "activity.stream", "emissionFactor", "density" })
	java.util.Optional<InventoryAssignment> findWithDetailsById(UUID id);

	List<InventoryAssignment> findAllByActivityId(UUID activityId);

	boolean existsByDensityId(UUID densityId);

	boolean existsByEmissionFactorId(UUID emissionFactorId);

	/** The inventories that classified with a factor (spec 02.6), so a refusal to delete it can name them. */
	@Query("select distinct a.inventory.name from InventoryAssignment a where a.emissionFactor.id = :factorId")
	List<String> inventoryNamesUsingFactor(UUID factorId);

}
