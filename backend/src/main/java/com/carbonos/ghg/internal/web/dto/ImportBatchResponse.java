package com.carbonos.ghg.internal.web.dto;

import java.time.Instant;
import java.util.UUID;

import com.carbonos.ghg.internal.ImportBatch;

/** The file a CSV import came from (spec 04.6): kept with its digest for traceability. */
public record ImportBatchResponse(UUID id, String fileName, String sha256, int rowCount, long sizeBytes,
		String importedBy, Instant importedAt) {

	public static ImportBatchResponse from(ImportBatch batch) {
		return new ImportBatchResponse(batch.getId(), batch.getFileName(), batch.getSha256(), batch.getRowCount(),
				batch.getSizeBytes(), batch.getImportedBy(), batch.getImportedAt());
	}
}
