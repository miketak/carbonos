package com.carbonos.ghg.internal;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MarketFactorRepository extends JpaRepository<MarketFactor, UUID> {

	@EntityGraph(attributePaths = "facility")
	List<MarketFactor> findAllByInventoryId(UUID inventoryId);

	@EntityGraph(attributePaths = "facility")
	Optional<MarketFactor> findByInventoryIdAndFacilityId(UUID inventoryId, UUID facilityId);
}
