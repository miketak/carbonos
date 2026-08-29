package com.carbonos.ghg.internal;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GhgRunRepository extends JpaRepository<GhgRun, UUID> {

	List<GhgRun> findAllByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

	// lines are rendered with the run detail; fetch them eagerly because
	// open-in-view is off and mapping happens outside the transaction
	@EntityGraph(attributePaths = "lines")
	Optional<GhgRun> findWithLinesById(UUID id);
}
