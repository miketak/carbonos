package com.carbonos.ghg.internal;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Turns on the scheduler for the support-access expiry sweep (spec 01.3). */
@Configuration
@EnableScheduling
class SchedulingConfig {
}
