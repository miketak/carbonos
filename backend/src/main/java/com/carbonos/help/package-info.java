/**
 * The help centre's measurements (spec 09): whether an article helped, which
 * searches found nothing, and the administrator's view of both. Owns the
 * {@code help_feedback}, {@code help_search_misses} and
 * {@code help_search_days} tables.
 * <p>
 * The module depends on nothing but {@code shared} and nothing depends on
 * it; {@code ModularityTests} asserts the first half. The help content itself
 * lives in the frontend, so there is no public API here: the public endpoints
 * are the module's whole surface.
 */
package com.carbonos.help;
