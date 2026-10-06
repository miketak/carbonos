package com.carbonos.ghg.internal.web.dto;

import java.util.UUID;

/** The inventory's named preparer and approver (spec 05.8); a null clears that part. */
public record SignOffRequest(UUID preparerUserId, UUID approverUserId) {
}
