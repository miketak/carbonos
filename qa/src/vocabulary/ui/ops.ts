/**
 * The closed set of things the UI driver does and looks at. Each op has one
 * Playwright executor (runtime/ui/execute.ts) and one phrase (narrate.ts);
 * every label it names is a constant of surface.ts, so a renamed button
 * fails lint before it fails a run.
 */

export type UiOp =
  | { op: 'goto'; path: string }
  | { op: 'open'; nav: string }
  | { op: 'tab'; name: string }
  | { op: 'click'; button: string; within?: string }
  | { op: 'fill'; label: string; value: string; within?: string }
  | { op: 'choose'; label: string; option: string; within?: string }
  | { op: 'confirm'; dialog: string; button: string }
  | { op: 'signIn'; email: string; password: string }
  | { op: 'signOut' }
  | { op: 'accountMenu'; item: string }
  | { op: 'row'; text: string; button: string }
  | { op: 'emailLink'; actor: string; subject: string; path: string; forged?: boolean }
  | { op: 'reload' }
  | { op: 'waitFor'; text: string }

export type UiCheck =
  | { check: 'at'; nav: string }
  | { check: 'textVisible'; text: string; within?: string }
  | { check: 'textAbsent'; text: string }
  | { check: 'toast'; text: string }
  | { check: 'fieldError'; label: string; text: string }
  | { check: 'fieldValue'; label: string; value: string }
  | { check: 'rowHas'; text: string; cells: string[] }
  | { check: 'rowAbsent'; text: string }
  | { check: 'buttonVisible'; button: string; visible: boolean }
  | { check: 'signedOut' }
  | { check: 'signedIn' }
  | { check: 'url'; path: string }
  | { check: 'count'; nav: string; label: string; since?: string; added?: number; equals?: number }
  | { check: 'manual'; text: string }
  | { check: 'na'; why: string }
