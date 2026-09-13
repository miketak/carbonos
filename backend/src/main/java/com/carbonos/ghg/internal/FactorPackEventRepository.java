package com.carbonos.ghg.internal;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

/** The publication trail of an edition (spec 02.5), newest last. */
public interface FactorPackEventRepository extends JpaRepository<FactorPackEvent, UUID> {

	List<FactorPackEvent> findAllByEditionIdOrderByOccurredAtAsc(String editionId);
}
