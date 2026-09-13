package com.carbonos.ghg.internal;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;

/**
 * The factor picker's query, in SQL (FU-03). Every filter the picker and the
 * emission factors page offer is a predicate the database applies before the
 * page is cut: the two tiers (spec 02.1), the approval toggle (spec 02.3), a
 * search over name, publication, the publisher's taxonomy and the pack tags,
 * the taxonomy columns spec 02.5 added, and the unit a record can be
 * classified with (spec 02.2). Nothing is filtered in Java, so importing an
 * edition of 1,868 rows costs the picker a page, not the whole library.
 *
 * <p>The order is the picker's grouping made durable across pages: the
 * organization's own factors first (a non-null owner sorts before the shared
 * library's null), then the scope, the name and the unit, with the identifier
 * last so a page boundary never repeats or drops a row.
 */
final class EmissionFactorSearch {

	/** The picker's order: the organization's own rows first, then scope, name, unit, id. */
	static final Sort ORDER = Sort.by(Sort.Order.asc("organizationId").nullsLast(), Sort.Order.asc("defaultScope"),
			Sort.Order.asc("name"), Sort.Order.asc("unit"), Sort.Order.asc("id"));

	private EmissionFactorSearch() {
	}

	/**
	 * The rows an organization may see under the query's filters.
	 *
	 * @param unitSpellings every spelling of every unit the requested
	 * dimensions cover, normalized; empty when no dimension was asked for
	 */
	static Specification<EmissionFactor> matching(UUID organizationId, GhgService.FactorQuery query,
			Set<String> unitSpellings) {
		var needle = like(query.q());
		return (root, cq, cb) -> {
			var predicates = new ArrayList<Predicate>();
			predicates.add(tier(organizationId, query.tier(), root, cb));
			if (!query.includeUnapproved()) {
				predicates.add(cb.isTrue(root.get("approved")));
			}
			if (query.ids() != null) {
				predicates.add(query.ids().isEmpty() ? cb.disjunction() : root.get("id").in(query.ids()));
			}
			equalsIgnoringCase(root, cb, "sourceCategory", query.sourceCategory()).ifPresent(predicates::add);
			equalsIgnoringCase(root, cb, "sourceActivity", query.sourceActivity()).ifPresent(predicates::add);
			equalsIgnoringCase(root, cb, "sourceDetail", query.sourceDetail()).ifPresent(predicates::add);
			equalsIgnoringCase(root, cb, "unit", query.unit()).ifPresent(predicates::add);
			if (!unitSpellings.isEmpty()) {
				predicates.add(cb.lower(root.get("unit")).in(unitSpellings));
			}
			if (needle != null) {
				// a null column yields null, never true, so an absent taxonomy simply does not match
				var text = new ArrayList<Predicate>(List.of(contains(cb, root.get("name"), needle),
						contains(cb, root.get("source"), needle), contains(cb, root.get("sourceCategory"), needle),
						contains(cb, root.get("sourceActivity"), needle),
						contains(cb, root.get("sourceDetail"), needle)));
				// the pack tags live in a collection table; an exists keeps the page free of duplicate rows
				var tagged = cq.subquery(Integer.class);
				var self = tagged.correlate(root);
				var tag = self.joinSet("packs", jakarta.persistence.criteria.JoinType.INNER);
				tagged.select(cb.literal(1)).where(contains(cb, tag.as(String.class), needle));
				text.add(cb.exists(tagged));
				predicates.add(cb.or(text.toArray(Predicate[]::new)));
			}
			return cb.and(predicates.toArray(Predicate[]::new));
		};
	}

	/** Whether a factor is approved, for the count of what the toggle is hiding. */
	static Specification<EmissionFactor> unapproved() {
		return (root, cq, cb) -> cb.isFalse(root.get("approved"));
	}

	private static Predicate tier(UUID organizationId, FactorTier tier, jakarta.persistence.criteria.Root<?> root,
			jakarta.persistence.criteria.CriteriaBuilder cb) {
		var owner = root.get("organizationId");
		return switch (tier) {
			case OWN -> cb.equal(owner, organizationId);
			case LIBRARY -> cb.isNull(owner);
			case ALL -> cb.or(cb.isNull(owner), cb.equal(owner, organizationId));
		};
	}

	private static java.util.Optional<Predicate> equalsIgnoringCase(jakarta.persistence.criteria.Root<?> root,
			jakarta.persistence.criteria.CriteriaBuilder cb, String attribute, String value) {
		var trimmed = value == null || value.isBlank() ? null : value.trim().toLowerCase(Locale.ROOT);
		return trimmed == null ? java.util.Optional.empty()
				: java.util.Optional.of(cb.equal(cb.lower(root.get(attribute)), trimmed));
	}

	/** Lowercase, then "contains the needle"; the wildcards a person typed stay literal. */
	private static Predicate contains(jakarta.persistence.criteria.CriteriaBuilder cb,
			jakarta.persistence.criteria.Expression<String> value, String needle) {
		return cb.like(cb.lower(value), needle, ESCAPE);
	}

	private static final char ESCAPE = '\\';

	/** The search as a case-insensitive contains pattern, or null when nothing was typed. */
	private static String like(String query) {
		var trimmed = query == null ? "" : query.trim();
		if (trimmed.isEmpty()) {
			return null;
		}
		var pattern = new StringBuilder("%");
		for (var character : trimmed.toLowerCase(Locale.ROOT).toCharArray()) {
			if (character == ESCAPE || character == '%' || character == '_') {
				pattern.append(ESCAPE);
			}
			pattern.append(character);
		}
		return pattern.append('%').toString();
	}

}
