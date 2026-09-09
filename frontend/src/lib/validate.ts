/**
 * Client-side checks for numeric form fields, so an out-of-range value gets an
 * inline message instead of the browser's native range tooltip (ticket T-24).
 * Forms set `noValidate` and call these on submit; the backend repeats the
 * same rules and its 422 field errors render through the same `error` props.
 */

interface NumberRule {
  /** Field label as printed on the form, used in the message. */
  label: string
  /** Lowest acceptable value, inclusive. */
  min?: number
  /** Highest acceptable value, inclusive. */
  max?: number
  /** Whether zero is rejected even when `min` is 0. */
  positive?: boolean
  /** Whether an empty value is an error. */
  required?: boolean
}

/** The message for a numeric input's raw string value, or undefined when it passes. */
export function checkNumber(value: string, rule: NumberRule): string | undefined {
  const raw = value.trim()
  if (raw === '') {
    return rule.required ? `Enter ${lower(rule.label)}.` : undefined
  }
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) {
    return `${rule.label} must be a number.`
  }
  if (rule.positive && parsed <= 0) {
    return `${rule.label} must be greater than 0.`
  }
  if (rule.min !== undefined && parsed < rule.min) {
    return rule.max !== undefined
      ? `${rule.label} must be between ${rule.min} and ${rule.max}.`
      : `${rule.label} must be ${rule.min} or more.`
  }
  if (rule.max !== undefined && parsed > rule.max) {
    return rule.min !== undefined
      ? `${rule.label} must be between ${rule.min} and ${rule.max}.`
      : `${rule.label} must be ${rule.max} or less.`
  }
  return undefined
}

/** Drops undefined entries so an empty result reads as "no errors". */
export function collectErrors(
  checks: Record<string, string | undefined>,
): Record<string, string> | undefined {
  const errors: Record<string, string> = {}
  for (const [field, message] of Object.entries(checks)) {
    if (message) errors[field] = message
  }
  return Object.keys(errors).length === 0 ? undefined : errors
}

function lower(label: string): string {
  return label.charAt(0).toLowerCase() + label.slice(1)
}
