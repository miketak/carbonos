package com.carbonos.user.internal;

import java.io.IOException;
import java.io.InputStream;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.carbonos.media.MediaNotFoundException;
import com.carbonos.media.MediaStorage;
import com.carbonos.media.MediaStorageException;
import com.carbonos.media.StoredMedia;

/**
 * Self-service profile operations for the logged-in user. Media lives in the
 * {@code media} module under a stable key ({@code users/<id>/avatar}), so
 * re-uploads overwrite in place and no orphan cleanup is needed.
 */
@Service
@Transactional
public class ProfileService {

	static final long MAX_AVATAR_BYTES = 5L * 1024 * 1024;

	private static final Set<FileType> AVATAR_TYPES = Set.of(FileType.PNG, FileType.JPEG, FileType.WEBP);

	private final UserRepository users;
	private final MediaStorage media;

	ProfileService(UserRepository users, MediaStorage media) {
		this.users = users;
		this.media = media;
	}

	@Transactional(readOnly = true)
	public User get(UUID userId) {
		return users.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
	}

	public User updateDisplayName(UUID userId, String displayName) {
		var user = get(userId);
		user.setDisplayName(displayName);
		return user;
	}

	public User storeAvatar(UUID userId, MultipartFile file) {
		var user = get(userId);
		var type = validate(file, AVATAR_TYPES, MAX_AVATAR_BYTES, "PNG, JPEG, or WebP image");
		var key = "users/" + userId + "/avatar";
		// store first: if the put fails, the transaction rolls back and the DB
		// never points at a missing object
		put(key, file, type);
		user.setAvatar(key, type.contentType());
		return user;
	}

	@Transactional(readOnly = true)
	public Download avatar(UUID userId) {
		var user = get(userId);
		if (user.getAvatarKey() == null) {
			throw new MediaNotFoundException("avatar");
		}
		return new Download(media.get(user.getAvatarKey()), user.getAvatarContentType());
	}

	public record Download(StoredMedia media, String contentType) {
	}

	private FileType validate(MultipartFile file, Set<FileType> allowed, long maxBytes, String expected) {
		if (file.isEmpty()) {
			throw new UnsupportedFileTypeException("The uploaded file is empty.");
		}
		if (file.getSize() > maxBytes) {
			throw new UnsupportedFileTypeException(
					"File is too large. Maximum size is " + (maxBytes / (1024 * 1024)) + " MB.");
		}
		// the servlet layer has spooled the upload, so this stream is re-readable
		try (InputStream content = file.getInputStream()) {
			return FileType.sniff(content)
				.filter(allowed::contains)
				.orElseThrow(() -> new UnsupportedFileTypeException("Unsupported file type. Upload a " + expected + "."));
		}
		catch (IOException e) {
			throw new MediaStorageException("Failed to read uploaded file", e);
		}
	}

	private void put(String key, MultipartFile file, FileType type) {
		// stream, never buffer
		try (InputStream content = file.getInputStream()) {
			media.put(key, content, file.getSize(), type.contentType());
		}
		catch (IOException e) {
			throw new MediaStorageException("Failed to read uploaded file", e);
		}
	}
}
