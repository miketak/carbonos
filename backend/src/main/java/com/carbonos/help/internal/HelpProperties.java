package com.carbonos.help.internal;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * The help centre's settings (spec 09). {@code voterSalt} is bound to
 * {@code HELP_VOTER_SALT}; left empty, {@link VoterHash} picks a random salt
 * per boot and one vote per voter per article holds only until a restart.
 */
@ConfigurationProperties(prefix = "carbonos.help")
record HelpProperties(String voterSalt) {
}
