package com.carbonos.ghg.internal.web.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.carbonos.ghg.internal.ActivityRevision;

/** One correction or the removal of a record: who, when, why, and each field's old and new value (spec 04.4). */
public record ActivityRevisionResponse(UUID id, ActivityRevision.Kind kind, String reason, List<Change> changes,
		String changedBy, Instant changedAt) {

	public record Change(String field, String before, String after) {
	}

	public static ActivityRevisionResponse from(ActivityRevision revision) {
		return new ActivityRevisionResponse(revision.getId(), revision.getKind(), revision.getReason(),
				revision.getChanges().stream().map(c -> new Change(c.field(), c.before(), c.after())).toList(),
				revision.getChangedBy(), revision.getChangedAt());
	}
}
