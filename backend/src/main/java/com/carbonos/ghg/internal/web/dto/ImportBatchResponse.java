package com.carbonos.ghg.internal.web.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.carbonos.ghg.internal.ActivityRecord;
import com.carbonos.ghg.internal.EvidenceService;
import com.carbonos.ghg.internal.ImportDecision;

/**
 * The file an import came from (spec 04.6): kept with its digest for
 * traceability, with the records it produced; since spec 04.11 also which reader
 * parsed it, whether the table as read is kept beside it, how many emission
 * sources it created and each decision on an unknown source name.
 */
public record ImportBatchResponse(UUID id, String fileName, String sha256, int rowCount, long sizeBytes,
		String importedBy, Instant importedAt, String firstRecordRef, String lastRecordRef, String parser,
		boolean renderedAvailable, int sourcesCreated, List<Decision> decisions) {

	public record Decision(String name, String facility, ImportDecision.Kind kind, String streamName,
			List<Integer> rows, String reason, String decidedBy, Instant decidedAt) {
	}

	public static ImportBatchResponse from(EvidenceService.BatchSummary summary) {
		var batch = summary.batch();
		return new ImportBatchResponse(batch.getId(), batch.getFileName(), batch.getSha256(), batch.getRowCount(),
				batch.getSizeBytes(), batch.getImportedBy(), batch.getImportedAt(),
				ActivityRecord.ref(summary.firstRecordNo()), ActivityRecord.ref(summary.lastRecordNo()),
				batch.getParser(), batch.getRenderedStorageKey() != null, batch.getSourcesCreated(),
				summary.decisions()
					.stream()
					.map(d -> new Decision(d.decision().getTypedName(), d.facilityName(), d.decision().getKind(),
							d.streamName(), d.decision().getRows(), d.decision().getReason(),
							d.decision().getDecidedBy(), d.decision().getDecidedAt()))
					.toList());
	}
}
