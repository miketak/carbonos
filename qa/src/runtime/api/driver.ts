/** The API driver: one HttpSession per actor, verbs as calls, outcomes as queries. */
import { resolveActor } from '../../model.ts'
import type { ApiContext, ApiOutcome, ApiSession, CheckResult, OutcomeRef } from '../../vocabulary/contract.ts'
import { outcome as outcomeByName, verb as verbByName } from '../../vocabulary/index.ts'
import { env } from '../shared/env.ts'
import type { ChainAccess, Driver } from '../shared/procedure.ts'
import { seededAdmin } from '../shared/qa.ts'
import { resolveTokens } from '../shared/tokens.ts'
import { HttpSession } from './http.ts'

export class ApiDriver implements Driver {
  readonly name = 'api' as const
  readonly knowsStatus = true
  private readonly sessions = new Map<string, HttpSession>()
  private readonly adminSession = new HttpSession(env.apiUrl, 'admin-lookups')

  /** With lazySignIn, an actor's session signs in on first use: the UI driver's cross-check and lookups. */
  constructor(
    private readonly chain: ChainAccess,
    private readonly lazySignIn = false,
  ) {}

  private readonly signedIn = new Set<string>()

  private lazySession(actorKey: string): ApiSession {
    const session = this.sessionOf(actorKey)
    const actor = resolveActor(this.chain.pack, actorKey)
    if (!this.lazySignIn || !actor.account) return session
    const chain = this.chain
    const self = this
    const ensure = async () => {
      if (self.signedIn.has(actorKey)) return
      const me = await session.get('/api/auth/me')
      if (!me.ok) {
        const out = await session.post('/api/auth/login', { email: actor.account!.email, password: chain.passwordOf(actorKey) })
        if (!out.ok) throw new Error(`${actorKey} cannot sign in for a lookup (${out.status})`)
      }
      self.signedIn.add(actorKey)
    }
    return {
      get: async (path) => (await ensure(), session.get(path)),
      post: async (path, body) => (await ensure(), session.post(path, body)),
      put: async (path, body) => (await ensure(), session.put(path, body)),
      delete: async (path, body) => (await ensure(), session.delete(path, body)),
      upload: async (path, file, query) => (await ensure(), session.upload(path, file, query)),
    }
  }

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
      session: () => this.lazySession(actorKey),
      sessionOf: (key) => this.lazySession(key),
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

  /** The typed tokens of a scenario (`{email:kofi}`, `{name:ama}`) mean the same through the API as on screen. */
  private resolved<T>(value: T): T {
    if (typeof value === 'string') return resolveTokens(this.chain, value) as T
    if (Array.isArray(value)) return value.map((v) => this.resolved(v)) as T
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, this.resolved(v)])) as T
    return value
  }

  perform(actorKey: string, verbName: string, args: Record<string, unknown>): Promise<ApiOutcome> {
    return verbByName(verbName).api(this.context(actorKey), this.resolved(args))
  }

  check(actorKey: string, ref: OutcomeRef, last: ApiOutcome | undefined): Promise<CheckResult> {
    return outcomeByName(ref.outcome).api(this.context(actorKey), this.resolved(ref.args), last)
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
