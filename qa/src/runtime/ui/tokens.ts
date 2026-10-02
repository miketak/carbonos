/** Resolves the typed tokens of UI plans and checks into what the browser types and reads. */
import { resolveActor, type Pack } from '../../model.ts'
import { WRONG_PASSWORD } from '../../vocabulary/helpers.ts'
import { S, settingValueLabel } from '../../vocabulary/ui/surface.ts'
import type { ChainAccess } from '../shared/procedure.ts'

export function resolveTokens(chain: ChainAccess, text: string): string {
  const pack: Pack = chain.pack
  const account = (key: string) => {
    const actor = resolveActor(pack, key)
    if (!actor.account) throw new Error(`actor '${key}' has no account`)
    return actor.account
  }
  return text
    .replace(/\{email:([a-zA-Z0-9]+)\}/g, (_, k: string) => account(k).email)
    .replace(/\{name:([a-zA-Z0-9]+)\}/g, (_, k: string) => account(k).name)
    .replace(/\{password:([a-zA-Z0-9]+)\}/g, (_, k: string) => chain.passwordOf(k))
    .replace(/\{role(?:Label)?:([a-zA-Z0-9]+)\}/g, (_, k: string) => S.option.role[account(k).platformRole] ?? '')
    .replace(/\{setting:([a-zA-Z]+)=([^}]+)\}/g, (_, key: string, value: string) => settingValueLabel(key, value))
    .replace(/\{wrong\}/g, WRONG_PASSWORD)
}
