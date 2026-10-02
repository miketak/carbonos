// The UI driver's runtime lands with the UI projection of procedure 1; until then the generated UI specs refuse to run.
import { test } from '@playwright/test'
import type { ApiProcedure } from '../api/procedure.ts'
export { test }
export function procedure(persona: string, number: number, _sha: string): Pick<ApiProcedure, 'start' | 'finish' | 'step'> {
  throw new Error(`the UI driver is not implemented yet (procedure ${number} of ${persona})`)
}
