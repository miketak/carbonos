/**
 * The runtime the generated API specs call. One procedure object per spec
 * file: it holds the actors' sessions, the chain state, the results, and the
 * rules of a step (postconditions after a success, a refusal only when the
 * scenario expects one, N/A and MANUAL as annotations, never passes).
 */
import { test } from '@playwright/test'
import { loadPack, loadProcedures } from '../../load.ts'
import { resolveActor, type Pack, type Procedure, type ResolvedActor } from '../../model.ts'
import type { ApiContext, ApiOutcome, CheckResult, OutcomeRef } from '../../vocabulary/contract.ts'
import { detailOf } from '../../vocabulary/helpers.ts'
import { outcome as outcomeByName, verb as verbByName } from '../../vocabulary/index.ts'
import { env } from '../shared/env.ts'
import { Mailpit } from '../shared/mailpit.ts'
import { QaHooks } from '../shared/qa.ts'
import { writeResults, type RunResults, type StepResult, type StepStatus } from '../shared/results.ts'
import { clearState, loadState, saveState, type ChainState } from '../shared/state.ts'
import { HttpSession } from './http.ts'

export { test }

export interface ExpectClauseRef extends OutcomeRef {
  why?: string
}

export class ApiProcedure {
  readonly pack: Pack
  readonly procedure: Procedure
  private readonly sessions = new Map<string, HttpSession>()
  private readonly adminSession: HttpSession
  private readonly hooks: QaHooks
  readonly mail: Mailpit
  private state: ChainState
  private results: RunResults
  private currentActor: string | undefined

  constructor(
    readonly persona: string,
    readonly number: number,
    readonly yamlSha256: string,
  ) {
    this.pack = loadPack(persona)
    const found = loadProcedures(persona).find((p) => p.procedure === number)
    if (!found) throw new Error(`no procedure ${number} in pack ${persona}`)
    this.procedure = found
    if (found.sha256 !== yamlSha256) {
      throw new Error(`${found.file} changed since this script was generated; run make qa-compile`)
    }
    this.adminSession = new HttpSession(env.apiUrl, 'admin-lookups')
    this.hooks = new QaHooks(this.pack)
    this.mail = new Mailpit(env.mailpitUrl)
    this.state = loadState(persona, 'api')
    this.results = {
      persona,
      procedure: number,
      driver: 'api',
      yamlSha256,
      startedAt: new Date().toISOString(),
      steps: [],
    }
  }

  /** Resets the stack when the chain starts here; otherwise checks the chain. */
  async start(): Promise<void> {
    if (this.procedure.after === undefined) {
      if (process.env.QA_NO_RESET !== '1') {
        await this.hooks.reset()
        await this.mail.clear()
      }
      clearState(this.persona, 'api')
      this.state = loadState(this.persona, 'api')
    } else if (!this.state.finished.includes(this.procedure.after)) {
      throw new Error(`procedure ${this.procedure.after} has not run green on this stack; run it first or restore its checkpoint`)
    }
    writeResults(this.results)
  }

  async finish(): Promise<void> {
    const failed = this.results.steps.some((s) => s.status === 'FAIL')
    if (!failed) {
      this.state.finished = [...new Set([...this.state.finished, this.number])]
      saveState(this.persona, 'api', this.state)
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
    for (const session of this.sessions.values()) await session.dispose()
    await this.adminSession.dispose()
  }

  step(id: string): StepRun {
    return new StepRun(this, id)
  }

  /** @internal */
  context(actorKey: string): ApiContext {
    const self = this
    const actor = resolveActor(this.pack, actorKey)
    return {
      pack: this.pack,
      actor,
      actorOf: (key) => resolveActor(self.pack, key),
      passwordOf: (key) => self.passwordOf(key),
      setPassword: (key, password) => {
        self.state.passwords[self.baseKey(key)] = password
        saveState(self.persona, 'api', self.state)
      },
      captured: (name) => {
        const value = self.state.captures[name]
        if (value === undefined) throw new Error(`nothing captured as '${name}'`)
        return value
      },
      capture: (name, value) => {
        self.state.captures[name] = value
        saveState(self.persona, 'api', self.state)
      },
      mail: this.mail,
      session: () => self.sessionOf(actorKey),
      sessionOf: (key) => self.sessionOf(key),
      admin: () => self.admin(),
    }
  }

  private baseKey(actorKey: string): string {
    const actor = resolveActor(this.pack, actorKey)
    return actor.account?.key ?? actorKey
  }

  private passwordOf(actorKey: string): string {
    const actor = resolveActor(this.pack, actorKey)
    if (!actor.account) throw new Error(`actor '${actorKey}' has no password`)
    return this.state.passwords[actor.account.key] ?? actor.account.password
  }

  private sessionOf(actorKey: string): HttpSession {
    resolveActor(this.pack, actorKey)
    let session = this.sessions.get(actorKey)
    if (!session) {
      session = new HttpSession(env.apiUrl, actorKey)
      this.sessions.set(actorKey, session)
    }
    return session
  }

  private async admin(): Promise<HttpSession> {
    const me = await this.adminSession.get('/api/auth/me')
    if (!me.ok) {
      const { seededAdmin } = await import('../shared/qa.ts')
      const out = await this.adminSession.post('/api/auth/login', seededAdmin(this.pack))
      if (!out.ok) throw new Error(`the seeded administrator cannot sign in for lookups (${out.status})`)
    }
    return this.adminSession
  }

  /** @internal */
  setActor(key: string) {
    resolveActor(this.pack, key)
    this.currentActor = key
  }

  /** @internal */
  actorKey(): string {
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
  private readonly notes: string[] = []
  private status: StepStatus = 'PASS'
  private failed = false

  constructor(
    private readonly procedure: ApiProcedure,
    readonly id: string,
  ) {}

  as(actorKey: string): this {
    this.procedure.setActor(actorKey)
    return this
  }

  private ctx(): ApiContext {
    return this.procedure.context(this.procedure.actorKey())
  }

  private note(status: StepStatus, text: string) {
    this.notes.push(text)
    if (status === 'FAIL') this.status = 'FAIL'
    else if (status === 'MANUAL' && this.status !== 'FAIL') this.status = 'MANUAL'
    else if (status === 'NA' && this.status === 'PASS') this.status = 'NA'
  }

  private fail(text: string): never {
    this.note('FAIL', text)
    this.failed = true
    this.procedure.record({ id: this.id, status: 'FAIL', note: this.notes.join(' | ') })
    throw new Error(`${this.id}: ${text}`)
  }

  /** Performs the verb as the current actor and verifies its postconditions when it succeeded. */
  async do(verbName: string, rawArgs: Record<string, unknown>): Promise<ApiOutcome> {
    const verb = verbByName(verbName)
    const args = verb.args.parse(rawArgs)
    const ctx = this.ctx()
    let out: ApiOutcome
    try {
      out = await verb.api(ctx, args)
    } catch (error) {
      return this.fail(`${verbName} failed: ${error instanceof Error ? error.message : String(error)}`)
    }
    this.last = out
    if (out.na) {
      this.note('NA', out.na)
      return out
    }
    if (out.ok) {
      for (const ref of verb.postconditions(args)) {
        const result = await this.check(ref, out)
        if (!result.ok) this.fail(`after ${verbName}, ${ref.outcome} does not hold: ${result.detail}`)
      }
    }
    return out
  }

  /** Verifies the step's listed outcomes; an unexpected refusal of the verb fails here. */
  async expect(out: ApiOutcome | undefined, clauses: ExpectClauseRef[]): Promise<void> {
    const last = out ?? this.last
    const expectsRefusal = clauses.some((c) => c.outcome === 'refused')
    if (last && !last.ok && !last.na && !expectsRefusal) {
      this.fail(`the action was refused with ${last.status}: ${detailOf(last)}`)
    }
    for (const clause of clauses) {
      const result = await this.check(clause, last)
      if (!result.ok) this.fail(`${clause.outcome} does not hold: ${result.detail}`)
    }
    this.close()
  }

  /** Measures outcomes that can be measured and keeps the values for later steps. */
  async capture(what: Record<string, string>): Promise<void> {
    const ctx = this.ctx()
    for (const [name, outcomeName] of Object.entries(what)) {
      const outcome = outcomeByName(outcomeName)
      if (!outcome.measureApi) this.fail(`${outcomeName} cannot be measured`)
      const value = await outcome.measureApi(ctx, {})
      ctx.capture(name, value)
      this.note('PASS', `${name} = ${value}`)
    }
    this.close()
  }

  /** Ends a step that only acted (no expect clause): the postconditions were its verification. */
  done(): void {
    this.close()
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
      result = await outcome.api(this.ctx(), args, last)
    } catch (error) {
      return { ok: false, detail: error instanceof Error ? error.message : String(error) }
    }
    if (result.na) this.note('NA', `${ref.outcome}: N/A, ${result.na}`)
    else if (result.manual) this.note('MANUAL', `${ref.outcome}: MANUAL, ${result.manual}`)
    return result
  }
}

export function procedure(persona: string, number: number, yamlSha256: string): ApiProcedure {
  return new ApiProcedure(persona, number, yamlSha256)
}
