package com.carbonos.media.internal;

import java.io.InputStream;
import java.util.Optional;

import org.springframework.stereotype.Component;

import com.carbonos.media.MediaMetadata;
import com.carbonos.media.MediaNotFoundException;
import com.carbonos.media.MediaStorage;
import com.carbonos.media.MediaStorageException;
import com.carbonos.media.StoredMedia;

import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;

@Component
class S3MediaStorage implements MediaStorage {

	private final S3Client s3;
	private final StorageProperties props;

	S3MediaStorage(S3Client s3, StorageProperties props) {
		this.s3 = s3;
		this.props = props;
	}

	@Override
	public void put(String key, InputStream content, long contentLength, String contentType) {
		try {
			s3.putObject(request -> request.bucket(props.bucket()).key(key).contentType(contentType),
					RequestBody.fromInputStream(content, contentLength));
		}
		catch (SdkException e) {
			throw new MediaStorageException("Failed to store object '" + key + "'", e);
		}
	}

	@Override
	public StoredMedia get(String key) {
		try {
			ResponseInputStream<GetObjectResponse> object = s3
					.getObject(GetObjectRequest.builder().bucket(props.bucket()).key(key).build());
			GetObjectResponse response = object.response();
			return new StoredMedia(object, response.contentLength(), response.contentType());
		}
		catch (NoSuchKeyException e) {
			throw new MediaNotFoundException(key);
		}
		catch (SdkException e) {
			throw new MediaStorageException("Failed to read object '" + key + "'", e);
		}
	}

	@Override
	public Optional<MediaMetadata> head(String key) {
		try {
			HeadObjectResponse response = s3.headObject(request -> request.bucket(props.bucket()).key(key));
			return Optional.of(new MediaMetadata(response.contentLength(), response.contentType()));
		}
		catch (NoSuchKeyException e) {
			return Optional.empty();
		}
		catch (SdkException e) {
			throw new MediaStorageException("Failed to inspect object '" + key + "'", e);
		}
	}

	@Override
	public void delete(String key) {
		try {
			s3.deleteObject(request -> request.bucket(props.bucket()).key(key));
		}
		catch (SdkException e) {
			throw new MediaStorageException("Failed to delete object '" + key + "'", e);
		}
	}
}
