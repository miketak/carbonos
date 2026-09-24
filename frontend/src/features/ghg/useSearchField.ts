import { useEffect, useRef, useState } from 'react'

/**
 * Local state for a search box whose value lives in the URL (spec 04.6,
 * spec 05.6). The box keeps every keystroke; the URL, and the query behind
 * it, follow after a short pause.
 *
 * Writing each keystroke straight into the URL lost characters: every key
 * navigated, the re-render lagged behind the next key, and the controlled
 * input snapped back to the older value. A link or the back button still
 * changes the URL under the box, and the box follows it.
 */
export function useSearchField(
  committed: string,
  commit: (value: string) => void,
  delayMs = 250,
): { value: string; onChange: (next: string) => void } {
  const [value, setValue] = useState(committed)
  const pending = useRef<string | null>(null)
  const commitRef = useRef(commit)
  commitRef.current = commit

  // the URL moved on its own (a link, the back button, "Resolve n items"): follow it
  useEffect(() => {
    if (pending.current === null) setValue(committed)
  }, [committed])

  useEffect(() => {
    if (pending.current === null) return
    const next = pending.current
    const timer = setTimeout(() => {
      pending.current = null
      commitRef.current(next)
    }, delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return {
    value,
    onChange: (next: string) => {
      pending.current = next
      setValue(next)
    },
  }
}
