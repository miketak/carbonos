/**
 * The UiCheck interpreter: each check is a question put to the screen.
 * Waits are conditions with Playwright's expect timeout, never sleeps.
 */
import { expect, type Page } from '@playwright/test'
import type { CheckResult } from '../../vocabulary/contract.ts'
import type { UiCheck } from '../../vocabulary/ui/ops.ts'
import { S } from '../../vocabulary/ui/surface.ts'
import type { ChainAccess } from '../shared/procedure.ts'
import { dialog, open, openInventoryPage, openOrgPage, openRunPage, resolveAsync, row, rowButton, type ExecuteContext } from './execute.ts'
import { locators } from './locators.ts'
import { resolveTokens } from '../shared/tokens.ts'
import type { Windows } from './browser.ts'

export async function runCheck(page: Page, windows: Windows, check: UiCheck, chain: ChainAccess, ctx?: ExecuteContext): Promise<CheckResult> {
  const t = (text: string) => resolveTokens(chain, text)
  try {
    switch (check.check) {
      case 'at':
        // an observation opens the page fresh: the SPA keeps figures for 30 seconds (staleTime), a tester who
        // opens a page expects what the server holds now
        await open(page, check.nav)
        await page.reload()
        return { ok: true }
      case 'atOrg':
        if (!ctx) return { ok: false, detail: 'no API view to find the organization' }
        await openOrgPage(page, ctx, check.organization, check.section)
        await page.reload()
        return { ok: true }
      case 'atInventory':
        if (!ctx) return { ok: false, detail: 'no API view to find the inventory' }
        await openInventoryPage(page, ctx, check.organization, check.inventory, check.tab)
        return { ok: true }
      case 'atRun':
        if (!ctx) return { ok: false, detail: 'no API view to find the run' }
        await openRunPage(page, ctx, check.organization, check.inventory, check.run)
        return { ok: true }
      case 'search':
        await page.getByLabel(t(check.label), { exact: true }).fill(t(check.value))
        return { ok: true }
      case 'buttonDisabled': {
        const scope = check.within ? dialog(page, t(check.within)) : page
        const button = scope.getByRole('button', { name: t(check.button), exact: true }).first()
        await expect(button).toBeVisible()
        await expect(button).toBeDisabled()
        if (check.tooltip) await expect(button).toHaveAttribute('title', t(check.tooltip))
        return { ok: true }
      }
      case 'rowDialogHas': {
        await (await rowButton(await row(page, t(check.row)), t(check.button))).click()
        const d = dialog(page, t(check.dialog))
        await expect(d.getByText(t(check.text), { exact: false }).first()).toBeVisible()
        await page.keyboard.press('Escape')
        return { ok: true }
      }
      case 'textVisible': {
        const scope = check.within ? page.locator(check.within) : page
        const text = t(check.text)
        await expect(scope.getByText(wildcard(text) ?? text, { exact: false }).first()).toBeVisible()
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
        // a placeholder the scenario did not fill (`<duplicates>`) matches whatever the product printed there
        const pattern = wildcard(text)
        const live = page.locator('[role="status"], [role="alert"]').filter({ hasText: pattern ?? text })
        try {
          await expect(live.first()).toBeVisible({ timeout: 5_000 })
          return { ok: true }
        } catch {
          const seen = await windows.notices(page)
          const hit = seen.some((n) => (pattern ? pattern.test(n) : n.includes(text)))
          return hit ? { ok: true } : { ok: false, detail: `no ${check.check} read "${text}"; seen: ${seen.slice(-3).join(' / ') || 'nothing'}` }
        }
      }
      case 'fieldVisible': {
        const scope = check.within ? dialog(page, t(check.within)) : page
        await expect(scope.getByLabel(t(check.label), { exact: true }).first()).toBeVisible()
        return { ok: true }
      }
      case 'optionListed': {
        // a select's option is in the list even when another is chosen: the status filter counts its records there
        await expect(page.getByLabel(t(check.label), { exact: true }).locator('option', { hasText: t(check.option) })).toHaveCount(1)
        return { ok: true }
      }
      case 'ticked': {
        const box = page.getByLabel(t(check.label), { exact: true })
        await expect(box).toBeVisible()
        if (check.on) await expect(box).toBeChecked()
        else await expect(box).not.toBeChecked()
        if (check.disabled) await expect(box).toBeDisabled()
        return { ok: true }
      }
      case 'tabsVisible': {
        for (const name of check.names) await expect(page.getByRole('tab', { name }).first()).toBeVisible()
        return { ok: true }
      }
      case 'gateFinding': {
        // the findings are on the pre-flight panel under Records; the observation opens the workbench fresh
        if (!ctx) return { ok: false, detail: 'no API view to find the inventory' }
        await openInventoryPage(page, ctx, check.organization, check.inventory, 'Records')
        const gate = page.getByRole('listitem').filter({ has: page.getByText(check.gate, { exact: true }) }).first()
        await expect(gate).toBeVisible()
        const finding = gate.getByText(t(check.containing), { exact: false })
        if (check.absent) await expect(finding).toHaveCount(0)
        else await expect(finding.first()).toBeVisible()
        return { ok: true }
      }
      case 'fieldValue': {
        const field = page.getByLabel(t(check.label), { exact: true })
        const tag = await field.evaluate((el) => el.tagName.toLowerCase())
        if (tag === 'select') {
          const selected = field.locator('option:checked')
          await expect(selected).toHaveText(t(check.value))
        } else {
          await expect(field).toHaveValue(t(check.value))
        }
        return { ok: true }
      }
      case 'rowHas': {
        // a table row or a list item that names the text, waited for (the table renders after the page);
        // the text may name a record by `{activityType:Org|ACT-0007}` where the page prints its activity type
        const text = ctx ? await resolveAsync(ctx, t(check.text)) : t(check.text)
        let r = page.getByRole('row').or(page.getByRole('listitem')).filter({ hasText: text })
        for (const cell of check.cells) r = r.filter({ hasText: ctx ? await resolveAsync(ctx, t(cell)) : t(cell) })
        await expect(r.first()).toBeVisible()
        return { ok: true }
      }
      case 'rowAbsent':
        await expect(page.getByRole('row').filter({ hasText: t(check.text) })).toHaveCount(0)
        return { ok: true }
      case 'rowLacks': {
        // the row is there, and no longer carries the text (the prose around the table may still use the words)
        const rows = page.getByRole('row').or(page.getByRole('listitem')).filter({ hasText: t(check.text) })
        await expect(rows.first()).toBeVisible()
        await expect(rows.filter({ hasText: t(check.cell) })).toHaveCount(0)
        return { ok: true }
      }
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
      case 'visit':
        await page.goto(check.path)
        await page.waitForLoadState('networkidle')
        return { ok: true }
      case 'url':
        await page.waitForURL((url) => url.pathname.startsWith(check.path), { timeout: 15_000 })
        return { ok: true }
      case 'count': {
        await open(page, check.nav)
        await page.reload()
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

/** A rule message with unfilled placeholders (`<duplicates>`) as a pattern; undefined when it has none. */
function wildcard(text: string): RegExp | undefined {
  if (!/<[a-zA-Z]+>/.test(text)) return undefined
  const escaped = text.split(/<[a-zA-Z]+>/).map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return new RegExp(escaped.join('[\\s\\S]*?'))
}
