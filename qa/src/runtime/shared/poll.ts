/** Waits are conditions, never bare sleeps. */
export async function until<T>(probe: () => Promise<T | undefined>, timeoutMs: number, everyMs = 250): Promise<T | undefined> {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    const value = await probe()
    if (value !== undefined) return value
    if (Date.now() >= deadline) return undefined
    await new Promise((resolve) => setTimeout(resolve, everyMs))
  }
}
