package com.carbonos.platform.internal;

import org.springframework.data.jpa.repository.JpaRepository;

/** The settings singleton (spec 01.5). */
public interface PlatformSettingsRepository extends JpaRepository<PlatformSettingsRow, Integer> {

}
