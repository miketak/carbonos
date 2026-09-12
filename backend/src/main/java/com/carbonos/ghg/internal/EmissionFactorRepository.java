package com.carbonos.ghg.internal;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EmissionFactorRepository extends JpaRepository<EmissionFactor, UUID> {

	List<EmissionFactor> findAllByOrganizationIdIsNullOrderByDefaultScopeAscNameAsc();

	List<EmissionFactor> findAllByOrganizationIdIsNullOrOrganizationIdOrderByDefaultScopeAscNameAsc(UUID organizationId);

	List<EmissionFactor> findAllByOrganizationIdAndPack(UUID organizationId, String pack);

	/** Every factor of an organization that came from a pack, keyed later by its publication row (spec 02.3). */
	List<EmissionFactor> findAllByOrganizationIdAndPackCodeIsNotNull(UUID organizationId);
}
