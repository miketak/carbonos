import { z } from 'zod'
import { defineOutcome, fail, pass } from '../contract.ts'
import { account, actorArg } from '../helpers.ts'
import { S, hoursLabel, settingValueLabel } from '../ui/surface.ts'

/** The platform settings and their history (spec 01.5). */

const settingKey = z.enum(['supportAccessWindowHours', 'organizationCreation', 'editionsInPublishedPeriods'])

export const settings = defineOutcome({
  name: 'settings',
  args: z
    .object({
      supportAccessWindowHours: z.number().int().optional(),
      organizationCreation: z.enum(['EVERYONE', 'ADMINISTRATORS']).optional(),
      editionsInPublishedPeriods: z.enum(['BLOCKED', 'ALLOWED']).optional(),
    })
    .strict(),
  api: async (ctx, want) => {
    const out = await (await ctx.admin()).get('/api/admin/settings')
    if (!out.ok) return fail(`could not read the settings: ${out.status}`)
    const got = out.body as Record<string, unknown>
    for (const [key, value] of Object.entries(want)) {
      if (value !== undefined && got[key] !== value) return fail(`${key} is ${String(got[key])}, expected ${String(value)}`)
    }
    return pass()
  },
  ui: (want) => [
    { check: 'at', nav: S.nav.platformSettings },
    ...Object.entries(want)
      .filter(([, v]) => v !== undefined)
      .map(([key, value]) => ({ check: 'textVisible', text: `{setting:${key}=${String(value)}}` }) as const),
  ],
  narrate: (want) =>
    Object.entries(want)
      .filter(([, v]) => v !== undefined)
      .map(([key, value]) => `**${fieldLabel(key)}** reads ${quoteValue(key, value as string | number)}`)
      .join(', ') + '.',
})

function fieldLabel(key: string): string {
  return key === 'supportAccessWindowHours' ? S.field.supportAccessLasts : key === 'organizationCreation' ? S.field.whoMayCreate : S.field.editionsInside
}

function quoteValue(key: string, value: string | number): string {
  return key === 'supportAccessWindowHours' ? hoursLabel(value) : `"${settingValueLabel(key, value)}"`
}

export const settingHistoryHas = defineOutcome({
  name: 'settingHistoryHas',
  args: z
    .object({
      setting: settingKey,
      from: z.union([z.string(), z.number()]),
      to: z.union([z.string(), z.number()]),
      reason: z.string().optional(),
      actor: actorArg.optional(),
    })
    .strict(),
  api: async (ctx, { setting, from, to, reason, actor }) => {
    const out = await (await ctx.admin()).get('/api/admin/settings/history')
    if (!out.ok) return fail(`could not read the history: ${out.status}`)
    const rows = out.body as Array<{ setting: string; oldValue: string; newValue: string; reason: string; actorEmail: string }>
    const hit = rows.find(
      (r) =>
        r.setting === setting &&
        r.oldValue === String(from) &&
        r.newValue === String(to) &&
        (reason === undefined || r.reason === reason) &&
        (actor === undefined || r.actorEmail === account(ctx, actor).email),
    )
    return hit ? pass() : fail(`no history entry ${setting} ${String(from)} -> ${String(to)}${reason ? ` "${reason}"` : ''}`)
  },
  ui: ({ setting, from, to, reason, actor }) => [
    { check: 'at', nav: S.nav.platformSettings },
    {
      check: 'rowHas',
      text: S.historySetting[setting]!,
      cells: [settingValueLabel(setting, from), settingValueLabel(setting, to), ...(reason ? [reason] : []), ...(actor ? [`{email:${actor}}`] : [])],
    },
  ],
  narrate: ({ setting, from, to, reason, actor }, n) =>
    `Under **${S.heading.everyChange}** an entry reads "${S.historySetting[setting]}" from "${settingValueLabel(setting, from)}" to "${settingValueLabel(setting, to)}"` +
    (reason ? `, with the reason "${reason}"` : '') +
    (actor ? `, ${n.actorAlias(actor)} and the moment` : '') +
    '.',
})

export const settingHistoryCount = defineOutcome({
  name: 'settingHistoryCount',
  args: z.object({ count: z.number().int() }).strict(),
  api: async (ctx, { count }) => {
    const out = await (await ctx.admin()).get('/api/admin/settings/history')
    if (!out.ok) return fail(`could not read the history: ${out.status}`)
    const n = (out.body as unknown[]).length
    return n === count ? pass(String(n)) : fail(`${n} entries, expected ${count}`)
  },
  ui: ({ count }) => [{ check: 'at', nav: S.nav.platformSettings }, { check: 'count', nav: S.nav.platformSettings, label: S.heading.everyChange, equals: count }],
  narrate: ({ count }) => `The log under **${S.heading.everyChange}** holds ${count} entries, the newest first.`,
})

/** The window as every signed-in user may read it (the public endpoint, the dashboard's line). */
export const supportAccessWindow = defineOutcome({
  name: 'supportAccessWindow',
  args: z.object({ hours: z.number().int() }).strict(),
  api: async (ctx, { hours }) => {
    const out = await ctx.session().get('/api/platform/settings')
    if (!out.ok) return fail(`could not read the public settings: ${out.status}`)
    const got = (out.body as { supportAccessWindowHours: number }).supportAccessWindowHours
    return got === hours ? pass(String(got)) : fail(`the window is ${got} hours`)
  },
  ui: ({ hours }) => [{ check: 'at', nav: S.nav.dashboard }, { check: 'textVisible', text: `Support access lasts ${hoursLabel(hours)}` }],
  narrate: ({ hours }) => `The dashboard's **Support access** section reads "Support access lasts ${hoursLabel(hours)}".`,
})

export const platformSummary = defineOutcome({
  name: 'platformSummary',
  args: z
    .object({ organizations: z.number().int().optional(), openNotices: z.number().int().optional(), publishedEditions: z.number().int().optional() })
    .strict(),
  api: async (ctx, want) => {
    const out = await (await ctx.admin()).get('/api/admin/summary/platform')
    if (!out.ok) return fail(`could not read the platform summary: ${out.status}`)
    const got = out.body as Record<string, number>
    for (const [key, value] of Object.entries(want)) {
      if (value !== undefined && got[key] !== value) return fail(`${key} is ${String(got[key])}, expected ${value}`)
    }
    return pass()
  },
  ui: ({ organizations, openNotices, publishedEditions }) => [
    { check: 'at', nav: S.nav.dashboard },
    ...(organizations !== undefined ? [{ check: 'count', nav: S.nav.dashboard, label: S.tile.organizations, equals: organizations } as const] : []),
    ...(openNotices !== undefined ? [{ check: 'count', nav: S.nav.dashboard, label: S.tile.openNotices, equals: openNotices } as const] : []),
    ...(publishedEditions !== undefined ? [{ check: 'count', nav: S.nav.dashboard, label: S.tile.editions, equals: publishedEditions } as const] : []),
  ],
  narrate: ({ organizations, openNotices, publishedEditions }) =>
    [
      organizations !== undefined ? `**${S.tile.organizations}** reads ${organizations}` : undefined,
      publishedEditions !== undefined ? `**${S.tile.editions}** counts the ${words(publishedEditions)} shipped editions` : undefined,
      openNotices !== undefined ? `**${S.tile.openNotices}** reads ${openNotices}` : undefined,
    ]
      .filter(Boolean)
      .join('; ') + '. No tile carries a client\'s emissions figure.',
})

function words(n: number): string {
  return ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][n] ?? String(n)
}

export const settingsOutcomes = [settings, settingHistoryHas, settingHistoryCount, supportAccessWindow, platformSummary]
