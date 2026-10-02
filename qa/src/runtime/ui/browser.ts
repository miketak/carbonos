/**
 * One browser, one context per actor (a tester's normal and private windows,
 * and a second window for a second session of one account). The context
 * collects every toast and alert it saw, because a toast lasts four seconds
 * and a check may come later.
 */
import { chromium, type Browser, type BrowserContext, type Page } from '@playwright/test'
import { existsSync } from 'node:fs'
import { env } from '../shared/env.ts'

/** Playwright's own build when installed; otherwise the container's Chromium (PLAYWRIGHT_BROWSERS_PATH). */
export function executablePath(): string | undefined {
  try {
    const own = chromium.executablePath()
    if (existsSync(own)) return undefined
  } catch {
    // fall through
  }
  for (const candidate of [process.env.QA_CHROMIUM, `${process.env.PLAYWRIGHT_BROWSERS_PATH ?? ''}/chromium`, '/opt/pw-browsers/chromium']) {
    if (candidate && existsSync(candidate)) return candidate
  }
  return undefined
}

export class Windows {
  private browser: Browser | undefined
  private readonly contexts = new Map<string, { context: BrowserContext; page: Page }>()

  async page(actorKey: string): Promise<Page> {
    const existing = this.contexts.get(actorKey)
    if (existing) return existing.page
    this.browser ??= await chromium.launch({ executablePath: executablePath() })
    const context = await this.browser.newContext({ baseURL: env.appUrl, viewport: { width: 1440, height: 900 } })
    await context.addInitScript(() => {
      const seen = new Set<string>()
      const w = window as unknown as { __qaNotices: string[] }
      w.__qaNotices = []
      setInterval(() => {
        for (const el of document.querySelectorAll('[role="status"], [role="alert"]')) {
          const t = el.textContent?.trim()
          if (t && !seen.has(t)) {
            seen.add(t)
            w.__qaNotices.push(t)
          }
        }
      }, 100)
    })
    const page = await context.newPage()
    this.contexts.set(actorKey, { context, page })
    return page
  }

  /** Every toast and alert the window has shown, oldest first. */
  async notices(page: Page): Promise<string[]> {
    return page.evaluate(() => (window as unknown as { __qaNotices?: string[] }).__qaNotices ?? [])
  }

  async close(): Promise<void> {
    for (const { context } of this.contexts.values()) await context.close()
    this.contexts.clear()
    await this.browser?.close()
    this.browser = undefined
  }
}
