package com.carbonos.mail.internal;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

import com.carbonos.user.AccessRequestApproved;
import com.carbonos.user.AccessRequestDenied;

/** Turns access-request decisions into plain-text emails (spec 01.1). */
@Component
class AccessRequestEmails {

	private static final Logger log = LoggerFactory.getLogger(AccessRequestEmails.class);

	private final JavaMailSender mailSender;
	private final String from;
	private final String appBaseUrl;

	AccessRequestEmails(JavaMailSender mailSender, @Value("${carbonos.mail.from}") String from,
			@Value("${carbonos.app.base-url}") String appBaseUrl) {
		this.mailSender = mailSender;
		this.from = from;
		this.appBaseUrl = appBaseUrl;
	}

	@ApplicationModuleListener
	void on(AccessRequestApproved event) {
		send(event.email(), "Your CarbonOS access is approved", """
				Hello %s,

				Your request for CarbonOS access has been approved.
				Set your password to activate your account (the link is valid for 7 days):

				%s/set-password?token=%s

				Measure. Certify. Sustain.
				— The ECORIV team
				""".formatted(event.displayName(), appBaseUrl, event.setupToken()));
	}

	@ApplicationModuleListener
	void on(AccessRequestDenied event) {
		send(event.email(), "Your CarbonOS access request", """
				Hello %s,

				Thank you for your interest in CarbonOS. After review, we are unable
				to grant access at this time. You are welcome to request access again
				in the future.

				— The ECORIV team
				""".formatted(event.displayName()));
	}

	private void send(String to, String subject, String body) {
		var message = new SimpleMailMessage();
		message.setFrom(from);
		message.setTo(to);
		message.setSubject(subject);
		message.setText(body);
		mailSender.send(message);
		log.info("Sent '{}' to {}", subject, to);
	}
}
