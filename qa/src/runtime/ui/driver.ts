/**
 * The UI driver: performs a verb's UI plan in the actor's window and puts
 * each outcome's UI checks to the screen. In cross-check mode (the default)
 * the outcomes that describe stored state are also asked of the API, so a
 * failure is reported as "UI stale" (the API agrees with the scenario, the
 * screen does not) or "backend" (the API disagrees too).
 */
import type { Page } from '@playwright/test'
import { resolveActor } from '../../model.ts'
import type { ApiOutcome, CheckResult, OutcomeRef } from '../../vocabulary/contract.ts'
import { outcome as outcomeByName, verb as verbByName } from '../../vocabulary/index.ts'
import { S } from '../../vocabulary/ui/surface.ts'
import { ApiDriver } from '../api/driver.ts'
import { env } from '../shared/env.ts'
import type { ChainAccess, Driver } from '../shared/procedure.ts'
import { Windows } from './browser.ts'
import { readCount, runCheck } from './checks.ts'
import { execute, open, toAppOrigin, type ExecuteContext } from './execute.ts'
import { routes } from './locators.ts'
import { seededAdmin } from '../shared/qa.ts'

/** The hidden window of the seeded administrator, for what only an administrator's page shows. */
const LOOKUP_WINDOW = '__admin-lookups'

/** Outcomes about stored state, which the API can answer without the actors' sessions. */
const CROSS_CHECKED = new Set([
  'userListed',
  'userAbsent',
  'userCount',
  'accessRequestStatus',
  'accessRequestsPending',
  'displayName',
  'platformRole',
  'settings',
  'settingHistoryHas',
  'settingHistoryCount',
  'platformSummary',
  'emailReceived',
  'noEmail',
])

export class UiDriver implements Driver {
  readonly name = 'ui' as const
  readonly knowsStatus = false
  private readonly windows = new Windows()
  private readonly api: ApiDriver

  constructor(private readonly chain: ChainAccess) {
    this.api = new ApiDriver(chain)
  }

  private executeContext(): ExecuteContext {
    const chain = this.chain
    return {
      chain,
      emailLink: async (actorKey, subject, path) => {
        const actor = resolveActor(chain.pack, actorKey)
        if (!actor.account) throw new Error(`actor '${actorKey}' has no mailbox`)
        const mail = await chain.mail.latest(actor.account.email, subject)
        const link = mail?.links.find((l) => l.includes(`${path}?token=`))
        if (!link) throw new Error(`no email "${subject}" with a ${path} link for ${actorKey}`)
        return toAppOrigin(link)
      },
    }
  }

  async perform(actorKey: string, verbName: string, args: Record<string, unknown>): Promise<ApiOutcome> {
    const verb = verbByName(verbName)
    const page = await this.windows.page(actorKey)
    const ctx = this.executeContext()
    for (const op of verb.ui(args)) await execute(page, op, ctx)
    // a password the page accepted is the account's from now on
    if (verbName === 'changePassword' || verbName === 'setPasswordFromLink' || verbName === 'resetPasswordFromLink') {
      const user = String(args.user)
      const chosen = (args.new ?? args.password) as string | undefined
      const confirm = args.confirm as string | undefined
      if (chosen && (confirm === undefined || confirm === chosen) && (await this.accepted(page, verbName))) {
        this.chain.setPassword(user, chosen)
      }
    }
    return { status: 0, ok: true }
  }

  /** Did the page accept the password change (no alert on screen)? */
  private async accepted(page: Page, verbName: string): Promise<boolean> {
    if (verbName === 'changePassword') {
      const notices = await this.windows.notices(page)
      return notices.some((n) => n.includes(S.text.passwordChanged))
    }
    return (await page.getByRole('alert').count()) === 0
  }

  /** A check that starts on an administration page runs in an administrator's window when the actor has none. */
  private async windowFor(actorKey: string, checks: ReturnType<ReturnType<typeof outcomeByName>['ui']>): Promise<Page> {
    const first = checks[0]
    const nav = first && first.check === 'at' ? first.nav : first && first.check === 'count' ? first.nav : undefined
    const route = nav ? routes[nav] : undefined
    const actor = resolveActor(this.chain.pack, actorKey)
    if (route?.startsWith('/admin') && actor.account?.platformRole !== 'ADMIN') return this.lookupWindow()
    return this.windows.page(actorKey)
  }

  private async lookupWindow(): Promise<Page> {
    const page = await this.windows.page(LOOKUP_WINDOW)
    if (new URL(page.url()).pathname === 'blank' || page.url() === 'about:blank') {
      const admin = seededAdmin(this.chain.pack)
      await execute(page, { op: 'signIn', email: admin.email, password: admin.password }, this.executeContext())
    }
    return page
  }

  async check(actorKey: string, ref: OutcomeRef, last: ApiOutcome | undefined): Promise<CheckResult> {
    const outcome = outcomeByName(ref.outcome)
    const checks = outcome.ui(ref.args)
    const page = await this.windowFor(actorKey, checks)
    let result: CheckResult = { ok: true }
    for (const check of checks) {
      result = await runCheck(page, this.windows, check, this.chain)
      if (!result.ok) break
    }
    if (env.crossCheck && CROSS_CHECKED.has(ref.outcome)) {
      const viaApi = await outcome.api(this.api.context(actorKey), ref.args, last)
      if (result.ok && !viaApi.ok) return { ok: false, detail: `backend: the screen agrees with the scenario but the API does not: ${viaApi.detail}` }
      if (!result.ok && viaApi.ok) return { ok: false, detail: `UI stale: the API agrees with the scenario but the screen does not: ${result.detail}` }
      if (!result.ok) return { ok: false, detail: `backend: ${viaApi.detail} (screen: ${result.detail})` }
    }
    return result
  }

  async measure(actorKey: string, outcomeName: string): Promise<number> {
    const page = await this.windows.page(actorKey)
    if (outcomeName === 'userCount') {
      await open(page, S.nav.dashboard)
      return readCount(page, S.tile.users)
    }
    throw new Error(`${outcomeName} has no measure on screen`)
  }

  async dispose(): Promise<void> {
    await this.windows.close()
    await this.api.dispose()
  }
}
