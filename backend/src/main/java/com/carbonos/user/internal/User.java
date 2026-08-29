package com.carbonos.user.internal;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {

	@Id
	private UUID id;

	@Column(nullable = false, unique = true, length = 320)
	private String email;

	@Column(name = "display_name", nullable = false, length = 100)
	private String displayName;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private UserRole role;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private UserStatus status;

	@Column(name = "password_hash", nullable = false, length = 100)
	private String passwordHash;

	@Column(name = "avatar_key", length = 255)
	private String avatarKey;

	@Column(name = "avatar_content_type", length = 100)
	private String avatarContentType;

	@Column(name = "resume_key", length = 255)
	private String resumeKey;

	@Column(name = "resume_content_type", length = 100)
	private String resumeContentType;

	@Column(name = "resume_filename", length = 255)
	private String resumeFilename;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected User() {
	}

	User(String email, String displayName, UserRole role, String passwordHash) {
		this.id = UUID.randomUUID();
		this.email = email;
		this.displayName = displayName;
		this.role = role;
		this.status = UserStatus.ACTIVE;
		this.passwordHash = passwordHash;
	}

	public UUID getId() {
		return id;
	}

	public String getEmail() {
		return email;
	}

	public String getDisplayName() {
		return displayName;
	}

	public UserRole getRole() {
		return role;
	}

	public UserStatus getStatus() {
		return status;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public String getAvatarKey() {
		return avatarKey;
	}

	public String getAvatarContentType() {
		return avatarContentType;
	}

	public String getResumeKey() {
		return resumeKey;
	}

	public String getResumeContentType() {
		return resumeContentType;
	}

	public String getResumeFilename() {
		return resumeFilename;
	}

	void setDisplayName(String displayName) {
		this.displayName = displayName;
	}

	void setAvatar(String key, String contentType) {
		this.avatarKey = key;
		this.avatarContentType = contentType;
	}

	void setResume(String key, String contentType, String filename) {
		this.resumeKey = key;
		this.resumeContentType = contentType;
		this.resumeFilename = filename;
	}

	void setRole(UserRole role) {
		this.role = role;
	}

	void setStatus(UserStatus status) {
		this.status = status;
	}
}
