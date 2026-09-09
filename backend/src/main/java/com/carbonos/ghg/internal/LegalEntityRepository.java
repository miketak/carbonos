package com.carbonos.ghg.internal;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface LegalEntityRepository extends JpaRepository<LegalEntity, UUID> {

	List<LegalEntity> findAllByOrganizationIdAndDeletedAtIsNullOrderByReportingCompanyDescCreatedAtAsc(
			UUID organizationId);

	Optional<LegalEntity> findByOrganizationIdAndReportingCompanyTrue(UUID organizationId);

	boolean existsByOrganizationIdAndNameIgnoreCaseAndDeletedAtIsNull(UUID organizationId, String name);

	long countByOrganizationIdAndDeletedAtIsNull(UUID organizationId);

	boolean existsByParentIdAndDeletedAtIsNull(UUID parentId);
}
