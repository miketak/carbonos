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

	/**
	 * The organization's factors that feed an inventory in one of these states,
	 * which the blast radius reports as blocked (specs 02.5 and 02.7): a change
	 * inside a FROZEN, FINAL or PUBLISHED period is not the organization's to
	 * make any more.
	 */
	@Query("""
			select distinct a.emissionFactor.id from InventoryAssignment a
			 where a.inventory.organization.id = :organizationId
			   and a.inventory.status in :statuses
			   and a.emissionFactor is not null""")
	java.util.Set<UUID> factorIdsInInventoriesWithStatus(UUID organizationId,
			java.util.Collection<InventoryStatus> statuses);

	/**
	 * The factors those inventories classified with (spec 02.7). The adoption
	 * diff names a lineage blocked when the edition's applies-from date falls
	 * inside a locked period that uses it, which is the same rule the import
	 * refuses the whole edition on.
	 */
	@Query("""
			select distinct a.emissionFactor.id from InventoryAssignment a
			 where a.inventory.id in :inventoryIds
			   and a.emissionFactor is not null""")
	java.util.Set<UUID> factorIdsInInventories(java.util.Collection<UUID> inventoryIds);

}
