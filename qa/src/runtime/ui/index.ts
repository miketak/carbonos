import { ProcedureRun, test } from '../shared/procedure.ts'
import { UiDriver } from './driver.ts'

export { test }

export function procedure(persona: string, number: number, yamlSha256: string): ProcedureRun {
  const run = new ProcedureRun(persona, number, yamlSha256, 'ui')
  return run.attach(new UiDriver(run))
}
