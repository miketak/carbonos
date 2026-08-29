package com.carbonos.media;

import java.io.InputStream;

public record StoredMedia(InputStream content, long contentLength, String contentType) {
}
