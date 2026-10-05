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
 * first mutation (login, request access) would 403, so fetch any endpoint
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

/**
 * A multipart upload that reports its progress (spec 04.11): the same cookies,
 * CSRF header and ApiError as api(), through XMLHttpRequest because fetch has
 * no upload progress. `onProgress` gets 0 to 100 while the body is sent.
 */
export async function apiUpload<T>(
  path: string,
  body: FormData,
  options: { onProgress?: (percent: number) => void } = {},
): Promise<T> {
  await ensureCsrfCookie()
  const csrfToken = readCookie('XSRF-TOKEN')
  return new Promise<T>((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', `${API_URL}${path}`)
    request.withCredentials = true
    request.responseType = 'text'
    if (csrfToken) request.setRequestHeader('X-XSRF-TOKEN', decodeURIComponent(csrfToken))
    request.upload.onprogress = (event) => {
      if (event.lengthComputable && options.onProgress) {
        options.onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }
    request.onerror = () => reject(new ApiError(0))
    request.onload = () => {
      const parse = (): unknown => {
        try {
          return request.responseText ? (JSON.parse(request.responseText) as unknown) : undefined
        } catch {
          return undefined
        }
      }
      if (request.status < 200 || request.status >= 300) {
        reject(new ApiError(request.status, parse()))
        return
      }
      options.onProgress?.(100)
      resolve(parse() as T)
    }
    request.send(body)
  })
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

/**
 * What to show the user when a mutation is refused (spec 01.4). Every page
 * prints the same wording, so a 403, a 404, a 409 and a dead connection read
 * the same wherever the action happened.
 */
export function refusalMessage(error: unknown, myRole?: string | null): string {
  const unreachable = 'CarbonOS could not reach the server. Try again.'
  if (!(error instanceof ApiError) || error.status >= 500) return unreachable
  const detail = problemDetail(error)
  if (error.status === 403) {
    const sentence = detail ?? 'This action needs a role you do not hold in the organization.'
    return myRole === 'VERIFIER'
      ? `Your role is read-only in this organization. ${sentence}`
      : sentence
  }
  if (error.status === 404) {
    const missing = 'The item was not found. It may have been removed by someone else.'
    return detail ? `${missing} ${detail}` : missing
  }
  return detail ?? 'The change was refused.'
}
