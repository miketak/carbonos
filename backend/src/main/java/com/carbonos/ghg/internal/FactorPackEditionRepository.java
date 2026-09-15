package com.carbonos.ghg.internal;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface FactorPackEditionRepository extends JpaRepository<FactorPackEdition, String> {

	List<FactorPackEdition> findAllByStatusOrderByEditionIdAsc(FactorPackStatus status);

	/** Every edition of one family, oldest identifier first, for the console's list. */
	List<FactorPackEdition> findAllByPackKeyOrderByEditionIdAsc(String packKey);

	List<FactorPackEdition> findAllByOrderByPackKeyAscEditionIdAsc();

	/** The edition counts the administration panel shows (spec 01.5). */
	long countByStatus(FactorPackStatus status);

	/** An edition an organization may see: a draft is never visible to one (spec 02.5). */
	Optional<FactorPackEdition> findByEditionIdAndStatusNot(String editionId, FactorPackStatus status);

	/**
	 * How many rows each edition holds, counted in the database, so listing the
	 * packs never materializes the 2,836 rows they carry between them.
	 */
	@Query("SELECT r.editionId, COUNT(r) FROM FactorPackRow r GROUP BY r.editionId")
	List<Object[]> countRowsByEdition();
}
