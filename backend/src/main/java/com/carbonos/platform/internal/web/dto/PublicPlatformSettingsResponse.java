package com.carbonos.platform.internal.web.dto;

/**
 * What any signed-in user may know about the deployment's policy (spec 01.5):
 * how long support access lasts. A client is entitled to know the window that
 * governs access to their own inventory; it is a control, not a secret.
 */
public record PublicPlatformSettingsResponse(int supportAccessWindowHours) {
}
