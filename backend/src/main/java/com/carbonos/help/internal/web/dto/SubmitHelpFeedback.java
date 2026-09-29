package com.carbonos.help.internal.web.dto;

import com.carbonos.help.internal.HelpFeedbackReason;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/**
 * A vote on an article (spec 09). The slug's shape is checked here so a
 * malformed one never reaches the service; the rules that cross fields or act
 * on the cleaned comment live in {@code HelpService}.
 */
public record SubmitHelpFeedback(
		@NotBlank @Pattern(regexp = "^(glossary|[a-z0-9-]{1,60}/[a-z0-9-]{1,100})$",
				message = "Not a help article.") String pageSlug, //
		@NotNull Boolean helpful, //
		HelpFeedbackReason reason, //
		String comment) {
}
