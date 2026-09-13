package com.carbonos.ghg.internal;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EmissionFactorRepository
		extends JpaRepository<EmissionFactor, UUID>, JpaSpecificationExecutor<EmissionFactor> {

	List<EmissionFactor> findAllByOrganizationIdIsNullOrderByDefaultScopeAscNameAsc();

	List<EmissionFactor> findAllByOrganizationIdIsNullOrOrganizationIdOrderByDefaultScopeAscNameAsc(UUID organizationId);

	/** The approved grid factors of both tiers; the only rows a grid suggestion can come from (spec 03.4). */
	@Query("""
			select f from EmissionFactor f
			 where (f.organizationId is null or f.organizationId = :organizationId)
			   and f.gridRegion is not null and f.approved = true
			 order by f.defaultScope, f.name""")
	List<EmissionFactor> gridFactors(@Param("organizationId") UUID organizationId);

	/** The approved factors reported outside the scopes, for the Montreal Protocol hint (spec 04.8). */
	@Query("""
			select f from EmissionFactor f
			 where (f.organizationId is null or f.organizationId = :organizationId)
			   and f.reportingBasis <> com.carbonos.ghg.internal.ReportingBasis.SCOPES and f.approved = true
			 order by f.defaultScope, f.name""")
	List<EmissionFactor> outsideScopeFactors(@Param("organizationId") UUID organizationId);

	List<EmissionFactor> findAllByOrganizationIdAndPack(UUID organizationId, String pack);

	/** How many organizations hold factors from each edition, for the console's holder count (spec 02.5). */
	@Query("""
			select f.sourceEdition, count(distinct f.organizationId) from EmissionFactor f
			 where f.sourceEdition is not null group by f.sourceEdition""")
	List<Object[]> countHoldersByEdition();

	/** Every factor of an organization that came from a pack, keyed later by its publication row (spec 02.3). */
	List<EmissionFactor> findAllByOrganizationIdAndPackCodeIsNotNull(UUID organizationId);

	/**
	 * Every organization's factor whose lineage is one of these publication row
	 * identifiers, which is what the blast radius keys on (spec 02.5). It keys
	 * on the code and never on a pack tag: 150 codes appear in more than one
	 * pack file, and a holder may carry a row under a sector pack's tag.
	 */
	@Query("""
			select f from EmissionFactor f
			 where f.organizationId is not null and f.packCode in :codes
			 order by f.organizationId, f.packCode""")
	List<EmissionFactor> heldByCode(@Param("codes") java.util.Collection<String> codes);

	/** The publisher's categories across both tiers, for the picker's filter (spec 02.5, FU-03). */
	@Query("""
			select distinct f.sourceCategory from EmissionFactor f
			 where (f.organizationId is null or f.organizationId = :organizationId)
			   and f.sourceCategory is not null
			 order by f.sourceCategory""")
	List<String> sourceCategories(@Param("organizationId") UUID organizationId);

	/** The publisher's activities, narrowed to one category when the filter names one. */
	@Query("""
			select distinct f.sourceActivity from EmissionFactor f
			 where (f.organizationId is null or f.organizationId = :organizationId)
			   and f.sourceActivity is not null
			   and (:sourceCategory is null or lower(f.sourceCategory) = :sourceCategory)
			 order by f.sourceActivity""")
	List<String> sourceActivities(@Param("organizationId") UUID organizationId,
			@Param("sourceCategory") String sourceCategory);

	/** The units the visible factors are published in, for the picker's unit filter. */
	@Query("""
			select distinct f.unit from EmissionFactor f
			 where (f.organizationId is null or f.organizationId = :organizationId)
			 order by f.unit""")
	List<String> units(@Param("organizationId") UUID organizationId);

}
