package com.carbonos.ghg.internal;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface IntensityMetricRepository extends JpaRepository<IntensityMetric, UUID> {

	List<IntensityMetric> findAllByInventoryIdOrderByName(UUID inventoryId);

	void deleteAllByInventoryId(UUID inventoryId);
}
