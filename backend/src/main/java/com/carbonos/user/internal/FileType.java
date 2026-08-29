package com.carbonos.user.internal;

import java.io.IOException;
import java.io.InputStream;
import java.util.Optional;

/**
 * File types accepted for profile media, detected by magic bytes rather than
 * the client-supplied Content-Type. Sniffing proves the container format, not
 * safety (a polyglot file still passes); acceptable because files are only
 * ever served back under the server-chosen content type.
 */
enum FileType {

	PNG("image/png"),
	JPEG("image/jpeg"),
	WEBP("image/webp"),
	PDF("application/pdf"),
	PSD("image/vnd.adobe.photoshop");

	private final String contentType;

	FileType(String contentType) {
		this.contentType = contentType;
	}

	String contentType() {
		return contentType;
	}

	static Optional<FileType> sniff(InputStream content) throws IOException {
		byte[] prefix = content.readNBytes(12);
		if (startsWith(prefix, 0x89, 'P', 'N', 'G')) {
			return Optional.of(PNG);
		}
		if (startsWith(prefix, 0xFF, 0xD8, 0xFF)) {
			return Optional.of(JPEG);
		}
		if (startsWith(prefix, 'R', 'I', 'F', 'F') && matchesAt(prefix, 8, 'W', 'E', 'B', 'P')) {
			return Optional.of(WEBP);
		}
		if (startsWith(prefix, '%', 'P', 'D', 'F')) {
			return Optional.of(PDF);
		}
		if (startsWith(prefix, '8', 'B', 'P', 'S')) {
			return Optional.of(PSD);
		}
		return Optional.empty();
	}

	private static boolean startsWith(byte[] bytes, int... expected) {
		return matchesAt(bytes, 0, expected);
	}

	private static boolean matchesAt(byte[] bytes, int offset, int... expected) {
		if (bytes.length < offset + expected.length) {
			return false;
		}
		for (int i = 0; i < expected.length; i++) {
			if ((bytes[offset + i] & 0xFF) != expected[i]) {
				return false;
			}
		}
		return true;
	}
}
