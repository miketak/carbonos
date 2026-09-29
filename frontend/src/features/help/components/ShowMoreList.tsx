import { useState } from 'react'
import { Link } from 'react-router-dom'

interface Item {
  to: string
  label: string
}

/** A plain list that folds past `fold` items behind a "Show more" button. */
export function ShowMoreList({ items, fold = 8 }: { items: Item[]; fold?: number }) {
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? items : items.slice(0, fold)
  const hidden = items.length - shown.length
  return (
    <>
      <ul className="help-list">
        {shown.map((item) => (
          <li key={item.to}>
            <Link to={item.to}>{item.label}</Link>
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <button type="button" className="help-more" onClick={() => setExpanded(true)}>
          Show more ({hidden})
        </button>
      )}
    </>
  )
}
