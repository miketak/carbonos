package com.carbonos.mail.internal;

import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;

import com.carbonos.user.PasswordChanged;
import com.carbonos.user.PasswordResetRequested;

/** The reset link and the notice that a password changed (spec 01.9), as plain-text emails. */
@Component
class PasswordEmails {

	private static final Logger log = LoggerFactory.getLogger(PasswordEmails.class);

	private static final DateTimeFormatter WHEN = DateTimeFormatter
		.ofPattern("d MMMM yyyy 'at' HH:mm 'UTC'", Locale.ENGLISH)
		.withZone(ZoneOffset.UTC);

	private final JavaMailSender mailSender;
	private final String from;
	private final String appBaseUrl;

	PasswordEmails(JavaMailSender mailSender, @Value("${carbonos.mail.from}") String from,
			@Value("${carbonos.app.base-url}") String appBaseUrl) {
		this.mailSender = mailSender;
		this.from = from;
		this.appBaseUrl = appBaseUrl;
	}

	@ApplicationModuleListener
	void on(PasswordResetRequested event) {
		var who = event.sentByAdministrator() ? "A CarbonOS administrator sent you this link"
				: "Somebody, probably you, asked to reset your password";
		send(event.email(), "Reset your CarbonOS password", """
				Hello %s,

				%s. Choose a new password here
				(the link is valid for %d hour and works once):

				%s/reset-password?token=%s

				If you did not expect this email, ignore it: your password stays as it is.

				The ECORIV team
				""".formatted(event.displayName(), who, event.validFor().toHours(), appBaseUrl, event.token()));
	}

	@ApplicationModuleListener
	void on(PasswordChanged event) {
		var how = switch (event.how()) {
			case CHANGED_ON_PROFILE -> "from your profile";
			case RESET_BY_LINK -> "with a password reset link";
		};
		send(event.email(), "Your CarbonOS password was changed", """
				Hello %s,

				The password of your CarbonOS account was changed on %s, %s.
				Every other signed-in session of your account has been signed out.

				If you did not do this, reset your password now at %s/forgot-password
				and tell your CarbonOS administrator.

				The ECORIV team
				""".formatted(event.displayName(), WHEN.format(event.at()), how, appBaseUrl));
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
