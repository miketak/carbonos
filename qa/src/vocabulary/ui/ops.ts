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
  | { op: 'click'; button: string; within?: string; ifEnabled?: boolean }
  | { op: 'fill'; label: string; value: string; within?: string; blur?: boolean }
  | { op: 'choose'; label: string; option: string; within?: string; byValue?: boolean; prefix?: boolean }
  | { op: 'tick'; label: string; within?: string; on?: boolean; prefix?: boolean }
  | { op: 'upload'; label: string; fixture: string; within?: string }
  | { op: 'orgPage'; organization: string; section: string }
  | { op: 'inventoryPage'; organization: string; inventory: string; tab?: string }
  | { op: 'editionPage'; edition: string; tab?: string }
  | { op: 'confirm'; dialog: string; button: string }
  | { op: 'signIn'; email: string; password: string }
  | { op: 'signOut' }
  | { op: 'accountMenu'; item: string }
  | { op: 'row'; text: string; button: string; ifEnabled?: boolean }
  | { op: 'clickText'; text: string }
  | { op: 'openRow'; text: string }
  | { op: 'clickAny'; buttons: string[] }
  | { op: 'clickContaining'; text: string }
  | { op: 'pickOption'; group: string; text: string }
  | { op: 'emailLink'; actor: string; subject: string; path: string; forged?: boolean }
  | { op: 'reload' }
  | { op: 'waitFor'; text: string }
  | { op: 'settle' }

export type UiCheck =
  | { check: 'at'; nav: string }
  | { check: 'atOrg'; organization: string; section: string }
  | { check: 'atInventory'; organization: string; inventory: string; tab: string }
  | { check: 'atRun'; organization: string; inventory: string; run: string }
  | { check: 'atEdition'; edition: string; tab?: string }
  | { check: 'search'; label: string; value: string }
  | { check: 'buttonDisabled'; button: string; tooltip?: string; within?: string }
  | { check: 'rowDialogHas'; row: string; button: string; dialog: string; text: string }
  | { check: 'textVisible'; text: string; within?: string }
  | { check: 'textAbsent'; text: string }
  | { check: 'toast'; text: string }
  | { check: 'fieldError'; label: string; text: string }
  | { check: 'fieldValue'; label: string; value: string }
  | { check: 'fieldVisible'; label: string; within?: string }
  | { check: 'optionListed'; label: string; option: string; absent?: boolean }
  | { check: 'ticked'; label: string; on: boolean; disabled?: boolean }
  | { check: 'tabsVisible'; names: string[] }
  | { check: 'gateFinding'; organization: string; inventory: string; gate: string; severity?: string; containing: string; absent?: boolean }
  | { check: 'rowHas'; text: string; cells: string[] }
  | { check: 'rowAbsent'; text: string }
  | { check: 'rowLacks'; text: string; cell: string }
  | { check: 'buttonVisible'; button: string; visible: boolean }
  | { check: 'signedOut' }
  | { check: 'signedIn' }
  | { check: 'url'; path: string }
  | { check: 'visit'; path: string }
  | { check: 'count'; nav: string; label: string; since?: string; added?: number; equals?: number }
  | { check: 'manual'; text: string }
  | { check: 'na'; why: string }
