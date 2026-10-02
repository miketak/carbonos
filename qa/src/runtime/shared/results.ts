/** What a run records per step, written as it goes so a crash leaves a trace. */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { REPO_ROOT } from '../../load.ts'

export type StepStatus = 'PASS' | 'FAIL' | 'NA' | 'MANUAL'

export interface StepResult {
  id: string
  status: StepStatus
  note?: string
}

export interface RunResults {
  persona: string
  procedure: number
  driver: 'api' | 'ui'
  yamlSha256: string
  startedAt: string
  finishedAt?: string
  steps: StepResult[]
  digestSha256?: string
  digest?: Record<string, number>
}

export function resultsPath(persona: string, procedure: number, driver: string): string {
  return join(REPO_ROOT, 'qa', 'out', 'results', persona, `${String(procedure).padStart(3, '0')}.${driver}.json`)
}

export function writeResults(results: RunResults): void {
  const file = resultsPath(results.persona, results.procedure, results.driver)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, JSON.stringify(results, null, 2) + '\n')
}
