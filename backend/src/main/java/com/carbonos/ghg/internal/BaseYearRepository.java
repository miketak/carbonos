package com.carbonos.ghg.internal;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BaseYearRepository extends JpaRepository<BaseYear, UUID> {

	// the history and the base-year inventory render with the base year;
	// fetch them eagerly because open-in-view is off
	@EntityGraph(attributePaths = { "recalculations", "inventory", "organization" })
	Optional<BaseYear> findByOrganizationId(UUID organizationId);

	boolean existsByInventoryId(UUID inventoryId);
}
