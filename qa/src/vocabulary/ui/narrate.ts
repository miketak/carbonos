/**
 * Turns a verb's UI plan into the Action cell, in the house style of the
 * procedures: bold for UI elements, backticks for typed values, product text
 * in double quotes with the stop after the closing quote, never an em-dash.
 */
import type { UiCheck, UiOp } from './ops.ts'

export const b = (text: string) => `**${text}**`
export const code = (text: string) => `\`${text}\``
export const q = (text: string) => `"${text}"`

function phrase(op: UiOp): string {
  switch (op.op) {
    case 'goto':
      return `open ${code(op.path)} in the address bar`
    case 'open':
      return `open ${b(op.nav)}`
    case 'tab':
      return `open the ${b(op.name)} tab`
    case 'click':
      return `click ${b(op.button)}`
    case 'fill':
      return `fill in ${b(op.label)} with ${value(op.value)}`
    case 'choose':
      return op.byValue && op.option.startsWith('{') ? `set ${b(op.label)} to ${op.option.replace(/\{entityId:[^|]+\|([^}]+)\}/, '$1')}` : `set ${b(op.label)} to ${b(op.option)}`
    case 'upload':
      return `choose ${code(op.fixture)} under ${b(op.label)}`
    case 'tick':
      return op.on === false ? `untick ${b(op.label)}` : `tick ${b(op.label)}`
    case 'orgPage':
      return `in ${op.organization.replace(/ #\d+$/, '')}, open ${b(op.section)}`
    case 'inventoryPage':
      return op.tab ? `on the inventory ${q(op.inventory)}, open ${b(op.tab)}` : `open the inventory ${q(op.inventory)}`
    case 'confirm':
      return `confirm ${q(op.dialog)} with ${b(op.button)}`
    case 'signIn':
      return op.password === '{wrong}' ? `try to sign in as ${op.email} with any password` : `sign in as ${op.email} with ${value(op.password)}`
    case 'signOut':
      return `sign out`
    case 'accountMenu':
      return `open the account menu and choose ${b(op.item)}`
    case 'row':
      return `click ${b(op.button)} on the row of ${op.text}`
    case 'openRow':
      return `open ${op.text}`
    case 'clickAny':
      return `click ${b(op.buttons[0]!)}`
    case 'clickContaining':
      return `click ${q(op.text)}`
    case 'pickOption':
      return `choose ${b(op.text.replace(/ \(\/$/, ''))}`
    case 'emailLink':
      return op.forged
        ? `open ${code(op.path + '?token=')} followed by 64 zeros`
        : `open the link of the email ${q(op.subject)} in the mailbox`
    case 'reload':
      return `reload the page`
    case 'waitFor':
      return `on the page headed ${q(op.text)}`
  }
}

/** A typed value in backticks; a token (an alias, a name, a password of the pack) as the exporter resolves it. */
function value(text: string): string {
  return text.startsWith('{') && text.endsWith('}') ? text : code(text)
}

/** Ops grouped into sentences: the fills of one form share a sentence, a click ends it. */
export function narrateOps(ops: UiOp[]): string {
  const sentences: string[] = []
  let clause: string[] = []
  const flush = () => {
    if (clause.length === 0) return
    sentences.push(capitalize(joinClauses(clause)) + '.')
    clause = []
  }
  for (const op of ops) {
    clause.push(phrase(op))
    if (op.op === 'click' || op.op === 'confirm' || op.op === 'signIn' || op.op === 'signOut' || op.op === 'row' || op.op === 'openRow' || op.op === 'clickAny' || op.op === 'clickContaining' || op.op === 'pickOption') flush()
  }
  flush()
  return sentences.join(' ')
}

function joinClauses(parts: string[]): string {
  if (parts.length <= 1) return parts.join('')
  if (parts.length === 2) return `${parts[0]}, then ${parts[1]}`
  return `${parts.slice(0, -1).join(', ')}, then ${parts.at(-1)}`
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Where the tester looks for an observation step: the first check that names a place. */
export function narrateWhereToLook(checks: UiCheck[]): string | undefined {
  const at = checks.find((c) => c.check === 'at')
  if (at && at.check === 'at') return `Open ${b(at.nav)}.`
  const atOrg = checks.find((c) => c.check === 'atOrg')
  if (atOrg && atOrg.check === 'atOrg') return `In ${atOrg.organization.replace(/ #\d+$/, '')}, open ${b(atOrg.section)}.`
  const visit = checks.find((c) => c.check === 'visit')
  if (visit && visit.check === 'visit') return `Open ${code(visit.path)} in the address bar.`
  const inv = checks.find((c) => c.check === 'atInventory')
  if (inv && inv.check === 'atInventory') return `On the inventory ${q(inv.inventory)}, open ${b(inv.tab)}.`
  const gate = checks.find((c) => c.check === 'gateFinding')
  if (gate && gate.check === 'gateFinding') return `Read the ${b(gate.gate)} gate on the pre-flight panel under ${b('Records')}.`
  return undefined
}

/** Joins outcome sentences into the Expected result cell. */
export function joinExpected(parts: string[]): string {
  return parts.filter(Boolean).join(' ')
}
