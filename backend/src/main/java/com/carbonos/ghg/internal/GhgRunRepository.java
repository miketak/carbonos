package com.carbonos.ghg.internal;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GhgRunRepository extends JpaRepository<GhgRun, UUID> {

	// the inventory renders with each run (isFinal); fetch it eagerly because
	// open-in-view is off and mapping happens outside the transaction
	@EntityGraph(attributePaths = "inventory")
	List<GhgRun> findAllByInventoryIdOrderByCreatedAtDesc(UUID inventoryId);

	@EntityGraph(attributePaths = { "lines", "inventory" })
	Optional<GhgRun> findWithLinesById(UUID id);
}
