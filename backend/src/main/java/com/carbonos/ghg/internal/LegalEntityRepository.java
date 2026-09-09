package com.carbonos.ghg.internal;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LegalEntityRepository extends JpaRepository<LegalEntity, UUID> {

	List<LegalEntity> findAllByOrganizationIdOrderByReportingCompanyDescCreatedAtAsc(UUID organizationId);

	Optional<LegalEntity> findByOrganizationIdAndReportingCompanyTrue(UUID organizationId);

	boolean existsByOrganizationIdAndNameIgnoreCase(UUID organizationId, String name);

	long countByOrganizationId(UUID organizationId);

	boolean existsByParentId(UUID parentId);
}
