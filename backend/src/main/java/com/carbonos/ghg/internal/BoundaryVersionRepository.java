package com.carbonos.ghg.internal;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BoundaryVersionRepository extends JpaRepository<BoundaryVersion, UUID> {

	List<BoundaryVersion> findAllByInventoryIdOrderByVersionNoDesc(UUID inventoryId);

	// entries and their facilities render with the version and the tenant
	// check needs the inventory; fetch them eagerly because open-in-view is off
	@EntityGraph(attributePaths = { "entries", "entries.facilities", "exclusions", "inventory" })
	Optional<BoundaryVersion> findWithEntriesById(UUID id);

	Optional<BoundaryVersion> findTopByInventoryIdOrderByVersionNoDesc(UUID inventoryId);
}
