package com.carbonos.ghg.internal;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UpstreamRuleRepository extends JpaRepository<UpstreamRule, UUID> {

	@EntityGraph(attributePaths = { "primaryFactor", "upstreamFactor" })
	List<UpstreamRule> findAllByInventoryIdOrderByCreatedAtAsc(UUID inventoryId);

	boolean existsByInventoryIdAndPrimaryFactorIdAndKind(UUID inventoryId, UUID primaryFactorId, UpstreamRuleKind kind);
}
