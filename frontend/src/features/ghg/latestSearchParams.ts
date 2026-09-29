import { useCallback, useLayoutEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * `useSearchParams`, with an updater that sees every earlier write.
 *
 * React Router hands a functional update the parameters of the last render.
 * Two writes before the next render, such as a debounced search committing
 * just after a facility was picked, then each start from the same old URL and
 * the second drops the first. This hook applies each update to the latest
 * parameters written, and follows the URL again whenever it moves.
 */
export function useLatestSearchParams(): [
  URLSearchParams,
  (update: (previous: URLSearchParams) => URLSearchParams) => void,
] {
  const [params, setParams] = useSearchParams()
  const latest = useRef(params)
  // the URL moved (a navigation, a link, the back button): it is the latest again
  useLayoutEffect(() => {
    latest.current = params
  }, [params])

  const update = useCallback(
    (fn: (previous: URLSearchParams) => URLSearchParams) => {
      const next = fn(new URLSearchParams(latest.current))
      latest.current = next
      setParams(next, { replace: true })
    },
    [setParams],
  )
  return [params, update]
}
