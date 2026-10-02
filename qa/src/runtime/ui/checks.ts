/**
 * The UiCheck interpreter: each check is a question put to the screen.
 * Waits are conditions with Playwright's expect timeout, never sleeps.
 */
import { expect, type Page } from '@playwright/test'
import type { CheckResult } from '../../vocabulary/contract.ts'
import type { UiCheck } from '../../vocabulary/ui/ops.ts'
import { S } from '../../vocabulary/ui/surface.ts'
import type { ChainAccess } from '../shared/procedure.ts'
import { open, row } from './execute.ts'
import { locators } from './locators.ts'
import { resolveTokens } from './tokens.ts'
import type { Windows } from './browser.ts'

export async function runCheck(page: Page, windows: Windows, check: UiCheck, chain: ChainAccess): Promise<CheckResult> {
  const t = (text: string) => resolveTokens(chain, text)
  try {
    switch (check.check) {
      case 'at':
        await open(page, check.nav)
        return { ok: true }
      case 'textVisible': {
        const scope = check.within ? page.locator(check.within) : page
        await expect(scope.getByText(t(check.text), { exact: false }).first()).toBeVisible()
        return { ok: true }
      }
      case 'textAbsent':
        await expect(page.getByText(t(check.text), { exact: false })).toHaveCount(0)
        return { ok: true }
      case 'toast':
      case 'fieldError': {
        // a refusal is a toast (role=status), a line under the field or a paragraph in the form (role=alert);
        // which one is the page's choice, the wording is the product's
        const text = t(check.text)
        const live = page.locator('[role="status"], [role="alert"]').filter({ hasText: text })
        try {
          await expect(live.first()).toBeVisible({ timeout: 5_000 })
          return { ok: true }
        } catch {
          const seen = await windows.notices(page)
          return seen.some((n) => n.includes(text)) ? { ok: true } : { ok: false, detail: `no ${check.check} read "${text}"; seen: ${seen.slice(-3).join(' / ') || 'nothing'}` }
        }
      }
      case 'rowHas': {
        let r = row(page, t(check.text))
        for (const cell of check.cells) r = r.filter({ hasText: t(cell) })
        await expect(r.first()).toBeVisible()
        return { ok: true }
      }
      case 'rowAbsent':
        await expect(page.getByRole('row').filter({ hasText: t(check.text) })).toHaveCount(0)
        return { ok: true }
      case 'buttonVisible': {
        if (check.button.startsWith('menu:')) {
          const item = check.button.slice('menu:'.length)
          await page.locator(locators.accountMenuTrigger).click()
          const menuItem = page.getByRole('menuitem', { name: item, exact: true })
          if (check.visible) await expect(menuItem).toBeVisible()
          else {
            await expect(page.getByRole('menu')).toBeVisible()
            await expect(menuItem).toHaveCount(0)
          }
          await page.keyboard.press('Escape')
          return { ok: true }
        }
        const button = page.getByRole('button', { name: t(check.button), exact: true })
        if (check.visible) await expect(button.first()).toBeVisible()
        else await expect(button).toHaveCount(0)
        return { ok: true }
      }
      case 'signedIn':
        // an administrator lands on the platform dashboard, a member on GHG accounting (spec 01.6)
        await page.waitForURL((url) => url.pathname.startsWith('/app') || url.pathname.startsWith('/admin'), { timeout: 15_000 })
        return { ok: true }
      case 'signedOut':
        await page.reload()
        await page.waitForURL((url) => url.pathname === '/login' || url.pathname === '/', { timeout: 15_000 })
        return { ok: true }
      case 'url':
        await page.waitForURL((url) => url.pathname.startsWith(check.path), { timeout: 15_000 })
        return { ok: true }
      case 'count': {
        await open(page, check.nav)
        const value = await readCount(page, check.label)
        const want = check.equals ?? (check.since !== undefined && check.added !== undefined ? chain.captured(check.since) + check.added : undefined)
        if (want === undefined) return { ok: false, detail: 'nothing to compare the count with' }
        return value === want ? { ok: true, detail: String(value) } : { ok: false, detail: `${check.label} reads ${value}, expected ${want}` }
      }
      case 'manual':
        return { ok: true, manual: check.text }
      case 'na':
        return { ok: true, na: check.why }
    }
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message.split('\n')[0] : String(error) }
  }
}

/** The number on a dashboard tile, or the rows of the table under a heading. */
export async function readCount(page: Page, label: string): Promise<number> {
  if (label === S.heading.everyChange) {
    const heading = page.getByRole('heading', { name: label, exact: true })
    await expect(heading).toBeVisible()
    const table = page.locator('h2:has-text("' + label + '") + div table')
    await expect(table).toBeVisible()
    return table.locator('tbody tr').count()
  }
  const tile = page.locator('p', { hasText: label }).filter({ hasText: new RegExp(`^${label}$`) }).first()
  await expect(tile).toBeVisible()
  const value = tile.locator('xpath=following-sibling::p[1]')
  const text = (await value.textContent()) ?? ''
  const n = Number(text.replace(/[^\d]/g, ''))
  if (Number.isNaN(n)) throw new Error(`the tile ${label} reads "${text}"`)
  return n
}
