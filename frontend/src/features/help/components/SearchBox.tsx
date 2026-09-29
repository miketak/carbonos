import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

export function SearchBox({
  initial = '',
  autoFocus = false,
  id = 'help-search',
}: {
  initial?: string
  autoFocus?: boolean
  id?: string
}) {
  const [value, setValue] = useState(initial)
  const navigate = useNavigate()
  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const q = value.trim()
    if (q) navigate(`/help/search?q=${encodeURIComponent(q)}`)
  }
  return (
    <form role="search" onSubmit={onSubmit} className="help-searchbox">
      <label htmlFor={id} className="sr-only">
        Search the help
      </label>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search the help"
        autoComplete="off"
        autoFocus={autoFocus}
      />
    </form>
  )
}
