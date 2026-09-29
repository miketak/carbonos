package com.carbonos.user.internal;

import org.springframework.context.annotation.Configuration;
import org.springframework.modulith.events.CompletedEventPublications;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import com.carbonos.user.PasswordResetRequested;

/**
 * The reset link's raw token reaches the mail module inside
 * {@link PasswordResetRequested}, and the event registry stores the event
 * as it goes (spec 01.9). Once the email is sent, the publication is
 * completed and this sweep deletes it every minute, so the only lasting copy
 * of a token is its hash. An unsent one stays for the retry, and the link it
 * carries dies with its hour anyway. Enables scheduling for this module, as
 * {@code help} and {@code ghg} do for theirs.
 */
@Configuration
@EnableScheduling
class PasswordResetPublicationSweep {

	private final CompletedEventPublications completed;

	PasswordResetPublicationSweep(CompletedEventPublications completed) {
		this.completed = completed;
	}

	@Scheduled(fixedDelayString = "PT1M", initialDelayString = "PT1M")
	void sweep() {
		completed.deletePublications(publication -> publication.getEvent() instanceof PasswordResetRequested);
	}
}
