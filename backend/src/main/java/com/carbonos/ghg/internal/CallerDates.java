package com.carbonos.ghg.internal;

import java.time.format.DateTimeFormatter;

import org.springframework.stereotype.Component;

import com.carbonos.user.UserDirectory;

/**
 * The date form the signed-in account reads (spec 01.10), for the files a
 * person downloads: day first, month first, or ISO while no choice is made.
 */
@Component
public class CallerDates {

	private static final DateTimeFormatter DAY_FIRST = DateTimeFormatter.ofPattern("dd/MM/yyyy");

	private static final DateTimeFormatter MONTH_FIRST = DateTimeFormatter.ofPattern("MM/dd/yyyy");

	private final GhgAccess access;
	private final UserDirectory users;

	CallerDates(GhgAccess access, UserDirectory users) {
		this.access = access;
		this.users = users;
	}

	public DateTimeFormatter formatter() {
		return formatterFor(users.findById(access.currentUserId()).map(UserDirectory.UserSummary::dateFormat).orElse(null));
	}

	/** {@code DMY}, {@code MDY}, or anything else (including null) for ISO. */
	public static DateTimeFormatter formatterFor(String dateFormat) {
		if ("DMY".equals(dateFormat)) {
			return DAY_FIRST;
		}
		if ("MDY".equals(dateFormat)) {
			return MONTH_FIRST;
		}
		return DateTimeFormatter.ISO_LOCAL_DATE;
	}
}
