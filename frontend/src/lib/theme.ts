import { useCallback, useEffect, useState } from 'react'

/*
 * The theme choice (spec 10, ADR 0009): light, dark, or follow the operating
 * system. It is a per-browser convenience kept in local storage, never an
 * account setting, and it never reaches the server. The resolved theme is
 * the `data-theme` attribute on <html>; index.html applies it before first
 * paint from the same key, so a dark-theme reader never sees a light flash.
 */

export type ThemeChoice = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'carbonos.theme'

const choices: ReadonlyArray<ThemeChoice> = ['light', 'dark', 'system']

function isChoice(value: unknown): value is ThemeChoice {
  return typeof value === 'string' && (choices as ReadonlyArray<string>).includes(value)
}

/** The stored choice, or `system` when nothing valid is stored (or storage is unavailable). */
export function readThemeChoice(): ThemeChoice {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return isChoice(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

function systemTheme(): ResolvedTheme {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function resolveTheme(choice: ThemeChoice): ResolvedTheme {
  return choice === 'system' ? systemTheme() : choice
}

/** Sets `data-theme` on the document so the token sets in index.css switch. */
export function applyTheme(choice: ThemeChoice): ResolvedTheme {
  const resolved = resolveTheme(choice)
  document.documentElement.dataset.theme = resolved
  return resolved
}

/**
 * The theme as a hook: the choice, what it resolves to, and a setter that
 * persists and applies it. Following the system also follows a change of
 * the system's preference while the app is open.
 */
export function useTheme(): {
  choice: ThemeChoice
  resolved: ResolvedTheme
  setTheme: (choice: ThemeChoice) => void
} {
  const [choice, setChoice] = useState<ThemeChoice>(readThemeChoice)
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolveTheme(choice))

  useEffect(() => {
    setResolved(applyTheme(choice))
    if (choice !== 'system' || typeof matchMedia !== 'function') return
    const query = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setResolved(applyTheme('system'))
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [choice])

  const setTheme = useCallback((next: ThemeChoice) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // a per-viewer convenience only; losing it is fine
    }
    setChoice(next)
  }, [])

  return { choice, resolved, setTheme }
}
