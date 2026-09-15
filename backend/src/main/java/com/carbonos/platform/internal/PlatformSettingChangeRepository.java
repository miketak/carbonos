package com.carbonos.platform.internal;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

/** The append-only settings history (spec 01.5), newest first. */
public interface PlatformSettingChangeRepository extends JpaRepository<PlatformSettingChange, UUID> {

	List<PlatformSettingChange> findAllByOrderByChangedAtDesc();
}
