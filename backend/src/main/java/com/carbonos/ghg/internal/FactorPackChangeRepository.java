package com.carbonos.ghg.internal;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

/** The change log each edition froze at publication (spec 02.5). */
public interface FactorPackChangeRepository extends JpaRepository<FactorPackChange, UUID> {

	List<FactorPackChange> findAllByEditionIdOrderByCodeAsc(String editionId);

	long countByEditionId(String editionId);
}
