/** The API driver: one HttpSession per actor, verbs as calls, outcomes as queries. */
import { resolveActor } from '../../model.ts'
import type { ApiContext, ApiOutcome, CheckResult, OutcomeRef } from '../../vocabulary/contract.ts'
import { outcome as outcomeByName, verb as verbByName } from '../../vocabulary/index.ts'
import { env } from '../shared/env.ts'
import type { ChainAccess, Driver } from '../shared/procedure.ts'
import { seededAdmin } from '../shared/qa.ts'
import { HttpSession } from './http.ts'

export class ApiDriver implements Driver {
  readonly name = 'api' as const
  readonly knowsStatus = true
  private readonly sessions = new Map<string, HttpSession>()
  private readonly adminSession = new HttpSession(env.apiUrl, 'admin-lookups')

  constructor(private readonly chain: ChainAccess) {}

  context(actorKey: string): ApiContext {
    const chain = this.chain
    return {
      pack: chain.pack,
      actor: resolveActor(chain.pack, actorKey),
      actorOf: (key) => resolveActor(chain.pack, key),
      passwordOf: (key) => chain.passwordOf(key),
      setPassword: (key, password) => chain.setPassword(key, password),
      captured: (name) => chain.captured(name),
      capture: (name, value) => chain.capture(name, value),
      mail: chain.mail,
      session: () => this.sessionOf(actorKey),
      sessionOf: (key) => this.sessionOf(key),
      admin: () => this.admin(),
    }
  }

  private sessionOf(actorKey: string): HttpSession {
    resolveActor(this.chain.pack, actorKey)
    let session = this.sessions.get(actorKey)
    if (!session) {
      session = new HttpSession(env.apiUrl, actorKey)
      this.sessions.set(actorKey, session)
    }
    return session
  }

  async admin(): Promise<HttpSession> {
    const me = await this.adminSession.get('/api/auth/me')
    if (!me.ok) {
      const out = await this.adminSession.post('/api/auth/login', seededAdmin(this.chain.pack))
      if (!out.ok) throw new Error(`the seeded administrator cannot sign in for lookups (${out.status})`)
    }
    return this.adminSession
  }

  perform(actorKey: string, verbName: string, args: Record<string, unknown>): Promise<ApiOutcome> {
    return verbByName(verbName).api(this.context(actorKey), args)
  }

  check(actorKey: string, ref: OutcomeRef, last: ApiOutcome | undefined): Promise<CheckResult> {
    return outcomeByName(ref.outcome).api(this.context(actorKey), ref.args, last)
  }

  async measure(actorKey: string, outcomeName: string): Promise<number> {
    const outcome = outcomeByName(outcomeName)
    if (!outcome.measureApi) throw new Error(`${outcomeName} has no measure`)
    return outcome.measureApi(this.context(actorKey), {})
  }

  async dispose(): Promise<void> {
    for (const session of this.sessions.values()) await session.dispose()
    await this.adminSession.dispose()
  }
}
