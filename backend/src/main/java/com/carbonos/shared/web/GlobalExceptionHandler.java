package com.carbonos.shared.web;

import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Global error handling. Spring MVC exceptions are translated to RFC 9457
 * Problem Details by the {@link ResponseEntityExceptionHandler} base class;
 * anything unhandled becomes an opaque 500 so internals never leak.
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	/**
	 * Bean-validation failures become a 422 problem detail with a
	 * {@code errors} map of field → message, which clients render inline.
	 */
	@Override
	protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
			HttpHeaders headers, org.springframework.http.HttpStatusCode status, WebRequest request) {
		var problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, "Validation failed.");
		problem.setTitle("Invalid request");
		Map<String, String> errors = new LinkedHashMap<>();
		for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
			errors.putIfAbsent(fieldError.getField(), fieldError.getDefaultMessage());
		}
		problem.setProperty("errors", errors);
		return handleExceptionInternal(ex, problem, headers, HttpStatus.UNPROCESSABLE_ENTITY, request);
	}

	/**
	 * Oversized uploads are rejected by the servlet layer before the controller
	 * runs; give the 413 a detail and an {@code errors.file} entry the SPA can
	 * render inline.
	 */
	@Override
	protected ResponseEntity<Object> handleMaxUploadSizeExceededException(MaxUploadSizeExceededException ex,
			HttpHeaders headers, org.springframework.http.HttpStatusCode status, WebRequest request) {
		var message = "File is too large.";
		var problem = ProblemDetail.forStatusAndDetail(HttpStatus.PAYLOAD_TOO_LARGE, message);
		problem.setTitle("File too large");
		problem.setProperty("errors", Map.of("file", message));
		return handleExceptionInternal(ex, problem, headers, HttpStatus.PAYLOAD_TOO_LARGE, request);
	}

	@ExceptionHandler(Exception.class)
	ProblemDetail handleUnexpected(Exception ex) {
		log.error("Unhandled exception", ex);
		return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred.");
	}
}
