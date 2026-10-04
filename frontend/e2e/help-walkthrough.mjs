/*
 * The Gye Nyame Gold walkthrough: drives a fresh CarbonOS account through the
 * eight Get started steps in a real browser and records what it saw. Every
 * figure the series quotes (help/docs/get-started) and every screenshot under
 * help/docs/assets/screens came from this script, so after a product change
 * the series can be re-derived rather than re-imagined.
 *
 * What it needs: the local stack on a wiped database (make db-reset, the
 * backend with the local profile, the Vite dev server) and an administrator
 * account, made with `make admin EMAIL=owner@gyenyame.example PASSWORD='Nyame-2025!'`.
 * Then, from frontend/: `npm run help:walkthrough`. It writes a log of every
 * screen, dialog and toast to e2e/out/walkthrough-log.txt, the run exports to
 * e2e/out/exports/, and full-window screenshots (1440 by 900) to
 * e2e/out/screens/. Pick the screenshots the articles need and quantize them
 * into help/docs/assets/screens (see docs/how-to/re-derive-the-get-started-series.md).
 *
 * Environment: BASE (default http://localhost:5173), EMAIL, PASSWORD, OUT.
 * The browser is Playwright's own when it is installed (npx playwright
 * install chromium); otherwise any headless shell already in the cache.
 */
import { chromium } from '@playwright/test'
import { appendFileSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const BASE = process.env.BASE ?? 'http://localhost:5173'
const EMAIL = process.env.EMAIL ?? 'owner@gyenyame.example'
const PASSWORD = process.env.PASSWORD ?? 'Nyame-2025!'
const OUT = resolve(process.env.OUT ?? join(here, 'out'))
const SCR = join(OUT, 'screens')
const LOG = join(OUT, 'walkthrough-log.txt')
const FIXTURE = resolve(here, '..', '..', 'help', 'docs', 'assets', 'gye-nyame-2025.csv')
for (const d of [SCR, join(OUT, 'exports')]) mkdirSync(d, { recursive: true })

function cachedShell() {
  const cache = join(homedir(), '.cache', 'ms-playwright')
  if (!existsSync(cache)) return undefined
  const dir = readdirSync(cache)
    .filter((d) => d.startsWith('chromium_headless_shell-'))
    .sort()
    .at(-1)
  const exe = dir && join(cache, dir, 'chrome-headless-shell-linux64', 'chrome-headless-shell')
  return exe && existsSync(exe) ? exe : undefined
}
let browser
try {
  browser = await chromium.launch()
} catch {
  const executablePath = cachedShell()
  if (!executablePath) throw new Error('no Playwright browser: run npx playwright install chromium')
  browser = await chromium.launch({ executablePath })
}
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
// toasts and status messages, polled from the DOM; each distinct text once
const toasts = []
await page.exposeFunction('__toast', (t) => {
  if (!toasts.includes(t)) toasts.push(t)
})
await page.addInitScript(() => {
  const seen = new Set()
  setInterval(() => {
    for (const el of document.querySelectorAll('[role="status"], [role="alert"]')) {
      const t = el.textContent?.trim()
      if (t && !seen.has(t)) {
        seen.add(t)
        window.__toast?.(t)
      }
    }
  }, 150)
})
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
await page.fill('input[name="email"]', EMAIL)
await page.fill('input[type="password"]', PASSWORD)
await page.click('button[type="submit"]')
await page.waitForSelector('[role="status"]', { timeout: 15000 })
await page.mouse.click(5, 5)
await page.waitForSelector('[role="status"]', { state: 'detached', timeout: 8000 })

writeFileSync(LOG, '')
const log = (label, t) => {
  const text = String(t)
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
  appendFileSync(LOG, `\n## ${label}\n${text}\n`)
  console.log(label, text.replace(/\s+/g, ' ').slice(0, 120))
}
// A whole page is captured as a window as tall as the page, not with Playwright's fullPage: the
// rail is sized to the window, so a fullPage capture draws it at the scroll offset and ends it
// at 900px. A page too tall to render as one window in time (the full run report) falls back
// to fullPage, from the top.
const TALLEST_WINDOW = 3000
const shot = async (name, fullPage = false) => {
  const viewport = page.viewportSize()
  let tall = false
  if (fullPage) {
    await page.evaluate(() => window.scrollTo(0, 0))
    const height = await page.evaluate(() => document.documentElement.scrollHeight)
    tall = height > TALLEST_WINDOW
    if (!tall) await page.setViewportSize({ width: viewport.width, height })
  }
  await page.waitForTimeout(500)
  await page.screenshot({ path: join(SCR, `${name}.png`), fullPage: tall, timeout: 60000 })
  if (fullPage && !tall) await page.setViewportSize(viewport)
}
// what a screen, a dialog, a tab strip and a select say and do
const mainText = async (max = 8000) => (await page.locator('main').innerText()).slice(0, max)
const dialogText = async () => await page.getByRole('dialog').last().innerText()
// the record's detail in the split register (spec 10): a region named by the record, not a dialog
const regionText = async (name) => await page.getByRole('region', { name, exact: true }).innerText()
// the pre-flight chip in the inventory's title row opens the Pre-flight checks popover (spec 10);
// the gates are logged with it open, so the log carries them the way the old panel did, and the
// screenshots are taken with it closed
const preflightChip = () =>
  page.getByRole('button', { name: /^(Ready to launch|Launch on hold|Published\.)/ })
const preflightPopover = () => page.getByRole('dialog', { name: 'Pre-flight checks' })
const openPreflight = async () => {
  await preflightChip().click()
  await preflightPopover().waitFor()
  await page.waitForTimeout(300)
}
const closePreflight = async () => {
  await preflightPopover().getByRole('button', { name: 'Close' }).click()
  await page.waitForTimeout(300)
}
const tab = async (name) => {
  await page.getByRole('tab', { name: new RegExp('^' + name) }).click()
  await page.waitForTimeout(900)
}
// a narrowed list loads from the server, so wait for the option rather than a fixed pause
const pick = async (label, re) => {
  const sel = page.getByLabel(label, { exact: true })
  let hit
  for (let i = 0; i < 60 && !hit; i++) {
    const opts = await sel
      .locator('option')
      .evaluateAll((os) => os.map((o) => ({ value: o.value, text: o.textContent })))
    hit = opts.find((o) => re.test(o.text))
    if (!hit) await page.waitForTimeout(500)
  }
  if (!hit) throw new Error(`no option ${re} in ${label}`)
  await sel.selectOption(hit.value)
  return hit.text
}
const until = async (text, timeout = 30000) =>
  page.locator('main').getByText(text).first().waitFor({ timeout })
const done = async () => {
  if (errors.length) console.log('PAGE ERRORS:', errors.join(' | '))
  await browser.close()
  console.log(`log: ${LOG}`)
}
const S = OUT
// 1. the organization and its legal entity
await page.goto(`${BASE}/app/ghg`, { waitUntil: 'networkidle' })
log('1 ghg landing', await mainText())
await page.getByRole('button', { name: 'New organization' }).click()
await page.getByLabel('Name').fill('Gye Nyame Gold Ltd')
await page.getByLabel('Address (optional)').fill('Mine Site Road, Obuasi')
log('1 new org dialog', await dialogText())
await shot('step-1-new-organization')
await page.getByRole('button', { name: 'Create organization' }).click()
await page.waitForTimeout(1500)
log('1 org card', await mainText())
await shot('step-1-organization-card')
await page.getByRole('link', { name: 'Open' }).first().click()
await page.waitForLoadState('networkidle')
await page.waitForTimeout(800)
log('1 overview', await mainText())
await page.getByRole('link', { name: 'Legal entities' }).click()
await page.waitForLoadState('networkidle')
await page.waitForTimeout(800)
log('1 entities', await mainText())
await page.getByRole('button', { name: 'Add entity' }).click()
const entityForm = page.getByRole('form', { name: 'Add legal entity' })
await entityForm.waitFor()
await entityForm.getByLabel('Name').fill('Gye Nyame Camp Services Ltd')
await entityForm.getByLabel('Economic interest (%)').fill('100')
await entityForm.getByLabel('Legal ownership (%)').fill('100')
await entityForm.getByLabel('Jurisdiction (optional)').fill('GH')
log('1 entity dialog', await entityForm.innerText())
await shot('step-1-add-entity')
await entityForm.getByRole('button', { name: 'Add entity' }).click()
await page.waitForTimeout(1500)
log('1 entities after', await mainText())
await shot('step-1-legal-entities')

// 2. facilities and streams
await page.getByRole('link', { name: 'Facilities' }).click()
await page.waitForLoadState('networkidle')
await page.waitForTimeout(800)
log('2 facilities empty', await mainText())
const addFacility = async (f) => {
  await page.getByRole('button', { name: 'Add facility' }).first().click()
  const d = page.getByRole('form', { name: 'Add facility' })
  await d.waitFor()
  await d.getByLabel('Name').fill(f.name)
  await d.getByLabel('Location').fill(f.location)
  await d.getByLabel('Country (optional)').fill('GH')
  if (f.grid) await d.getByLabel('Grid region (optional)').fill(f.grid)
  await d.getByLabel('Facility type (optional)').selectOption({ label: f.type })
  if (f.lease) await d.getByLabel('Lease (optional)').selectOption({ label: f.lease })
  await d.getByLabel('Legal entity').selectOption({ label: f.entity })
  if (f.shot) {
    log('2 facility dialog', await d.innerText())
    await shot(f.shot)
  }
  await d.getByRole('button', { name: 'Add facility' }).click()
  await page.waitForTimeout(1500)
}
await addFacility({
  name: 'Nyame Pit and Plant',
  location: 'Obuasi, Ghana',
  grid: 'GHA',
  type: 'Mine',
  entity: 'Gye Nyame Gold Ltd (Reporting company)',
  shot: 'step-2-add-facility',
})
await addFacility({
  name: 'Obuasi Camp',
  location: 'Obuasi, Ghana',
  type: 'Camp',
  lease: 'Operating lease (leased in)',
  entity: 'Gye Nyame Camp Services Ltd (Subsidiary)',
})
log('2 facilities', await mainText())
const streams = {
  'Nyame Pit and Plant': [
    { name: 'Haul fleet', kind: 'Mobile combustion', fuel: 'Diesel' },
    { name: 'Contract ore haulage', kind: 'Mobile combustion', fuel: 'Diesel', contractor: true },
    { name: 'Plant grid supply', kind: 'Purchased electricity', meter: 'ECG-OBU-01' },
  ],
  'Obuasi Camp': [
    { name: 'Camp gensets', kind: 'Stationary combustion', fuel: 'Diesel' },
    { name: 'Camp kitchens', kind: 'Stationary combustion', fuel: 'LPG' },
  ],
}
for (const [f, list] of Object.entries(streams)) {
  await page
    .getByRole('row', { name: new RegExp(f) })
    .first()
    .getByRole('button', { name: 'Source streams' })
    .click()
  const d = page.getByRole('dialog')
  await d.waitFor()
  await page.waitForTimeout(600)
  if (f === 'Nyame Pit and Plant') log('2 streams dialog empty', await dialogText())
  for (const s of list) {
    await d.getByLabel('Stream name').fill(s.name)
    await d.getByLabel('Kind').selectOption({ label: s.kind })
    await d.getByLabel('Fuel or material (optional)').fill(s.fuel ?? '')
    await d.getByLabel('Meter or supplier (optional)').fill(s.meter ?? '')
    await d.getByLabel(/Operated by a contractor/).setChecked(!!s.contractor)
    await d.getByRole('button', { name: 'Add stream' }).click()
    await page.waitForTimeout(1000)
  }
  log(`2 streams ${f}`, await dialogText())
  if (f === 'Nyame Pit and Plant') await shot('step-2-source-streams')
  await d.getByRole('button', { name: 'Close' }).click()
  await page.waitForTimeout(500)
}
log('2 facilities after', await mainText())
await shot('step-2-facilities')

// 3. factor packs
await page.getByRole('link', { name: 'Emission factors' }).click()
await page.waitForLoadState('networkidle')
await page.waitForTimeout(800)
log('3 factors page', await mainText())
await shot('step-3-factor-packs-before')
for (const pack of [
  'UK Government (DESNZ) GHG conversion factors 2025',
  'Ghana: grid electricity and transmission losses',
]) {
  const before = toasts.length
  await page.getByRole('button', { name: `Import pack ${pack}`, exact: true }).click()
  for (let i = 0; i < 120 && toasts.length === before; i++) await page.waitForTimeout(500)
  await page.waitForTimeout(800)
}
log('3 toasts', toasts.join('\n'))
log('3 after imports', await mainText())
await shot('step-3-factor-packs')
await page.getByLabel(/Show unapproved/).check()
await page.getByLabel('Search factors').fill('losses')
await page.waitForTimeout(1000)
log('3 losses row', await page.locator('table').last().innerText())
await shot('step-3-unapproved-factor')

// 4. import the records and correct one
await page.getByRole('link', { name: 'Activity data' }).click()
await page.waitForLoadState('networkidle')
await page.waitForTimeout(800)
log('4 activity empty', await mainText())
await page.getByRole('button', { name: 'Import CSV' }).click()
const imp = page.getByRole('dialog')
await imp.waitFor()
log('4 import dialog', await dialogText())
await imp.getByLabel('CSV file').setInputFiles(FIXTURE)
await imp
  .getByText('Checking the file')
  .waitFor({ state: 'detached', timeout: 30000 })
  .catch(() => {})
await page.waitForTimeout(800)
log('4 preview', await dialogText())
await shot('step-4-import-preview')
await imp.getByRole('button', { name: 'Add records' }).click()
await page.waitForTimeout(2500)
log('4 after import', await mainText())
await shot('step-4-records')
await page.getByText('Plant grid electricity H2').first().click()
await page.waitForTimeout(1000)
log('4 record drawer', await regionText('Plant grid electricity H2'))
await page.getByLabel('Activity quantity *').fill('36000000')
await page.waitForTimeout(300)
await page
  .getByLabel('Reason for the correction *')
  .fill('Second ECG statement: the second half was 36,000,000 kWh, not 3,600,000')
log('4 record edited', await regionText('Plant grid electricity H2'))
await shot('step-4-correct-record')
await page.getByRole('button', { name: 'Save', exact: true }).click()
await page.waitForTimeout(1500)
log('4 after save', await mainText())
await page.getByText('Plant grid electricity H2').first().click()
await page.waitForTimeout(1000)
await page.getByRole('button', { name: /^History/ }).click()
await page.waitForTimeout(900)
log('4 history', await dialogText())
await shot('step-4-history')
await page.keyboard.press('Escape')
await page.waitForTimeout(300)
await page.keyboard.press('Escape')
await page.waitForTimeout(300)

// 5. the inventory, its boundary and the declaration
await page.getByRole('link', { name: 'Inventories' }).click()
await page.waitForLoadState('networkidle')
await page.waitForTimeout(800)
await page.getByRole('button', { name: 'New inventory' }).click()
const inv = page.getByRole('form', { name: 'New inventory' })
await inv.waitFor()
await inv.getByLabel('Name').fill('FY2025')
await inv.getByLabel('Period start').fill('2025-01-01')
await inv.getByLabel('Period end').fill('2025-12-31')
await inv.getByLabel('Purpose (optional)').fill('Corporate reporting')
log('5 inventory dialog', await inv.innerText())
await shot('step-5-new-inventory')
await inv.getByRole('button', { name: 'Create inventory' }).click()
// creating opens the new inventory; the list is read on the way back to it
await page.waitForURL(/\/inventories\/[^/]+$/, { timeout: 15000 })
await page.waitForTimeout(1200)
const inventoryUrl = page.url()
await page.goto(inventoryUrl.replace(/\/[^/]+$/, ''), { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
log('5 inventories', await mainText())
await page.goto(inventoryUrl, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await openPreflight()
log('5 workbench', await mainText())
await closePreflight()
await shot('step-5-workbench')
await tab('Boundary')
log('5 boundary', await mainText())
await shot('step-5-boundary')
await page.getByLabel(/^1\. Purchased goods and services/).check()
await page.getByLabel(/^3\. Fuel- and energy-related activities/).check()
await page
  .getByLabel('Why other categories are excluded')
  .fill(
    'Only the contractor fleet (category 1) and the well-to-tank and grid-loss emissions of the fuel and electricity we buy (category 3) are quantified in 2025. Blasting is a contracted service and DESNZ publishes no explosives factor; it is not quantified this year.',
  )
await page.getByRole('button', { name: 'Save declaration' }).click()
await page.waitForTimeout(1200)
log('5 declaration saved', await mainText())
await shot('step-5-declaration', true)

// 6. residual mix, review, classify, approve, rules
await tab('Method')
log('6 method', await mainText())
await page
  .getByLabel('Residual mix available')
  .selectOption({ label: 'No residual mix is available' })
await page.getByRole('button', { name: 'Save residual mix' }).click()
await page.waitForTimeout(1000)
await tab('Records')
await page.getByRole('button', { name: 'Review activity data' }).click()
await page.waitForTimeout(1500)
await openPreflight()
log('6 under review', await mainText(12000))
await closePreflight()
await shot('step-6-under-review')
const classify = async (activity, search, factorText, opts = {}) => {
  await page
    .getByRole('row', { name: new RegExp(activity) })
    .first()
    .click()
  await page.waitForTimeout(900)
  const dr = page.getByRole('region', { name: activity, exact: true })
  await dr.waitFor()
  log(`6 drawer ${activity}`, await dr.innerText())
  if (opts.suggested) {
    await dr.getByRole('button', { name: /Suggested for this facility's grid/ }).click()
  } else {
    await dr.getByRole('button', { name: 'Choose factor…' }).click()
    await dr.getByLabel(new RegExp(`Search factors for ${activity}`)).fill(search)
    await page.waitForTimeout(1200)
    const list = dr.getByLabel(new RegExp(`Classify ${activity}`))
    if (opts.shot) {
      log(`6 options ${activity}`, await list.innerText())
      await shot(opts.shot + '-picker')
    }
    await list.getByRole('button', { name: factorText }).first().click()
  }
  await page.waitForTimeout(1200)
  log(`6 classified ${activity}`, await dr.innerText())
  if (opts.shot) await shot(opts.shot)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(600)
}
await classify(
  'Haul fleet diesel',
  'mineral diesel',
  /Liquid fuels: Diesel \(100% mineral diesel\).*litre/,
  { shot: 'step-6-classify-diesel' },
)
await classify(
  'Contract haulage diesel',
  'mineral diesel',
  /Liquid fuels: Diesel \(100% mineral diesel\).*litre/,
  { shot: 'step-6-classify-contractor' },
)
await classify(
  'Genset diesel',
  'mineral diesel',
  /Liquid fuels: Diesel \(100% mineral diesel\).*litre/,
)
await classify('Kitchen LPG', 'LPG', /Gaseous fuels: LPG.*litre/)
await classify('Year-end kitchen LPG', 'LPG', /Gaseous fuels: LPG.*litre/)
await classify('Plant grid electricity H1', '', '', {
  suggested: true,
  shot: 'step-6-classify-electricity',
})
await classify('Plant grid electricity H2', '', '', { suggested: true })
await openPreflight()
log('6 records classified', await mainText(12000))
await closePreflight()
await shot('step-6-classified')
await page.getByRole('link', { name: 'Emission factors' }).click()
await page.waitForLoadState('networkidle')
await page.waitForTimeout(800)
await page.getByLabel(/Show unapproved/).check()
await page.getByLabel('Search factors').fill('losses')
await page.waitForTimeout(1000)
await page.getByRole('button', { name: 'Approve' }).first().click()
await page.waitForTimeout(1200)
log('6 approved row', await page.locator('table').last().innerText())
await shot('step-6-approve-factor')
await page.goto(inventoryUrl, { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
await tab('Method')
const rule = async (primarySearch, primary, upstreamSearch, upstream, kind, shotName) => {
  await page.getByLabel('Narrow the primary factors').fill(primarySearch)
  await page.waitForTimeout(900)
  log('6 rule primary', await pick('Primary factor', primary))
  await page.getByLabel('Narrow the upstream factors').fill(upstreamSearch)
  await page.waitForTimeout(900)
  log('6 rule upstream', await pick('Upstream factor', upstream))
  log('6 rule kind', await pick('Kind', kind))
  if (shotName) await shot(shotName)
  await page.getByRole('button', { name: 'Add rule' }).click()
  await page.waitForTimeout(1200)
}
await rule(
  'Ghana',
  /Grid electricity, Ghana \(2024\)/,
  'losses',
  /T&D losses/,
  /Transmission/i,
  'step-6-upstream-rule',
)
await rule(
  'mineral diesel',
  /^Liquid fuels: Diesel \(100% mineral diesel\) \(\/litre\)/,
  'well-to-tank',
  /Well-to-tank: Liquid fuels: Diesel \(100% mineral diesel\) \(\/litre\)/,
  /Well-to-tank/i,
)
log('6 method after rules', await mainText())
await shot('step-6-rules')
await tab('Records')
await openPreflight()
log('6 records after rules', await mainText(12000))
await closePreflight()

// 7. freeze and run
await page.getByRole('button', { name: 'Freeze inventory' }).click()
await page.waitForTimeout(800)
log('7 freeze dialog', await dialogText())
await shot('step-7-freeze-dialog')
await page.getByRole('dialog').getByRole('button', { name: 'Freeze inventory' }).click()
await until(/^FROZEN/)
// the figure shows the chip and its popover at the head of the page, as the article describes them
await page.evaluate(() => window.scrollTo(0, 0))
await openPreflight()
log('7 after freeze', await mainText(12000))
await shot('step-7-ready-to-launch')
await closePreflight()
await tab('Runs')
log('7 runs tab', await mainText())
await shot('step-7-runs-tab')
await page.getByRole('button', { name: 'Launch calculation run' }).click()
await page.waitForURL(/\/runs\//, { timeout: 60000 })
await until(/t CO₂e/)
await page.waitForTimeout(1500)
const runUrl = page.url()
log('7 run page', await page.locator('main').innerText())
await shot('step-7-run-report')
await shot('step-7-run-full', true)
await page.goto(inventoryUrl, { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
await tab('Runs')
log('7 runs listed', await mainText())
await shot('step-7-runs-listed')

// 8. header, final, publish, export
await tab('Report')
log('8 report tab', await mainText())
await page.getByLabel('Approved by (optional)').fill('Ama Owusu, owner, Gye Nyame Gold Ltd')
await page.getByLabel('Denominator').fill('Gold produced')
await page.getByLabel('Value').fill('185000')
await page.getByLabel('Unit').fill('oz')
await page.getByRole('button', { name: 'Add denominator' }).click()
await page.waitForTimeout(800)
log('8 header filled', await mainText())
await shot('step-8-report-header')
await page.getByRole('button', { name: 'Save report header' }).click()
await page.waitForTimeout(1200)
await tab('Runs')
await page.getByRole('button', { name: 'Mark as final' }).click()
await page.waitForTimeout(800)
log('8 final dialog', await dialogText())
await page
  .getByRole('dialog')
  .getByLabel(/Review note/)
  .fill('Reconciled against the fuel farm records and the ECG statements')
await shot('step-8-mark-final')
await page.getByRole('dialog').getByRole('button', { name: 'Mark as final' }).click()
await until(/^FINAL/)
log('8 after final', await mainText())
await page.getByRole('button', { name: 'Publish' }).click()
await page.waitForTimeout(800)
log('8 publish dialog', await dialogText())
await page.getByRole('dialog').getByRole('button', { name: 'Publish' }).click()
await until(/^PUBLISHED/)
log('8 after publish', await mainText())
await shot('step-8-published')
await page.goto(runUrl, { waitUntil: 'networkidle' })
await until('86,412')
await page.waitForTimeout(800)
log('8 run after publish', await page.locator('main').innerText())
await shot('step-8-run-published')
const downloads = []
for (const name of ['PDF report', 'Lines (CSV)', 'Exclusions (CSV)', 'Frozen inputs (JSON)']) {
  const [dl] = await Promise.all([
    page.waitForEvent('download', { timeout: 30000 }),
    page.getByRole('link', { name }).click(),
  ])
  const path = `${S}/exports/${dl.suggestedFilename()}`
  await dl.saveAs(path)
  downloads.push(`${name} -> ${dl.suggestedFilename()}`)
}
log('8 downloads', downloads.join('\n'))
log('8 toasts', toasts.join('\n'))
await done()
