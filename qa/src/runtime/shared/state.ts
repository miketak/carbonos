/**
 * What one procedure hands the next: the current password of every account
 * (procedure 1 changes Yaw's and changes it back) and the captured counts.
 * Kept under qa/.state/<persona>.<driver>.json between runs.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { REPO_ROOT } from '../../load.ts'

export interface ChainState {
  passwords: Record<string, string>
  captures: Record<string, number>
  /** The last procedure that finished green, so a later one can check its chain. */
  finished: number[]
}

export function statePath(persona: string, driver: string): string {
  return join(REPO_ROOT, 'qa', '.state', `${persona}.${driver}.json`)
}

export function loadState(persona: string, driver: string): ChainState {
  const file = statePath(persona, driver)
  if (!existsSync(file)) return { passwords: {}, captures: {}, finished: [] }
  return JSON.parse(readFileSync(file, 'utf8')) as ChainState
}

export function saveState(persona: string, driver: string, state: ChainState): void {
  const file = statePath(persona, driver)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, JSON.stringify(state, null, 2) + '\n')
}

export function clearState(persona: string, driver: string): void {
  saveState(persona, driver, { passwords: {}, captures: {}, finished: [] })
}
