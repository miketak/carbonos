package com.carbonos.help.internal;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Turns on the scheduler for the nightly retention job and the rate
 * limiter's sweep (spec 09). {@code ghg} enables scheduling too; a second
 * {@code @EnableScheduling} registers the same processor once more, which is
 * harmless, and it keeps this module from leaning on another for its timer.
 */
@Configuration
@EnableScheduling
class HelpSchedulingConfig {
}
