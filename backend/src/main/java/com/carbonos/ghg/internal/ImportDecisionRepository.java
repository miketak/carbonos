package com.carbonos.ghg.internal;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ImportDecisionRepository extends JpaRepository<ImportDecision, UUID> {

	List<ImportDecision> findAllByBatchIdOrderByDecidedAtAsc(UUID batchId);
}
