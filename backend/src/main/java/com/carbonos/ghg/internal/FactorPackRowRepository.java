package com.carbonos.ghg.internal;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FactorPackRowRepository extends JpaRepository<FactorPackRow, UUID> {

	/** An edition's rows in the order the publication lists them. */
	List<FactorPackRow> findAllByEditionIdOrderByOrdinalAsc(String editionId);

	/** Every edition row carrying a publication row identifier, which the blast radius keys on. */
	List<FactorPackRow> findAllByCode(String code);
}
