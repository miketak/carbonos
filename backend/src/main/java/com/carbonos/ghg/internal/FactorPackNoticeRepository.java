package com.carbonos.ghg.internal;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * The notices publication raises (spec 02.7). This phase writes them and
 * withdrawal closes them. Spec 02.7's own phase reads them as the
 * organization's inbox, opens the diff, and records the decision.
 */
public interface FactorPackNoticeRepository extends JpaRepository<FactorPackNotice, UUID> {

	List<FactorPackNotice> findAllByEditionIdOrderByRaisedAtAsc(String editionId);

	List<FactorPackNotice> findAllByEditionIdAndStatus(String editionId, FactorPackNotice.Status status);

	List<FactorPackNotice> findAllByOrganizationIdOrderByRaisedAtDesc(UUID organizationId);

	long countByEditionIdAndStatus(String editionId, FactorPackNotice.Status status);

	/**
	 * How many adoption decisions are outstanding across the platform
	 * (spec 01.5). A bare total only: a notice states a movement computed from
	 * the organization's own activity data, so naming which client has one
	 * would put tenant inventory data in the administration panel.
	 */
	long countByStatus(FactorPackNotice.Status status);

	/** The count badge the organization's navigation carries (spec 02.7). */
	long countByOrganizationIdAndStatus(UUID organizationId, FactorPackNotice.Status status);

	java.util.Optional<FactorPackNotice> findByOrganizationIdAndEditionId(UUID organizationId, String editionId);

	List<FactorPackNotice> findAllByOrganizationIdAndStatusOrderByRaisedAtAsc(UUID organizationId,
			FactorPackNotice.Status status);
}
