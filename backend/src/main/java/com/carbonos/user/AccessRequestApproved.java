package com.carbonos.user;

import java.util.UUID;

/** Published when an admin approves an access request; the token builds the setup link. */
public record AccessRequestApproved(UUID requestId, String email, String displayName, String setupToken) {
}
