package com.carbonos.media.internal;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;

/**
 * Creates the configured bucket at startup when {@code carbonos.storage.create-bucket}
 * is set — used against local MinIO (dev and Testcontainers). Production buckets
 * (R2/Railway) are provisioned out of band and leave this off.
 */
@Component
class BucketInitializer implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(BucketInitializer.class);

	private final S3Client s3;
	private final StorageProperties props;

	BucketInitializer(S3Client s3, StorageProperties props) {
		this.s3 = s3;
		this.props = props;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (!props.createBucket()) {
			return;
		}
		try {
			s3.headBucket(request -> request.bucket(props.bucket()));
		}
		catch (NoSuchBucketException e) {
			s3.createBucket(request -> request.bucket(props.bucket()));
			log.info("Created storage bucket '{}'", props.bucket());
		}
	}
}
