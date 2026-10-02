/** The Mailpit API (compose.yaml, :8025): the mailbox both drivers read. */
import type { MailMessage, Mailbox } from '../../vocabulary/contract.ts'
import { until } from './poll.ts'

interface MailpitSummary {
  ID: string
  To: Array<{ Address: string }>
  Subject: string
  Created: string
}

export class Mailpit implements Mailbox {
  constructor(private readonly baseURL: string) {}

  private async search(to: string, subject: string): Promise<MailpitSummary[]> {
    const query = encodeURIComponent(`to:"${to}" subject:"${subject}"`)
    const response = await fetch(`${this.baseURL}/api/v1/search?query=${query}&limit=20`)
    if (!response.ok) throw new Error(`Mailpit search failed: ${response.status}`)
    const data = (await response.json()) as { messages: MailpitSummary[] }
    return data.messages.filter((m) => m.To.some((t) => t.Address.toLowerCase() === to.toLowerCase()) && m.Subject === subject)
  }

  async latest(to: string, subject: string): Promise<MailMessage | undefined> {
    const found = await until(async () => {
      const hits = await this.search(to, subject)
      return hits.length > 0 ? hits : undefined
    }, 15_000)
    if (!found) return undefined
    const newest = [...found].sort((a, b) => b.Created.localeCompare(a.Created))[0]!
    const response = await fetch(`${this.baseURL}/api/v1/message/${newest.ID}`)
    const message = (await response.json()) as { Text: string }
    const links = [...message.Text.matchAll(/https?:\/\/\S+/g)].map((m) => m[0].replace(/[).,]+$/, ''))
    return { id: newest.ID, to, subject, text: message.Text, links }
  }

  async none(to: string, subject: string): Promise<boolean> {
    const found = await until(async () => {
      const hits = await this.search(to, subject)
      return hits.length > 0 ? hits : undefined
    }, 3_000)
    return found === undefined
  }

  async clear(): Promise<void> {
    await fetch(`${this.baseURL}/api/v1/messages`, { method: 'DELETE' })
  }
}
