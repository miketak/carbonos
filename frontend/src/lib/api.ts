/**
 * Thin typed wrapper around fetch for talking to the CarbonOS backend.
 * The base URL comes from VITE_API_URL (set per environment at build time).
 * Sends the session cookie and echoes the XSRF-TOKEN cookie as the
 * X-XSRF-TOKEN header on mutating requests.
 */
const API_URL: string = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  readonly status: number
  /** RFC 9457 problem detail body, when the backend provides one. */
  readonly problem?: unknown

  constructor(status: number, problem?: unknown) {
    super(`API request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
  }
}

function readCookie(name: string): string | undefined {
  return document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`))
    ?.slice(name.length + 1)
}

let csrfBootstrap: Promise<unknown> | undefined

/**
 * The backend enforces CSRF even on public POSTs, and the XSRF cookie only
 * exists after some API response has set it. On a fresh browser the very
 * first mutation (login, request access) would 403 — so fetch any endpoint
 * once to seed the cookie.
 */
async function ensureCsrfCookie(): Promise<void> {
  if (readCookie('XSRF-TOKEN')) return
  csrfBootstrap ??= fetch(`${API_URL}/api/auth/me`, { credentials: 'include' }).catch(
    () => undefined,
  )
  await csrfBootstrap
  csrfBootstrap = undefined
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase()
  // FormData bodies must let the browser set multipart/form-data with its boundary
  const headers = new Headers(
    init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
  )
  new Headers(init?.headers).forEach((value, key) => headers.set(key, value))
  if (method !== 'GET' && method !== 'HEAD') {
    await ensureCsrfCookie()
    const csrfToken = readCookie('XSRF-TOKEN')
    if (csrfToken) headers.set('X-XSRF-TOKEN', decodeURIComponent(csrfToken))
  }

  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers,
  })

  if (!response.ok) {
    const problem = await response.json().catch(() => undefined)
    throw new ApiError(response.status, problem)
  }

  // 202 (accepted) responses carry no body either
  if (response.status === 204 || response.status === 202) {
    return undefined as T
  }
  return (await response.json()) as T
}

/** Fetches a binary body (e.g. a stored image) as a Blob. */
export async function apiBlob(path: string): Promise<Blob> {
  const response = await fetch(`${API_URL}${path}`, { credentials: 'include' })
  if (!response.ok) {
    const problem = await response.json().catch(() => undefined)
    throw new ApiError(response.status, problem)
  }
  return response.blob()
}

/** Field validation errors from a 422 problem detail, for inline display. */
export function fieldErrors(error: unknown): Record<string, string> | undefined {
  if (error instanceof ApiError && typeof error.problem === 'object' && error.problem !== null) {
    const errors = (error.problem as { errors?: unknown }).errors
    if (typeof errors === 'object' && errors !== null) {
      return errors as Record<string, string>
    }
  }
  return undefined
}

/** The `detail` message from an RFC 9457 problem body, when present. */
export function problemDetail(error: unknown): string | undefined {
  if (error instanceof ApiError && typeof error.problem === 'object' && error.problem !== null) {
    const detail = (error.problem as { detail?: unknown }).detail
    if (typeof detail === 'string') return detail
  }
  return undefined
}
