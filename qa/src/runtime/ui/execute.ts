/**
 * The UiOp interpreter: one Playwright executor per op. Roles and labels
 * first (getByRole, getByLabel with exact), scoped to a dialog or a row when
 * the op says so; any CSS selector lives in locators.ts with a reason.
 */
import { expect, type Locator, type Page } from '@playwright/test'
import { join } from 'node:path'
import { REPO_ROOT } from '../../load.ts'
import type { ApiContext } from '../../vocabulary/contract.ts'
import { entity, facility, organization } from '../../vocabulary/organizations.ts'
import type { UiOp } from '../../vocabulary/ui/ops.ts'
import { S } from '../../vocabulary/ui/surface.ts'
import { env } from '../shared/env.ts'
import type { ChainAccess } from '../shared/procedure.ts'
import { locators, routes } from './locators.ts'
import { resolveTokens } from '../shared/tokens.ts'

export interface ExecuteContext {
  chain: ChainAccess
  /** The acting member's API view, for the ids the page needs (an organization's route, an entity's option value). */
  api: ApiContext
  /** The link of the newest email with the subject, with the app's own origin. */
  emailLink(actorKey: string, subject: string, path: string): Promise<string>
}

/** The sections of an organization, by sidebar label, to their path under /app/ghg/<id>/. */
const orgSections: Record<string, string> = {
  Overview: '',
  'Legal entities': 'entities',
  Facilities: 'facilities',
  'Emission factors': 'factors',
  Units: 'units',
  Settings: 'settings',
  Activity: 'activity',
  Inventories: 'inventories',
}

/** Tokens that need the API: `{orgId:Name}` and `{entityId:Org|Entity}`. */
export async function resolveAsync(ctx: ExecuteContext, text: string): Promise<string> {
  let out = text
  for (const match of text.matchAll(/\{orgId:([^}]+)\}/g)) {
    out = out.replace(match[0], (await organization(ctx.api, match[1]!)).id)
  }
  for (const match of text.matchAll(/\{entityId:([^}|]+)\|([^}]+)\}/g)) {
    const org = await organization(ctx.api, match[1]!)
    out = out.replace(match[0], (await entity(ctx.api.session(), org.id, match[2]!)).id)
  }
  for (const match of text.matchAll(/\{facilityId:([^}|]+)\|([^}]+)\}/g)) {
    const org = await organization(ctx.api, match[1]!)
    out = out.replace(match[0], (await facility(ctx.api.session(), org.id, match[2]!)).id)
  }
  return resolveTokens(ctx.chain, out)
}

export async function openOrgPage(page: Page, ctx: ExecuteContext, organizationRef: string, section: string): Promise<void> {
  const path = orgSections[section]
  if (path === undefined) throw new Error(`no organization section "${section}"`)
  const org = await organization(ctx.api, organizationRef)
  await dismissDialogs(page)
  await goto(page, `/app/ghg/${org.id}/${path}`)
  await page.waitForURL((url) => url.pathname.startsWith(`/app/ghg/${org.id}`), { timeout: 15_000 })
}

const ZEROS = '0'.repeat(64)

export function clickable(scope: Page | Locator, name: string): Locator {
  return scope.getByRole('button', { name, exact: true }).or(scope.getByRole('link', { name, exact: true })).first()
}

export function dialog(page: Page, title: string): Locator {
  return page.getByRole('dialog', { name: title, exact: true })
}

/** The row of a table that names the text; else the list item, else the smallest card that does and holds a button. */
export async function row(page: Page, text: string): Promise<Locator> {
  const rows = page.getByRole('row').filter({ hasText: text })
  // the table or list renders after the page: give it a moment before deciding which shape the page has
  await rows.or(page.getByRole('listitem').filter({ hasText: text })).first().waitFor({ state: 'visible', timeout: 5_000 }).catch(() => undefined)
  if ((await rows.count()) > 0) return rows.first()
  const items = page.getByRole('listitem').filter({ hasText: text })
  if ((await items.count()) > 0) return items.first()
  return page.locator('article, section > div, div').filter({ has: page.getByText(text, { exact: true }) }).filter({ has: page.getByRole('button') }).last()
}

/** A tester leaving a dialog behind closes it first: Escape, then its Cancel or Close button. */
export async function dismissDialogs(page: Page): Promise<void> {
  const dialogs = page.getByRole('dialog')
  if ((await dialogs.count()) === 0) return
  await page.keyboard.press('Escape')
  if ((await dialogs.count()) === 0) return
  const close = dialogs.first().getByRole('button', { name: /^(Cancel|Close|Done)$/ }).first()
  if ((await close.count()) > 0) await close.click()
  await expect(dialogs).toHaveCount(0)
}

/** Goes where the sidebar label leads; by its link when the sidebar is on screen, else by its route. */
export async function open(page: Page, nav: string): Promise<void> {
  const route = routes[nav]
  if (!route) throw new Error(`no route for "${nav}"; add it to locators.ts`)
  await dismissDialogs(page)
  const link = page.getByRole('link', { name: nav, exact: true }).first()
  if ((await link.count()) > 0 && new URL(page.url()).pathname.startsWith(route.startsWith('/admin') ? '/admin' : '/app')) {
    await link.click()
  } else {
    await page.goto(route)
  }
  await page.waitForURL((url) => url.pathname.startsWith(route), { timeout: 15_000 })
}

/** After a sign-in the splash (role=status) plays; let it finish rather than click through it. */
async function settleAfterSignIn(page: Page): Promise<void> {
  const alert = page.getByRole('alert').first()
  await Promise.race([
    page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15_000 }).catch(() => undefined),
    alert.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => undefined),
  ])
  if (new URL(page.url()).pathname.startsWith('/login')) return
  const splash = page.getByRole('status').filter({ hasText: 'Measure' })
  await splash.waitFor({ state: 'detached', timeout: 15_000 }).catch(() => undefined)
}

export async function execute(page: Page, op: UiOp, ctx: ExecuteContext): Promise<void> {
  const t = (text: string) => resolveTokens(ctx.chain, text)
  switch (op.op) {
    case 'orgPage':
      await openOrgPage(page, ctx, op.organization, op.section)
      return
    case 'upload': {
      const scope = op.within ? dialog(page, t(op.within)) : page
      await scope.getByLabel(t(op.label), { exact: true }).setInputFiles(join(REPO_ROOT, 'docs', 'qa', 'governance', 'fixtures', op.fixture))
      return
    }
    case 'tick': {
      const scope = op.within ? dialog(page, t(op.within)) : page
      const box = scope.getByLabel(t(op.label), { exact: true })
      if (op.on === false) await box.uncheck()
      else await box.check()
      return
    }
    case 'goto':
      await dismissDialogs(page)
      await goto(page, op.path)
      return
    case 'open':
      await open(page, op.nav)
      return
    case 'tab':
      await page.getByRole('tab', { name: op.name }).click()
      return
    case 'click': {
      const scope = op.within ? dialog(page, t(op.within)) : page
      await clickable(scope, t(op.button)).click()
      return
    }
    case 'fill': {
      const scope = op.within ? dialog(page, t(op.within)) : page
      await scope.getByLabel(t(op.label), { exact: true }).fill(t(op.value))
      return
    }
    case 'choose': {
      const scope = op.within ? dialog(page, t(op.within)) : page
      const option = await resolveAsync(ctx, op.option)
      await scope.getByLabel(t(op.label), { exact: true }).selectOption(op.byValue ? { value: option } : { label: option })
      return
    }
    case 'confirm': {
      const d = dialog(page, t(op.dialog))
      await expect(d).toBeVisible()
      await clickable(d, t(op.button)).click()
      return
    }
    case 'signIn':
      await dismissDialogs(page)
      await page.goto('/login')
      await page.getByLabel(S.field.email, { exact: true }).fill(t(op.email))
      await page.getByLabel(S.field.password, { exact: true }).fill(t(op.password))
      await page.getByRole('button', { name: S.button.signIn, exact: true }).click()
      await settleAfterSignIn(page)
      return
    case 'signOut':
      await page.locator(locators.accountMenuTrigger).click()
      await page.getByRole('menuitem', { name: S.button.signOut, exact: true }).click()
      await page.waitForURL((url) => url.pathname.startsWith('/login'), { timeout: 15_000 })
      return
    case 'accountMenu':
      await dismissDialogs(page)
      await page.locator(locators.accountMenuTrigger).click()
      await page.getByRole('menuitem', { name: t(op.item), exact: true }).click()
      return
    case 'row':
      await (await row(page, t(op.text))).getByRole('button', { name: t(op.button), exact: true }).click()
      return
    case 'emailLink': {
      if (op.forged) {
        await page.goto(`${op.path}?token=${ZEROS}`)
        return
      }
      const link = await ctx.emailLink(op.actor, op.subject, op.path)
      await goto(page, link)
      return
    }
    case 'reload':
      await page.reload()
      return
    case 'waitFor':
      await expect(page.getByText(t(op.text)).first()).toBeVisible()
      return
  }
}

/** A navigation the page itself interrupts (a redirect on load) is tried once more. */
export async function goto(page: Page, path: string): Promise<void> {
  try {
    await page.goto(path)
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('ERR_ABORTED')) throw error
    await page.waitForLoadState('load')
    await page.goto(path)
  }
}

/** Rewrites an emailed link's origin to the app under test (the backend's base-url may name another host). */
export function toAppOrigin(link: string): string {
  const url = new URL(link)
  const app = new URL(env.appUrl)
  url.protocol = app.protocol
  url.host = app.host
  return url.toString()
}
