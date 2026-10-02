import { ProcedureRun, test } from '../shared/procedure.ts'
import { ApiDriver } from './driver.ts'

export { test }

export function procedure(persona: string, number: number, yamlSha256: string): ProcedureRun {
  const run = new ProcedureRun(persona, number, yamlSha256, 'api')
  return run.attach(new ApiDriver(run))
}
