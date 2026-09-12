package com.carbonos.ghg.internal;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * One correction of an activity record, its removal (spec 04.4) or its entry
 * from a draft (spec 04.6): who, when, why, and each field's old and new value. Facts are corrected in place
 * (CORRECT-01); this is the history the in-place edit would otherwise lose.
 */
@Entity
@Table(name = "ghg_activity_revisions")
public class ActivityRevision {

	public enum Kind {
		CORRECTED, REMOVED,
		/** A draft entered as a fact (spec 04.6): who entered the figures, and what they were. */
		ENTERED
	}

	@Id
	private UUID id;

	@Column(name = "activity_id", nullable = false)
	private UUID activityId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 12)
	private Kind kind;

	@Column(nullable = false, length = 500)
	private String reason;

	// "field|before|after" lines; a value is empty when it was absent
	@Column(nullable = false, columnDefinition = "text")
	private String changes;

	@Column(name = "changed_by_user_id")
	private UUID changedByUserId;

	@Column(name = "changed_by", nullable = false, length = 320)
	private String changedBy;

	@CreationTimestamp
	@Column(name = "changed_at", nullable = false, updatable = false)
	private Instant changedAt;

	protected ActivityRevision() {
	}

	ActivityRevision(UUID activityId, Kind kind, String reason, List<ActivityRecord.Change> changes,
			UUID changedByUserId, String changedBy) {
		this.id = UUID.randomUUID();
		this.activityId = activityId;
		this.kind = kind;
		this.reason = reason;
		this.changes = changes.stream()
			.map(change -> escape(change.field()) + "|" + escape(change.before()) + "|" + escape(change.after()))
			.reduce((a, b) -> a + "\n" + b)
			.orElse("");
		this.changedByUserId = changedByUserId;
		this.changedBy = changedBy;
	}

	private static String escape(String value) {
		return value == null ? "" : value.replace("\\", "\\\\").replace("|", "\\|").replace("\n", "\\n");
	}

	private static String unescape(String value) {
		var out = new StringBuilder();
		for (int i = 0; i < value.length(); i++) {
			var c = value.charAt(i);
			if (c == '\\' && i + 1 < value.length()) {
				var next = value.charAt(++i);
				out.append(next == 'n' ? '\n' : next);
			}
			else {
				out.append(c);
			}
		}
		return out.toString();
	}

	private static List<String> split(String line) {
		var parts = new java.util.ArrayList<String>();
		var current = new StringBuilder();
		for (int i = 0; i < line.length(); i++) {
			var c = line.charAt(i);
			if (c == '\\' && i + 1 < line.length()) {
				current.append(c).append(line.charAt(++i));
			}
			else if (c == '|') {
				parts.add(current.toString());
				current.setLength(0);
			}
			else {
				current.append(c);
			}
		}
		parts.add(current.toString());
		return parts;
	}

	public UUID getId() {
		return id;
	}

	public UUID getActivityId() {
		return activityId;
	}

	public Kind getKind() {
		return kind;
	}

	public String getReason() {
		return reason;
	}

	public List<ActivityRecord.Change> getChanges() {
		if (changes.isBlank()) {
			return List.of();
		}
		return changes.lines().map(line -> {
			var parts = split(line);
			return new ActivityRecord.Change(unescape(parts.get(0)),
					parts.get(1).isEmpty() ? null : unescape(parts.get(1)),
					parts.get(2).isEmpty() ? null : unescape(parts.get(2)));
		}).toList();
	}

	public UUID getChangedByUserId() {
		return changedByUserId;
	}

	public String getChangedBy() {
		return changedBy;
	}

	public Instant getChangedAt() {
		return changedAt;
	}
}
