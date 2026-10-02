/**
 * The UiOp interpreter: one Playwright executor per op. Roles and labels
 * first (getByRole, getByLabel with exact), scoped to a dialog or a row when
 * the op says so; any CSS selector lives in locators.ts with a reason.
 */
import { expect, type Locator, type Page } from '@playwright/test'
import type { UiOp } from '../../vocabulary/ui/ops.ts'
import { S } from '../../vocabulary/ui/surface.ts'
import { env } from '../shared/env.ts'
import type { ChainAccess } from '../shared/procedure.ts'
import { locators, routes } from './locators.ts'
import { resolveTokens } from './tokens.ts'

export interface ExecuteContext {
  chain: ChainAccess
  /** The link of the newest email with the subject, with the app's own origin. */
  emailLink(actorKey: string, subject: string, path: string): Promise<string>
}

const ZEROS = '0'.repeat(64)

export function clickable(scope: Page | Locator, name: string): Locator {
  return scope.getByRole('button', { name, exact: true }).or(scope.getByRole('link', { name, exact: true })).first()
}

export function dialog(page: Page, title: string): Locator {
  return page.getByRole('dialog', { name: title, exact: true })
}

export function row(page: Page, text: string): Locator {
  return page.getByRole('row').filter({ hasText: text }).first()
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
      await scope.getByLabel(t(op.label), { exact: true }).selectOption({ label: t(op.option) })
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
      await row(page, t(op.text)).getByRole('button', { name: t(op.button), exact: true }).click()
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
