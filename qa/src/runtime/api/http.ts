/**
 * One API session per actor: a cookie jar, the CSRF dance of the SPA (GET
 * /api/auth/me seeds XSRF-TOKEN, echoed as X-XSRF-TOKEN), and answers that
 * never throw on 4xx: a refusal is an outcome the step reads, not an error.
 */
import { request, type APIRequestContext } from '@playwright/test'
import type { ApiOutcome, ApiSession } from '../../vocabulary/contract.ts'

export class HttpSession implements ApiSession {
  private context: APIRequestContext | undefined

  constructor(
    private readonly baseURL: string,
    readonly label: string,
  ) {}

  private async ctx(): Promise<APIRequestContext> {
    this.context ??= await request.newContext({ baseURL: this.baseURL })
    return this.context
  }

  private async csrf(): Promise<string | undefined> {
    const ctx = await this.ctx()
    const read = async () => (await ctx.storageState()).cookies.find((c) => c.name === 'XSRF-TOKEN')?.value
    let token = await read()
    if (!token) {
      await ctx.get('/api/auth/me')
      token = await read()
    }
    return token ? decodeURIComponent(token) : undefined
  }

  private async send(method: 'get' | 'post' | 'put' | 'delete', path: string, body?: unknown): Promise<ApiOutcome> {
    const ctx = await this.ctx()
    const headers: Record<string, string> = {}
    if (method !== 'get') {
      const token = await this.csrf()
      if (token) headers['X-XSRF-TOKEN'] = token
    }
    const response = await ctx.fetch(path, { method, headers, data: body === undefined ? undefined : body })
    const text = await response.text()
    let parsed: unknown
    try {
      parsed = text ? JSON.parse(text) : undefined
    } catch {
      parsed = text
    }
    const rule = parsed && typeof parsed === 'object' ? (parsed as { rule?: string }).rule : undefined
    return { status: response.status(), ok: response.ok(), body: parsed, rule }
  }

  get(path: string) {
    return this.send('get', path)
  }

  post(path: string, body?: unknown) {
    return this.send('post', path, body ?? {})
  }

  put(path: string, body?: unknown) {
    return this.send('put', path, body ?? {})
  }

  delete(path: string, body?: unknown) {
    return this.send('delete', path, body)
  }

  /** A multipart POST: the file under `file`, the other fields as form parts; `query` goes on the URL. */
  async upload(path: string, file: { name: string; buffer: Buffer; mimeType: string }, query: Record<string, string> = {}): Promise<ApiOutcome> {
    const ctx = await this.ctx()
    const headers: Record<string, string> = {}
    const token = await this.csrf()
    if (token) headers['X-XSRF-TOKEN'] = token
    const search = new URLSearchParams(query).toString()
    const response = await ctx.post(search ? `${path}?${search}` : path, { headers, multipart: { file } })
    const text = await response.text()
    let parsed: unknown
    try {
      parsed = text ? JSON.parse(text) : undefined
    } catch {
      parsed = text
    }
    const rule = parsed && typeof parsed === 'object' ? (parsed as { rule?: string }).rule : undefined
    return { status: response.status(), ok: response.ok(), body: parsed, rule }
  }

  async dispose() {
    await this.context?.dispose()
    this.context = undefined
  }
}
