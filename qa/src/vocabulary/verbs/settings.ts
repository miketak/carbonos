import { z } from 'zod'
import { defineVerb } from '../contract.ts'
import { S, settingValueLabel } from '../ui/surface.ts'

/** The platform settings (spec 01.5): one save, with its reason. */

export const changeSettings = defineVerb({
  name: 'changeSettings',
  args: z
    .object({
      supportAccessWindowHours: z.number().int().optional(),
      organizationCreation: z.enum(['EVERYONE', 'ADMINISTRATORS']).optional(),
      editionsInPublishedPeriods: z.enum(['BLOCKED', 'ALLOWED']).optional(),
      reason: z.string(),
    })
    .strict(),
  api: async (ctx, { reason, ...values }) => ctx.session().put('/api/admin/settings', { ...values, reason }),
  ui: ({ supportAccessWindowHours, organizationCreation, editionsInPublishedPeriods, reason }) => [
    { op: 'open', nav: S.nav.platformSettings },
    ...(supportAccessWindowHours !== undefined
      ? [{ op: 'fill', label: S.field.supportAccessLasts, value: String(supportAccessWindowHours) } as const]
      : []),
    ...(organizationCreation
      ? [{ op: 'choose', label: S.field.whoMayCreate, option: settingValueLabel('organizationCreation', organizationCreation) } as const]
      : []),
    ...(editionsInPublishedPeriods
      ? [{ op: 'choose', label: S.field.editionsInside, option: settingValueLabel('editionsInPublishedPeriods', editionsInPublishedPeriods) } as const]
      : []),
    { op: 'fill', label: S.field.reason, value: reason },
    { op: 'click', button: S.button.saveSettings },
  ],
  postconditions: ({ reason: _reason, ...values }) => [{ outcome: 'settings', args: { ...values } }],
})

export const settingsVerbs = [changeSettings]
