package com.carbonos.ghg.internal;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

/**
 * The completeness of a record for review (spec 04.6), stated once in Java
 * and once as a Criteria predicate for the register's filter and counts. The
 * two must agree: {@code ActivityReadinessTests} checks the Java rule and the
 * integration test checks that page counts equal the statuses of the items.
 * Readiness reflects completeness, not assurance.
 */
public record ActivityReadiness(ActivityStatus status, List<Issue> issues) {

	/** What a record still lacks. {@link #EVIDENCE_REFERENCE_ONLY} is informational and leaves the status alone. */
	public enum Issue {
		MISSING_QUANTITY, MISSING_UNIT, MISSING_PERIOD, NO_STREAM, NO_DATA_SOURCE, NO_EVIDENCE, EVIDENCE_REFERENCE_ONLY;

		public boolean blocksReadiness() {
			return this != EVIDENCE_REFERENCE_ONLY;
		}
	}

	public static ActivityReadiness of(ActivityRecord record, boolean hasAttachedEvidence) {
		var issues = new ArrayList<Issue>();
		if (record.getQuantity() == null) {
			issues.add(Issue.MISSING_QUANTITY);
		}
		if (record.getUnit() == null || record.getUnit().isBlank()) {
			issues.add(Issue.MISSING_UNIT);
		}
		if (record.getPeriodStart() == null || record.getPeriodEnd() == null) {
			issues.add(Issue.MISSING_PERIOD);
		}
		if (record.getStream() == null) {
			issues.add(Issue.NO_STREAM);
		}
		if (record.getDataSource() == null || record.getDataSource().isBlank()) {
			issues.add(Issue.NO_DATA_SOURCE);
		}
		var hasReference = record.getEvidenceRef() != null && !record.getEvidenceRef().isBlank();
		if (!hasReference && !hasAttachedEvidence) {
			issues.add(Issue.NO_EVIDENCE);
		}
		else if (!hasAttachedEvidence) {
			issues.add(Issue.EVIDENCE_REFERENCE_ONLY);
		}
		var blocking = issues.stream().anyMatch(Issue::blocksReadiness);
		var status = record.isDraft() ? ActivityStatus.DRAFT
				: blocking ? ActivityStatus.NEEDS_ATTENTION : ActivityStatus.READY;
		return new ActivityReadiness(status, List.copyOf(issues));
	}

	public boolean isReady() {
		return status == ActivityStatus.READY;
	}

	/** The Criteria form of {@link #of}: the records the register lists under a status. */
	static Predicate forStatus(ActivityStatus status, Root<ActivityRecord> root, CriteriaQuery<?> query,
			CriteriaBuilder cb) {
		return switch (status) {
			case READY -> ready(root, query, cb);
			case NEEDS_ATTENTION -> cb.not(ready(root, query, cb));
			case DRAFT -> cb.isTrue(root.get("draft"));
		};
	}

	static Predicate ready(Root<ActivityRecord> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		var attached = query.subquery(Integer.class);
		var evidence = attached.from(Evidence.class);
		attached.select(cb.literal(1)).where(cb.equal(evidence.get("activityId"), root.get("id")));
		return cb.and(cb.isFalse(root.get("draft")), cb.isNotNull(root.get("quantity")),
				cb.isNotNull(root.get("unit")), cb.isNotNull(root.get("periodStart")),
				cb.isNotNull(root.get("periodEnd")), cb.isNotNull(root.get("stream")),
				cb.isNotNull(root.get("dataSource")),
				cb.or(cb.isNotNull(root.get("evidenceRef")), cb.exists(attached)));
	}
}
