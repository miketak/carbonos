package com.carbonos.ghg.internal.web;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.carbonos.ghg.internal.BaseYearService;
import com.carbonos.ghg.internal.GhgRun;
import com.carbonos.ghg.internal.GhgRunLine;
import com.carbonos.ghg.internal.GhgService;
import com.carbonos.ghg.internal.Inventory;
import com.carbonos.ghg.internal.InventoryService;
import com.carbonos.ghg.internal.InventoryStatus;
import com.carbonos.ghg.internal.web.dto.AuditEventResponse;
import com.carbonos.ghg.internal.web.dto.ReportResponse;

import tools.jackson.databind.ObjectMapper;

/**
 * Assembles the Chapter 9 report composite for a run (spec 07.1), for the
 * page and the exports (spec 07.5). The final run of a published inventory
 * reads from the snapshot taken at publication, with what came after in a
 * block of its own (spec 05.3).
 */
@Component
public class ReportAssembler {

	private final InventoryService inventoryService;
	private final GhgService ghgService;
	private final BaseYearService baseYearService;
	private final ObjectMapper mapper;

	ReportAssembler(InventoryService inventoryService, GhgService ghgService, BaseYearService baseYearService,
			ObjectMapper mapper) {
		this.inventoryService = inventoryService;
		this.ghgService = ghgService;
		this.baseYearService = baseYearService;
		this.mapper = mapper;
	}

	@Transactional(readOnly = true)
	public ReportResponse assemble(UUID id) {
		var run = inventoryService.getRun(id);
		var inventory = inventoryService.get(run.getInventory().getId());
		var published = inventory.getStatus() == InventoryStatus.PUBLISHED && id.equals(inventory.getFinalRunId())
				&& inventory.getPublishedReport() != null;
		var report = published ? stored(inventory) : assembleLive(run, inventory);
		return report.withAfter(published ? sincePublication(inventory, run) : null, correction(inventory, run));
	}

	/** The report as it read at publication, pointing at whatever superseded it since (spec 05.3). */
	private ReportResponse stored(Inventory inventory) {
		var snapshot = mapper.readValue(inventory.getPublishedReport(), ReportResponse.class);
		var successor = inventory.getSupersededById() == null ? null
				: inventoryService.get(inventory.getSupersededById());
		return snapshot.withSupersededBy(successor == null ? null : successor.getId(),
				successor == null ? null : successor.getName());
	}

	/** Keeps the final run's report as it reads at publication (spec 05.3). */
	@Transactional
	public void snapshotPublished(UUID inventoryId, UUID finalRunId) {
		var run = inventoryService.getRun(finalRunId);
		var inventory = inventoryService.get(inventoryId);
		var report = assembleLive(run, inventory);
		inventoryService.storePublishedReport(inventoryId, mapper.writeValueAsString(report));
	}

	private ReportResponse assembleLive(GhgRun run, Inventory inventory) {
		var organization = ghgService.getOrganization(inventory.getOrganization().getId());
		var version = run.getBoundaryVersionId() == null ? null
				: inventoryService.getBoundaryVersion(run.getBoundaryVersionId());
		var baseYear = baseYearService.find(organization.getId()).orElse(null);
		var baseRun = baseYear == null || baseYear.getInventory().getFinalRunId() == null ? null
				: inventoryService.getRun(baseYear.getInventory().getFinalRunId());
		var recalculatedRuns = baseYear == null ? Map.<UUID, GhgRun>of()
				: baseYear.getRecalculations()
					.stream()
					.filter(r -> r.getRunId() != null)
					.collect(java.util.stream.Collectors.toMap(r -> r.getRunId(),
							r -> inventoryService.getRun(r.getRunId()), (a, b) -> a));
		var profile = baseYear == null ? new BaseYearService.Profile(List.of(), List.of())
				: baseYearService.profile(baseYear, run.getPeriodEnd());
		var successor = inventory.getSupersededById() == null ? null
				: inventoryService.get(inventory.getSupersededById());
		return ReportResponse.of(run, inventory, organization, version, baseYear, baseRun, recalculatedRuns, profile,
				inventoryService.marketFactors(inventory.getId()), inventoryService.predecessors(inventory.getId()),
				successor, inventoryService.intensityMetrics(inventory.getId()));
	}

	/** Later acts, later inventories and facts that changed since the run was published (spec 05.3). */
	private ReportResponse.SincePublication sincePublication(Inventory inventory, GhgRun run) {
		var publishedAt = inventory.getPublishedAt();
		// the PUBLISHED act itself is the moment of publication, not something that came after it
		var events = inventoryService.events(inventory.getId())
			.stream()
			.filter(event -> event.getAction() != com.carbonos.ghg.internal.GhgAuditEvent.Action.PUBLISHED)
			.filter(event -> publishedAt == null || event.getCreatedAt().isAfter(publishedAt))
			.map(AuditEventResponse::from)
			.toList();
		var later = inventoryService.list(inventory.getOrganization().getId())
			.stream()
			.filter(other -> !other.getId().equals(inventory.getId()) && other.getCreatedAt() != null
					&& publishedAt != null && other.getCreatedAt().isAfter(publishedAt))
			.map(other -> new ReportResponse.LaterInventory(other.getId(), other.getName(), other.periodLabel(),
					other.getStatus()))
			.toList();
		var changed = new ArrayList<ReportResponse.ChangedRecord>();
		var facts = inventoryService.publishedFacts(inventory);
		var live = new HashMap<UUID, com.carbonos.ghg.internal.ActivityRecord>();
		for (var assignment : inventoryService.listAssignments(inventory.getId())) {
			live.put(assignment.getActivity().getId(), assignment.getActivity());
		}
		facts.forEach((activityId, fact) -> {
			var activity = live.get(activityId);
			if (activity == null) {
				return;
			}
			if (activity.isDeleted()) {
				changed.add(new ReportResponse.ChangedRecord(activityId, fact.activityType(), "removed", "on file",
						"removed: " + activity.getDeleteReason()));
				return;
			}
			if (fact.quantity().compareTo(activity.getQuantity()) != 0) {
				changed.add(new ReportResponse.ChangedRecord(activityId, fact.activityType(), "quantity",
						plain(fact.quantity()), plain(activity.getQuantity())));
			}
			if (!fact.unit().equalsIgnoreCase(activity.getUnit())) {
				changed.add(new ReportResponse.ChangedRecord(activityId, fact.activityType(), "unit", fact.unit(),
						activity.getUnit()));
			}
			if (!fact.periodStart().equals(activity.getPeriodStart()) || !fact.periodEnd().equals(activity.getPeriodEnd())) {
				changed.add(new ReportResponse.ChangedRecord(activityId, fact.activityType(), "period",
						fact.periodStart() + " to " + fact.periodEnd(),
						activity.getPeriodStart() + " to " + activity.getPeriodEnd()));
			}
			if (!fact.activityType().equals(activity.getActivityType())) {
				changed.add(new ReportResponse.ChangedRecord(activityId, fact.activityType(), "activityType",
						fact.activityType(), activity.getActivityType()));
			}
		});
		return new ReportResponse.SincePublication(events, later, List.copyOf(changed));
	}

	/** How a correction's run differs from the published run it restates (spec 05.3). */
	private ReportResponse.Correction correction(Inventory inventory, GhgRun run) {
		if (inventory.getCorrectionReason() == null || inventory.getCopiedFromId() == null) {
			return null;
		}
		var predecessor = inventoryService.get(inventory.getCopiedFromId());
		var publishedRun = predecessor.getFinalRunId() == null ? null
				: inventoryService.getRun(predecessor.getFinalRunId());
		var before = new HashMap<UUID, BigDecimal>();
		if (publishedRun != null) {
			for (var line : publishedRun.getLines()) {
				before.merge(line.getActivityId(), line.getKgCo2e(), BigDecimal::add);
			}
		}
		var after = new HashMap<UUID, BigDecimal>();
		for (GhgRunLine line : run.getLines()) {
			after.merge(line.getActivityId(), line.getKgCo2e(), BigDecimal::add);
		}
		int added = 0;
		int changed = 0;
		for (var entry : after.entrySet()) {
			var was = before.get(entry.getKey());
			if (was == null) {
				added++;
			}
			else if (was.compareTo(entry.getValue()) != 0) {
				changed++;
			}
		}
		int removed = (int) before.keySet().stream().filter(id -> !after.containsKey(id)).count();
		var delta = run.getTotalKgCo2e().subtract(publishedRun == null ? BigDecimal.ZERO : publishedRun.getTotalKgCo2e());
		return new ReportResponse.Correction(predecessor.getId(), predecessor.getName(), inventory.getCorrectionReason(),
				publishedRun == null ? null : publishedRun.getId(), added, removed, changed, delta,
				delta.movePointLeft(3).setScale(3, java.math.RoundingMode.HALF_UP));
	}

	private static String plain(BigDecimal value) {
		return Objects.requireNonNull(value).stripTrailingZeros().toPlainString();
	}
}
