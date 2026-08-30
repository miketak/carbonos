package com.carbonos.user.internal;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

class AccessRequestNotFoundException extends ErrorResponseException {

	AccessRequestNotFoundException(UUID id) {
		super(HttpStatus.NOT_FOUND);
		setTitle("Access request not found");
		setDetail("No access request with id '" + id + "'.");
	}
}
