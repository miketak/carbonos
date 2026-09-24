package com.carbonos.ghg.internal.web.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import com.carbonos.ghg.internal.FactorPackAdminService;
import com.carbonos.ghg.internal.FactorPackKind;
import com.carbonos.ghg.internal.FactorPackStatus;

/**
 * One pack family with its editions, as the maintenance console lists them
 * (spec 02.5). The family is the lineage of one publication; the edition is the
 * unit of vintage, so each carries its own status, dates and counts.
 */
public record AdminFactorPackResponse(String packKey, String name, FactorPackKind kind, String summary,
		List<Edition> editions) {

	/** One edition's header: what the console shows without reading a single row. */
	public record Edition(String editionId, String packKey, String name, FactorPackStatus status, String source,
			String sourceUrl, Integer publicationYear, String gwpBasis, String license, String retrieved,
			String notes, LocalDate appliesFrom, Instant publishedAt, String sourceDocument, String evidenceChecksum,
			String evidenceName, Long evidenceSize, String curator, String curatorEmail, String approver,
			String provenanceReview,
			String provenanceNote, String supersedesId, boolean erratum, String erratumNote, String errorNote,
			Instant withdrawnAt, String withdrawnBy, String withdrawalReason, boolean mutable, long rowCount,
			long holderCount) {

		public static Edition from(FactorPackAdminService.EditionView view) {
			var edition = view.edition();
			return new Edition(edition.getEditionId(), edition.getPackKey(), edition.getName(), edition.getStatus(),
					edition.getSource(), edition.getSourceUrl(), edition.getPublicationYear(), edition.getGwpBasis(),
					edition.getLicense(), edition.getRetrieved(), edition.getNotes(), edition.getAppliesFrom(),
					edition.getPublishedAt(), edition.getSourceDocument(), edition.getEvidenceChecksum(),
					edition.getEvidenceName(), edition.getEvidenceSize(), edition.getCuratorName(),
					edition.getCuratorEmail(), edition.getApproverName(), edition.getProvenanceReview(), edition.getProvenanceNote(),
					edition.getSupersedesId(), edition.isErratum(), edition.getErratumNote(), edition.getErrorNote(),
					edition.getWithdrawnAt(), edition.getWithdrawnBy(), edition.getWithdrawalReason(),
					edition.isMutable(), view.rowCount(), view.holderCount());
		}
	}

	public static AdminFactorPackResponse from(FactorPackAdminService.FamilyView view) {
		var family = view.family();
		return new AdminFactorPackResponse(family.getPackKey(), family.getName(), family.getKind(),
				family.getSummary(), view.editions().stream().map(Edition::from).toList());
	}
}
