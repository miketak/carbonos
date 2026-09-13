package com.carbonos.ghg.internal.web;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.carbonos.ghg.internal.FactorPackAdoptionService;
import com.carbonos.ghg.internal.FactorPackImportService;
import com.carbonos.ghg.internal.FactorPackNotice;
import com.carbonos.ghg.internal.FactorPackStatus;
import com.carbonos.ghg.internal.InventoryStatus;
import com.carbonos.ghg.internal.OrgRole;

import jakarta.validation.constraints.Size;

/**
 * The organization's factor pack updates (spec 02.7): its inbox of notices, the
 * per-row diff behind one, and the decision a reviewer or an owner records on
 * it. These are the organization's own reads, not an administrator's page, so
 * they sit under {@code /api/ghg} with every other tenant endpoint and are
 * visible to members only (spec 01.3).
 */
@RestController
@RequestMapping("/api/ghg")
class FactorPackNoticeController {

	/** One notice as the inbox lists it. */
	record NoticeResponse(UUID id, String editionId, String editionName, String packKey,
			String predecessorEditionId, FactorPackNotice.Status status, FactorPackStatus editionStatus,
			String withdrawalReason, LocalDate appliesFrom, Instant raisedAt, int rowsAffected, int rowsOverThreshold,
			BigDecimal estimatedKgCo2eDelta, String scopesAffected, String diffHash, Instant decidedAt,
			String decidedBy, OrgRole decidedByRole, FactorPackNotice.RecalculationCase recalculationCase,
			String decisionNote, BigDecimal significanceThresholdPercent, BigDecimal affectedPercent,
			UUID recalculationId, Instant appliedAt) {

		static NoticeResponse of(FactorPackAdoptionService.NoticeView view) {
			var notice = view.notice();
			return new NoticeResponse(notice.getId(), notice.getEditionId(), view.editionName(), view.packKey(),
					notice.getPredecessorEditionId(), notice.getStatus(), view.editionStatus(),
					view.withdrawalReason(), view.appliesFrom(), notice.getRaisedAt(), notice.getRowsAffected(),
					notice.getRowsOverThreshold(), notice.getEstimatedKgCo2eDelta(), notice.getScopesAffected(),
					notice.getDiffHash(), notice.getDecidedAt(), notice.getDecidedBy(), notice.getDecidedByRole(),
					notice.getRecalculationCase(), notice.getDecisionNote(),
					notice.getSignificanceThresholdPercent(), notice.getAffectedPercent(),
					notice.getRecalculationId(), notice.getAppliedAt());
		}
	}

	record DiffRowResponse(String code, String name, String unit, BigDecimal currentKgCo2ePerUnit,
			BigDecimal newKgCo2ePerUnit, BigDecimal absoluteChange, BigDecimal percentChange, List<String> gasesChanged,
			boolean provenanceChanged, boolean gwpBasisChanged, BigDecimal estimatedKgCo2eDelta) {

		static DiffRowResponse of(FactorPackAdoptionService.DiffRow row) {
			return new DiffRowResponse(row.code(), row.name(), row.unit(), row.currentKgCo2ePerUnit(),
					row.newKgCo2ePerUnit(), row.absoluteChange(), row.percentChange(), row.gasesChanged(),
					row.provenanceChanged(), row.gwpBasisChanged(), row.estimatedKgCo2eDelta());
		}
	}

	record ApartRowResponse(String code, String name, String reason) {

		static ApartRowResponse of(FactorPackAdoptionService.ApartRow row) {
			return new ApartRowResponse(row.code(), row.name(), row.reason());
		}
	}

	record InventoryRefResponse(UUID inventoryId, String name, LocalDate periodStart, LocalDate periodEnd,
			InventoryStatus status) {

		static InventoryRefResponse of(FactorPackAdoptionService.InventoryRef ref) {
			return ref == null ? null : new InventoryRefResponse(ref.inventoryId(), ref.name(), ref.periodStart(),
					ref.periodEnd(), ref.status());
		}
	}

	/** The diff behind one notice, with the four groups the decision does not apply to. */
	record DiffResponse(UUID noticeId, String editionId, String editionName, String predecessorEditionId,
			LocalDate appliesFrom, FactorPackNotice.Status status, List<DiffRowResponse> rows,
			List<ApartRowResponse> conflicts, List<ApartRowResponse> blocked, List<ApartRowResponse> discontinued,
			List<InventoryRefResponse> earlierPeriods, BigDecimal estimatedKgCo2eDelta, String diffHash,
			boolean gwpBasisChanged, String currentGwpBasis, String newGwpBasis, String estimatedOver,
			InventoryRefResponse lockedPeriod, boolean hasBaseYear, BigDecimal thresholdPercent,
			BigDecimal affectedPercent, String recalculationWarning) {

		static DiffResponse of(FactorPackAdoptionService.Diff diff) {
			return new DiffResponse(diff.noticeId(), diff.editionId(), diff.editionName(),
					diff.predecessorEditionId(), diff.appliesFrom(), diff.status(),
					diff.rows().stream().map(DiffRowResponse::of).toList(),
					diff.conflicts().stream().map(ApartRowResponse::of).toList(),
					diff.blocked().stream().map(ApartRowResponse::of).toList(),
					diff.discontinued().stream().map(ApartRowResponse::of).toList(),
					diff.earlierPeriods().stream().map(InventoryRefResponse::of).toList(),
					diff.estimatedKgCo2eDelta(), diff.diffHash(), diff.gwpBasisChanged(), diff.currentGwpBasis(),
					diff.newGwpBasis(), diff.estimatedOver(), InventoryRefResponse.of(diff.lockedPeriod()),
					diff.hasBaseYear(), diff.thresholdPercent(), diff.affectedPercent(),
					FactorPackAdoptionService.RECALCULATION_WARNING);
		}
	}

	/** What a decider states when accepting: the answer chapter 5 needs, and an optional note. */
	record AcceptRequest(String recalculationCase, @Size(max = 2000) String note) {
	}

	record DeclineRequest(@Size(max = 2000) String note) {
	}

	private final FactorPackAdoptionService adoption;

	FactorPackNoticeController(FactorPackAdoptionService adoption) {
		this.adoption = adoption;
	}

	@GetMapping("/organizations/{organizationId}/factor-pack-notices")
	List<NoticeResponse> list(@PathVariable UUID organizationId) {
		return adoption.list(organizationId).stream().map(NoticeResponse::of).toList();
	}

	@GetMapping("/factor-pack-notices/{noticeId}/diff")
	DiffResponse diff(@PathVariable UUID noticeId) {
		return DiffResponse.of(adoption.diff(noticeId));
	}

	@PostMapping("/factor-pack-notices/{noticeId}/accept")
	FactorPackImportService.ImportResult accept(@PathVariable UUID noticeId,
			@RequestBody(required = false) AcceptRequest request) {
		return adoption.accept(noticeId, request == null ? null : request.recalculationCase(),
				request == null ? null : request.note());
	}

	@PostMapping("/factor-pack-notices/{noticeId}/decline")
	NoticeResponse decline(@PathVariable UUID noticeId, @RequestBody(required = false) DeclineRequest request) {
		return NoticeResponse.of(adoption.decline(noticeId, request == null ? null : request.note()));
	}
}
