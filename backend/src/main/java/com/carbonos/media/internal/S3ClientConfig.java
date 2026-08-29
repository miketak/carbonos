package com.carbonos.media.internal;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(StorageProperties.class)
class S3ClientConfig {

	@Bean
	S3Client s3Client(StorageProperties props) {
		return S3Client.builder()
				.endpointOverride(props.endpoint())
				.region(Region.of(props.region()))
				.credentialsProvider(StaticCredentialsProvider
						.create(AwsBasicCredentials.create(props.accessKey(), props.secretKey())))
				.forcePathStyle(props.pathStyle())
				.build();
	}
}
