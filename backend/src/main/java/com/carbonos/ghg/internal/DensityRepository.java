package com.carbonos.ghg.internal;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DensityRepository extends JpaRepository<Density, UUID> {

	List<Density> findAllByOrganizationIdIsNullOrOrganizationIdOrderByMaterialAsc(UUID organizationId);

	boolean existsByOrganizationIdAndMaterialIgnoreCase(UUID organizationId, String material);
}
