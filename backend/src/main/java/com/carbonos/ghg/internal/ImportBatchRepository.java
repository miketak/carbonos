package com.carbonos.ghg.internal;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ImportBatchRepository extends JpaRepository<ImportBatch, UUID> {

	List<ImportBatch> findAllByOrganizationIdOrderByImportedAtDesc(UUID organizationId);
}
