/**
 * The rule catalogue: every refusal the product names, as the backend
 * reports it at /api/qa/rules (committed as catalogue.json by `make qa-rules`)
 * plus the few refusals the page makes on its own (frontend.json). The
 * exported document quotes the catalogue's message, so a reworded refusal
 * changes the pack in the same PR.
 */
import catalogue from './catalogue.json' with { type: 'json' }
import frontend from './frontend.json' with { type: 'json' }

export interface RuleEntry {
  id: string
  module: string
  status: number
  message: string
  field: string | null
  /** Where the page shows it: a toast, a message under the field, or a disabled control. */
  surface?: 'toast' | 'field' | 'page'
}

const all = new Map<string, RuleEntry>()
for (const rule of catalogue.rules as RuleEntry[]) all.set(rule.id, rule)
for (const rule of frontend.rules as RuleEntry[]) all.set(rule.id, rule)

export const catalogueSha256: string = catalogue.sha256

export function rule(id: string): RuleEntry {
  const entry = all.get(id)
  if (!entry) throw new Error(`unknown rule '${id}'; run make qa-rules or check the id`)
  return entry
}

export function hasRule(id: string): boolean {
  return all.has(id)
}

export function ruleIds(): string[] {
  return [...all.keys()].sort()
}

/** The message with `{placeholders}` replaced from `with`, or left as "<placeholder>" for the reader. */
export function ruleMessage(id: string, values: Record<string, string> = {}): string {
  return rule(id).message.replace(/\{([a-zA-Z]+)\}/g, (_, name: string) => values[name] ?? `<${name}>`)
}
