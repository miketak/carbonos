package com.carbonos.media;

import org.springframework.http.HttpStatus;
import org.springframework.web.ErrorResponseException;

public class MediaNotFoundException extends ErrorResponseException {

	public MediaNotFoundException(String key) {
		super(HttpStatus.NOT_FOUND);
		setTitle("Media not found");
		setDetail("No stored file at '" + key + "'.");
	}
}
