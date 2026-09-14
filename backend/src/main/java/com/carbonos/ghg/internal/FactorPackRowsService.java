package com.carbonos.ghg.internal;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Reading the rows of a factor pack from inside an organization (spec 02.8).
 *
 * <p>A preparer choosing a factor set has to know what a pack carries before
 * taking it; importing one to find out writes 1,868 rows and cuts a version of
 * every lineage the organization already holds (spec 02.6). This reads the same
 * page the administrator's workbench reads, over the same query, without the
 * administrator's rights and without assembling the edition into memory.
 */
@Service
@Transactional(readOnly = true)
public class FactorPackRowsService {

	private final OrganizationRepository organizations;

	private final FactorPackEditionRepository editions;

	private final FactorPackRowRepository rows;

	private final GhgAccess access;

	FactorPackRowsService(OrganizationRepository organizations, FactorPackEditionRepository editions,
			FactorPackRowRepository rows, GhgAccess access) {
		this.organizations = organizations;
		this.editions = editions;
		this.rows = rows;
		this.access = access;
	}

	/** One page of an edition's rows, with the publisher's categories it carries. */
	public RowPage rows(UUID organizationId, String editionId, String search, String category, int page, int size) {
		var organization = organizations.findById(organizationId)
			.orElseThrow(() -> GhgNotFoundException.organization(organizationId));
		access.check(organization);
		// spec 02.8: a draft belongs to the console, so an organization is told the edition does not exist
		var edition = editions.findByEditionIdAndStatusNot(editionId, FactorPackStatus.DRAFT)
			.orElseThrow(() -> GhgNotFoundException.pack(editionId));
		var term = trimToNull(search);
		var found = rows.search(edition.getEditionId(), trimToNull(category), null, null,
				term == null ? null : "%" + term.toLowerCase(Locale.ROOT) + "%",
				PageRequest.of(Math.max(0, page), Math.clamp(size, 1, 200)));
		return new RowPage(found.getContent(), found.getNumber(), found.getSize(), found.getTotalElements(),
				rows.categoriesOf(edition.getEditionId()));
	}

	/**
	 * One page of rows and the categories the whole edition carries, so the
	 * filter offers only values that exist.
	 */
	public record RowPage(List<FactorPackRow> rows, int page, int size, long total, List<String> categories) {
	}

	private static String trimToNull(String value) {
		if (value == null) {
			return null;
		}
		var trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}

}
