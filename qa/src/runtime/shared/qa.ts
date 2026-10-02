/** The /api/qa/* client: reset, rules, digest. Signs in as the seeded administrator. */
import type { Pack } from '../../model.ts'
import { accountActors } from '../../model.ts'
import { HttpSession } from '../api/http.ts'
import { env } from './env.ts'

export function seededAdmin(pack: Pack): { email: string; password: string } {
  const seeded = accountActors(pack).find((a) => a.seeded)
  const email = env.adminEmail ?? seeded?.email
  const password = env.adminPassword ?? seeded?.password
  if (!email || !password) throw new Error('no seeded administrator: mark one actor seeded, or set QA_ADMIN_EMAIL and QA_ADMIN_PASSWORD')
  return { email, password }
}

export class QaHooks {
  readonly session: HttpSession

  constructor(private readonly pack: Pack) {
    this.session = new HttpSession(env.apiUrl, 'qa-hooks')
  }

  async signIn(): Promise<void> {
    const me = await this.session.get('/api/auth/me')
    if (me.ok) return
    const admin = seededAdmin(this.pack)
    const out = await this.session.post('/api/auth/login', admin)
    if (!out.ok) throw new Error(`the seeded administrator ${admin.email} cannot sign in (${out.status}); is the backend running with CARBONOS_ADMIN_EMAIL set?`)
  }

  async reset(): Promise<void> {
    await this.signIn()
    const out = await this.session.post('/api/qa/reset')
    if (!out.ok) throw new Error(`/api/qa/reset answered ${out.status}: is carbonos.qa.endpoints=true (the local profile)?`)
    // the reset ended every session, this one included
    await this.session.dispose()
  }

  async rules(): Promise<{ rules: unknown[]; sha256: string }> {
    await this.signIn()
    const out = await this.session.get('/api/qa/rules')
    if (!out.ok) throw new Error(`/api/qa/rules answered ${out.status}`)
    return out.body as { rules: unknown[]; sha256: string }
  }

  async digest(): Promise<{ counts: Record<string, number>; sha256: string }> {
    await this.signIn()
    const out = await this.session.get('/api/qa/digest')
    if (!out.ok) throw new Error(`/api/qa/digest answered ${out.status}`)
    return out.body as { counts: Record<string, number>; sha256: string }
  }

  async version(): Promise<string | undefined> {
    const out = await this.session.get('/api/version')
    return out.ok ? JSON.stringify(out.body) : undefined
  }
}
