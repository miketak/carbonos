/**
 * Deployment-wide policy the platform operator sets in the administration
 * panel (spec 01.5): how long support access lasts, and who may create a
 * reporting organization. Owns the {@code platform_settings} singleton and
 * the append-only {@code platform_setting_changes} log behind it.
 * <p>
 * The module must never depend on {@code ghg}. {@code ghg} reads these
 * settings, so anything read back from it would be a cycle and
 * {@code ModularityTests} would fail. It takes only
 * {@link com.carbonos.user.AuthenticatedUser} from {@code user}, which
 * depends on nothing, to record who changed a setting.
 * <p>
 * Public API: {@link com.carbonos.platform.PlatformSettings}.
 */
package com.carbonos.platform;
