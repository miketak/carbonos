import { ProcedureRun, test } from '../shared/procedure.ts'
import { ApiDriver } from './driver.ts'

export { test }

export function procedure(persona: string, number: number, yamlSha256: string): ProcedureRun {
  const run = new ProcedureRun(persona, number, yamlSha256, 'api')
  // QA_ACTOR names the actor of a run started mid-procedure; its session then signs in on first use, as the UI driver does
  return run.attach(new ApiDriver(run, Boolean(process.env.QA_ACTOR)))
}
