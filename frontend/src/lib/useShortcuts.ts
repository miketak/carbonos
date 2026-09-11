import { useEffect, useRef } from 'react'

export type ShortcutMap = Record<string, (event: KeyboardEvent) => void>

/**
 * Single-key shortcuts for a page. Keys typed into a field, with a modifier,
 * or while a modal dialog is open do nothing here, so `j` in a search box is
 * a letter and Esc in a modal belongs to the modal.
 */
export function useShortcuts(map: ShortcutMap, enabled = true) {
  const latest = useRef(map)
  useEffect(() => {
    latest.current = map
  })
  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.defaultPrevented) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return
      const handler = latest.current[event.key]
      if (!handler) return
      event.preventDefault()
      handler(event)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}
