import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { THEME_STORAGE_KEY, applyTheme, readThemeChoice, resolveTheme, useTheme } from './theme'

function stubSystemDark(dark: boolean) {
  const listeners = new Set<() => void>()
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: dark && query.includes('dark'),
    media: query,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  }))
  return listeners
}

describe('theme', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('follows the system when nothing is stored, and ignores junk', () => {
    stubSystemDark(true)
    expect(readThemeChoice()).toBe('system')
    expect(resolveTheme('system')).toBe('dark')
    localStorage.setItem(THEME_STORAGE_KEY, 'sepia')
    expect(readThemeChoice()).toBe('system')
  })

  it('applies the resolved theme to the document', () => {
    stubSystemDark(false)
    expect(applyTheme('dark')).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(applyTheme('system')).toBe('light')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('persists a choice and applies it', () => {
    stubSystemDark(false)
    const { result } = renderHook(() => useTheme())
    expect(result.current.choice).toBe('system')
    expect(result.current.resolved).toBe('light')
    act(() => result.current.setTheme('dark'))
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(result.current.resolved).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('tracks a change of the system preference while following it', () => {
    const listeners = stubSystemDark(false)
    const { result } = renderHook(() => useTheme())
    expect(result.current.resolved).toBe('light')
    stubSystemDark(true)
    act(() => listeners.forEach((fn) => fn()))
    expect(result.current.resolved).toBe('dark')
  })
})
