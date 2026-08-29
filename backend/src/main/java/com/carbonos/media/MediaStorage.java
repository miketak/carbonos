package com.carbonos.media;

import java.io.InputStream;
import java.util.Optional;

/**
 * Streams binary objects to and from the configured object store. Keys are
 * plain paths (e.g. {@code users/<id>/avatar}); writing an existing key
 * overwrites it.
 */
public interface MediaStorage {

	/**
	 * Stores (or overwrites) the object at {@code key}. Streams the content;
	 * the caller supplies the exact length up front.
	 */
	void put(String key, InputStream content, long contentLength, String contentType);

	/**
	 * Streams the object back. The caller must close {@link StoredMedia#content()}
	 * (or hand it to Spring as a resource, which closes it after writing).
	 *
	 * @throws MediaNotFoundException if no object exists at {@code key}
	 */
	StoredMedia get(String key);

	Optional<MediaMetadata> head(String key);

	void delete(String key);
}
