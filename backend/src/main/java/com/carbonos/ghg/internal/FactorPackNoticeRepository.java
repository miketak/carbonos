package com.carbonos.ghg.internal;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * The notices publication raises (spec 02.7). This phase writes them and
 * withdrawal closes them; the inbox, the diff and the decision are spec 02.7's
 * own phase.
 */
public interface FactorPackNoticeRepository extends JpaRepository<FactorPackNotice, UUID> {

	List<FactorPackNotice> findAllByEditionIdOrderByRaisedAtAsc(String editionId);

	List<FactorPackNotice> findAllByEditionIdAndStatus(String editionId, FactorPackNotice.Status status);

	List<FactorPackNotice> findAllByOrganizationIdOrderByRaisedAtDesc(UUID organizationId);

	long countByEditionIdAndStatus(String editionId, FactorPackNotice.Status status);
}
