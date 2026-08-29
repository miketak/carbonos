package com.carbonos.media.internal;

import java.net.URI;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * S3-compatible storage settings. {@code pathStyle} must be true for MinIO;
 * {@code region} is "auto" for Cloudflare R2. {@code createBucket} makes the
 * app provision the bucket at startup (local dev and tests only).
 */
@ConfigurationProperties(prefix = "carbonos.storage")
record StorageProperties(
		URI endpoint,
		String region,
		String accessKey,
		String secretKey,
		String bucket,
		boolean pathStyle,
		boolean createBucket) {
}
