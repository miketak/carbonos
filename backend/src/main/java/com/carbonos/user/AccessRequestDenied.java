package com.carbonos.user;

import java.util.UUID;

/** Published when an admin denies an access request. */
public record AccessRequestDenied(UUID requestId, String email, String displayName) {
}
