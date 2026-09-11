package com.carbonos.ghg.internal.web.dto;

import java.time.Instant;
import java.util.UUID;

import com.carbonos.ghg.internal.ActivityRecord;
import com.carbonos.ghg.internal.EvidenceService;

/** The file a CSV import came from (spec 04.6): kept with its digest for traceability, with the records it produced. */
public record ImportBatchResponse(UUID id, String fileName, String sha256, int rowCount, long sizeBytes,
		String importedBy, Instant importedAt, String firstRecordRef, String lastRecordRef) {

	public static ImportBatchResponse from(EvidenceService.BatchSummary summary) {
		var batch = summary.batch();
		return new ImportBatchResponse(batch.getId(), batch.getFileName(), batch.getSha256(), batch.getRowCount(),
				batch.getSizeBytes(), batch.getImportedBy(), batch.getImportedAt(),
				ActivityRecord.ref(summary.firstRecordNo()), ActivityRecord.ref(summary.lastRecordNo()));
	}
}
