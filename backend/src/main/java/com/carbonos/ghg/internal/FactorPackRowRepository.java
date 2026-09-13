package com.carbonos.ghg.internal;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FactorPackRowRepository extends JpaRepository<FactorPackRow, UUID> {

	/** An edition's rows in the order the publication lists them. */
	List<FactorPackRow> findAllByEditionIdOrderByOrdinalAsc(String editionId);

	/** Every edition row carrying a publication row identifier, which the blast radius keys on. */
	List<FactorPackRow> findAllByCode(String code);

	Optional<FactorPackRow> findByEditionIdAndCode(String editionId, String code);

	long countByEditionId(String editionId);

	/** The highest position in the edition, so a new row is appended rather than inserted. */
	@Query("select coalesce(max(r.ordinal), 0) from FactorPackRow r where r.editionId = :editionId")
	int highestOrdinal(@Param("editionId") String editionId);

	/**
	 * One page of an edition's rows, filtered as the console's workbench filters
	 * them (spec 02.5), so an edition of 1,868 rows is never read whole.
	 */
	@Query("""
			select r from FactorPackRow r
			 where r.editionId = :editionId
			   and (:category is null or r.sourceCategory = :category)
			   and (:activity is null or r.sourceActivity = :activity)
			   and (:unit is null or r.unit = :unit)
			   and (:term is null or lower(r.code) like :term or lower(r.name) like :term
			        or lower(r.sourceDetail) like :term or lower(r.sourceActivity) like :term)
			 order by r.ordinal""")
	Page<FactorPackRow> search(@Param("editionId") String editionId, @Param("category") String category,
			@Param("activity") String activity, @Param("unit") String unit, @Param("term") String term,
			Pageable pageable);

	/** The publisher's categories an edition carries, for the workbench filter. */
	@Query("""
			select distinct r.sourceCategory from FactorPackRow r
			 where r.editionId = :editionId and r.sourceCategory is not null
			 order by r.sourceCategory""")
	List<String> categoriesOf(@Param("editionId") String editionId);

	@Query("""
			select distinct r.sourceActivity from FactorPackRow r
			 where r.editionId = :editionId and r.sourceActivity is not null
			 order by r.sourceActivity""")
	List<String> activitiesOf(@Param("editionId") String editionId);

	@Query("select distinct r.unit from FactorPackRow r where r.editionId = :editionId order by r.unit")
	List<String> unitsOf(@Param("editionId") String editionId);
}
