package com.carbonos.ghg.internal;

import java.util.List;

import org.springframework.stereotype.Component;

import com.carbonos.platform.PlatformSettings;
import com.carbonos.platform.PlatformSettings.EditionsInPublishedPeriods;

/**
 * Which inventories stand in the way of a factor pack edition that applies
 * inside their period (spec 02.6 rule 1, amended 2026-09-29). The import, the
 * adoption diff and the blast radius all ask here, so the three can never
 * disagree about what "locked" means.
 *
 * <p>FROZEN and FINAL always block: both can be reopened, and a final run's
 * factors must not shift under it. PUBLISHED blocks only while the platform
 * setting <em>Editions inside a published period</em> is BLOCKED, the default.
 * Under ALLOWED it does not, because a published run is a snapshot: its lines
 * and factor table hold the values it applied, and its report is stored as it
 * read at publication. A superseded inventory stays PUBLISHED, so it follows
 * the same rule.
 */
@Component
class EditionLock {

	private static final List<InventoryStatus> REOPENABLE = List.of(InventoryStatus.FROZEN, InventoryStatus.FINAL);

	private static final List<InventoryStatus> WITH_PUBLISHED = List.of(InventoryStatus.FROZEN,
			InventoryStatus.FINAL, InventoryStatus.PUBLISHED);

	private final PlatformSettings settings;

	EditionLock(PlatformSettings settings) {
		this.settings = settings;
	}

	/** The statuses whose period refuses an edition that applies inside it, under the setting in force. */
	List<InventoryStatus> lockedStatuses() {
		return publishedPeriodsBlock() ? WITH_PUBLISHED : REOPENABLE;
	}

	/** Whether a PUBLISHED period blocks today. */
	boolean publishedPeriodsBlock() {
		return settings.editionsInPublishedPeriods() != EditionsInPublishedPeriods.ALLOWED;
	}
}
