/**
 * The runtime the generated specs call, shared by both drivers. One
 * procedure object per spec file: the chain state, the results, and the
 * rules of a step. A driver supplies how a verb is performed and how an
 * outcome is observed; the step logic is the same for both:
 *
 * - a verb's postconditions are verified after it, unless the step expects a
 *   refusal (the API driver also skips them when the call was refused);
 * - a refusal the scenario did not expect fails the step (the API driver
 *   sees it in the status, the UI driver through the refusal's absence from
 *   the step's checks and the postconditions that then do not hold);
 * - N/A and MANUAL are annotations, never passes.
 */
import { test } from '@playwright/test'
import { loadPack, loadProcedures } from '../../load.ts'
import { resolveActor, type Pack, type Procedure } from '../../model.ts'
import type { ApiOutcome, CheckResult, OutcomeRef } from '../../vocabulary/contract.ts'
import { detailOf } from '../../vocabulary/helpers.ts'
import { outcome as outcomeByName, verb as verbByName } from '../../vocabulary/index.ts'
import { Mailpit } from './mailpit.ts'
import { env } from './env.ts'
import { QaHooks } from './qa.ts'
import { writeResults, type RunResults, type StepResult, type StepStatus } from './results.ts'
import { clearState, loadState, saveState, type ChainState } from './state.ts'

export { test }

export interface ExpectClauseRef extends OutcomeRef {
  why?: string
}

/** What a driver does; the procedure does the rest. */
export interface Driver {
  readonly name: 'api' | 'ui'
  /** Knows from the answer whether the verb was refused (the API driver). */
  readonly knowsStatus: boolean
  perform(actorKey: string, verbName: string, args: Record<string, unknown>): Promise<ApiOutcome>
  check(actorKey: string, ref: OutcomeRef, last: ApiOutcome | undefined): Promise<CheckResult>
  measure(actorKey: string, outcomeName: string): Promise<number>
  dispose(): Promise<void>
}

/** What a driver may ask the procedure for. */
export interface ChainAccess {
  pack: Pack
  passwordOf(actorKey: string): string
  setPassword(actorKey: string, password: string): void
  captured(name: string): number
  capture(name: string, value: number): void
  mail: Mailpit
}

export class ProcedureRun implements ChainAccess {
  readonly pack: Pack
  readonly procedure: Procedure
  readonly mail: Mailpit
  private readonly hooks: QaHooks
  private state: ChainState
  private results: RunResults
  private currentActor: string | undefined
  private driver!: Driver

  constructor(
    readonly persona: string,
    readonly number: number,
    readonly yamlSha256: string,
    readonly driverName: 'api' | 'ui',
  ) {
    this.pack = loadPack(persona)
    const found = loadProcedures(persona).find((p) => p.procedure === number)
    if (!found) throw new Error(`no procedure ${number} in pack ${persona}`)
    this.procedure = found
    if (found.sha256 !== yamlSha256) {
      throw new Error(`${found.file} changed since this script was generated; run make qa-compile`)
    }
    this.hooks = new QaHooks(this.pack)
    this.mail = new Mailpit(env.mailpitUrl)
    this.state = loadState(persona, driverName)
    this.results = { persona, procedure: number, driver: driverName, yamlSha256, startedAt: new Date().toISOString(), steps: [] }
  }

  private started = false

  attach(driver: Driver): this {
    this.driver = driver
    return this
  }

  /** Resets the stack when the chain starts here; otherwise checks the chain. */
  async start(): Promise<void> {
    if (this.procedure.after === undefined) {
      if (process.env.QA_NO_RESET !== '1') {
        await this.hooks.reset()
        await this.mail.clear()
      }
      clearState(this.persona, this.driverName)
      this.state = loadState(this.persona, this.driverName)
    } else if (!this.state.finished.includes(this.procedure.after)) {
      throw new Error(`procedure ${this.procedure.after} has not run green on this stack; run it first or restore its checkpoint`)
    }
    this.started = true
    writeResults(this.results)
  }

  async finish(): Promise<void> {
    // a procedure that never started (its predecessor has not run) leaves the chain as it was
    const failed = this.results.steps.some((s) => s.status === 'FAIL')
    if (this.started && !failed) {
      this.state.finished = [...new Set([...this.state.finished, this.number])]
      saveState(this.persona, this.driverName, this.state)
    }
    try {
      const digest = await this.hooks.digest()
      this.results.digestSha256 = digest.sha256
      this.results.digest = digest.counts
    } catch (error) {
      this.results.steps.push({ id: `${this.number}.digest`, status: 'FAIL', note: String(error) })
    }
    this.results.finishedAt = new Date().toISOString()
    writeResults(this.results)
    await this.driver.dispose()
    await this.hooks.session.dispose()
  }

  step(id: string): StepRun {
    return new StepRun(this, this.driver, id)
  }

  passwordOf(actorKey: string): string {
    const actor = resolveActor(this.pack, actorKey)
    if (!actor.account) throw new Error(`actor '${actorKey}' has no password`)
    return this.state.passwords[actor.account.key] ?? actor.account.password
  }

  setPassword(actorKey: string, password: string): void {
    const actor = resolveActor(this.pack, actorKey)
    this.state.passwords[actor.account?.key ?? actorKey] = password
    saveState(this.persona, this.driverName, this.state)
  }

  captured(name: string): number {
    const value = this.state.captures[name]
    if (value === undefined) throw new Error(`nothing captured as '${name}'`)
    return value
  }

  capture(name: string, value: number): void {
    this.state.captures[name] = value
    saveState(this.persona, this.driverName, this.state)
  }

  /** @internal */
  setActor(key: string) {
    resolveActor(this.pack, key)
    this.currentActor = key
  }

  /** @internal */
  actorKey(): string {
    // QA_ACTOR names the actor when a run starts mid-procedure (`--grep` on a few cases while a scenario is written)
    if (!this.currentActor && process.env.QA_ACTOR) this.currentActor = process.env.QA_ACTOR
    if (!this.currentActor) throw new Error('no actor: the first step of a procedure says who acts')
    return this.currentActor
  }

  /** @internal */
  record(result: StepResult) {
    this.results.steps = this.results.steps.filter((s) => s.id !== result.id)
    this.results.steps.push(result)
    writeResults(this.results)
  }
}

export class StepRun {
  private last: ApiOutcome | undefined
  private pending: { verb: string; postconditions: OutcomeRef[] } | undefined
  private readonly notes: string[] = []
  private status: StepStatus = 'PASS'
  private failed = false

  constructor(
    private readonly procedure: ProcedureRun,
    private readonly driver: Driver,
    readonly id: string,
  ) {}

  as(actorKey: string): this {
    this.procedure.setActor(actorKey)
    return this
  }

  private note(status: StepStatus, text: string) {
    this.notes.push(text)
    if (status === 'FAIL') this.status = 'FAIL'
    else if (status === 'MANUAL' && this.status !== 'FAIL') this.status = 'MANUAL'
    else if (status === 'NA' && this.status === 'PASS') this.status = 'NA'
  }

  private fail(text: string): never {
    if (process.env.QA_DEBUG) console.error(`[qa] ${this.id} FAIL ${text}\n${new Error().stack}`)
    this.note('FAIL', text)
    this.failed = true
    this.procedure.record({ id: this.id, status: 'FAIL', note: this.notes.join(' | ') })
    throw new Error(`${this.id}: ${text}`)
  }

  /** Performs the verb as the current actor; its postconditions are verified when the step closes. */
  async do(verbName: string, rawArgs: Record<string, unknown>): Promise<ApiOutcome> {
    const verb = verbByName(verbName)
    const args = verb.args.parse(rawArgs)
    let out: ApiOutcome
    try {
      out = await this.driver.perform(this.procedure.actorKey(), verbName, args)
    } catch (error) {
      return this.fail(`${verbName} failed: ${error instanceof Error ? error.message : String(error)}`)
    }
    this.last = out
    if (out.na) this.note('NA', out.na)
    this.pending = { verb: verbName, postconditions: verb.postconditions(args) }
    return out
  }

  /** Verifies the step's listed outcomes where the action left the tester, then the verb's postconditions (which may move). */
  async expect(out: ApiOutcome | undefined, clauses: ExpectClauseRef[]): Promise<void> {
    const last = out ?? this.last
    const expectsRefusal = clauses.some((c) => c.outcome === 'refused' || outcomeByName(c.outcome).expectsRefusal === true)
    if (this.driver.knowsStatus && last && !last.ok && !last.na && !expectsRefusal) {
      this.fail(`the action was refused with ${last.status}: ${detailOf(last)}`)
    }
    // a line the drawer prints is read before the postconditions move the page; the rest after them, settled
    const first = clauses.filter((c) => outcomeByName(c.outcome).readsScreenFirst === true)
    const rest = clauses.filter((c) => !first.includes(c))
    for (const clause of first) {
      const result = await this.check(clause, last)
      if (!result.ok) this.fail(`${clause.outcome} does not hold: ${result.detail}`)
    }
    await this.postconditions(expectsRefusal)
    for (const clause of rest) {
      const result = await this.check(clause, last)
      if (!result.ok) this.fail(`${clause.outcome} does not hold: ${result.detail}`)
    }
    this.close()
  }

  /** Measures outcomes that can be measured and keeps the values for later steps. */
  async capture(what: Record<string, string>): Promise<void> {
    await this.postconditions(false)
    for (const [name, outcomeName] of Object.entries(what)) {
      let value: number
      try {
        value = await this.driver.measure(this.procedure.actorKey(), outcomeName)
      } catch (error) {
        return this.fail(`${outcomeName} cannot be measured: ${error instanceof Error ? error.message : String(error)}`)
      }
      this.procedure.capture(name, value)
      this.note('PASS', `${name} = ${value}`)
    }
    this.close()
  }

  /** Ends a step that only acted (no expect clause): the postconditions were its verification. */
  async done(): Promise<void> {
    if (this.driver.knowsStatus && this.last && !this.last.ok && !this.last.na) {
      this.fail(`the action was refused with ${this.last.status}: ${detailOf(this.last)}`)
    }
    await this.postconditions(false)
    this.close()
  }

  private async postconditions(expectsRefusal: boolean): Promise<void> {
    const pending = this.pending
    this.pending = undefined
    if (!pending || expectsRefusal) return
    if (this.driver.knowsStatus && this.last && (!this.last.ok || this.last.na)) return
    if (this.last?.na) return
    for (const ref of pending.postconditions) {
      const result = await this.check(ref, this.last)
      if (!result.ok) this.fail(`after ${pending.verb}, ${ref.outcome} does not hold: ${result.detail}`)
    }
  }

  private close() {
    if (this.failed) return
    this.procedure.record({ id: this.id, status: this.status, note: this.notes.length ? this.notes.join(' | ') : undefined })
  }

  private async check(ref: OutcomeRef, last: ApiOutcome | undefined): Promise<CheckResult> {
    const outcome = outcomeByName(ref.outcome)
    const args = outcome.args.parse(ref.args)
    let result: CheckResult
    try {
      result = await this.driver.check(this.procedure.actorKey(), { outcome: ref.outcome, args }, last)
    } catch (error) {
      return { ok: false, detail: error instanceof Error ? error.message : String(error) }
    }
    if (result.na) this.note('NA', `${ref.outcome}: N/A, ${result.na}`)
    else if (result.manual) this.note('MANUAL', `${ref.outcome}: MANUAL, ${result.manual}`)
    return result
  }
}
