import { useState } from 'react'
import { Button } from '../../../components/Button'
import { Drawer } from '../../../components/Drawer'
import { InputField, SelectField } from '../../../components/Field'
import { Skeleton } from '../../../components/Skeleton'
import { refusalMessage } from '../../../lib/api'
import { usePackRowsQuery } from '../useGhg'
import type { FactorPack, PackRow } from '../api'

const PAGE_SIZE = 50

interface PackRowsDrawerProps {
  organizationId: string
  pack: FactorPack
  onClose: () => void
}

/**
 * The factors an edition carries, read without importing it (spec 02.8).
 *
 * A row is identified by its publisher taxonomy and its unit as much as by its
 * name: 1,157 of the 1,868 rows of defra-2026 share a name with another row,
 * and the three named "Gaseous fuels: Butane" differ only by unit, at 3,033.38,
 * 1.745 and 0.222 kg CO2e per unit.
 */
export function PackRowsDrawer({ organizationId, pack, onClose }: PackRowsDrawerProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(0)
  const rows = usePackRowsQuery(organizationId, pack.id, {
    q: search || undefined,
    category: category || undefined,
    page,
    size: PAGE_SIZE,
  })

  const total = rows.data?.total ?? 0
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1
  const to = Math.min((page + 1) * PAGE_SIZE, total)

  return (
    <Drawer
      eyebrow="Factor pack"
      title={pack.name}
      subtitle={
        <span>
          {pack.source}
          {pack.publicationYear ? `, ${pack.publicationYear}` : ''} · IPCC {pack.gwpBasis} ·{' '}
          {pack.license} · retrieved {pack.retrieved}
        </span>
      }
      onClose={onClose}
    >
      <p className="text-sm text-ink-muted">
        Reading a pack changes nothing. Import it from the factors page when you want its rows in
        this organization.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <InputField
          label="Search"
          value={search}
          placeholder="A code, a name or a detail"
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(0)
          }}
        />
        <SelectField
          label="Publisher's category"
          value={category}
          onChange={(event) => {
            setCategory(event.target.value)
            setPage(0)
          }}
        >
          <option value="">Every category</option>
          {(rows.data?.categories ?? []).map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </SelectField>
      </div>

      {rows.isPending && <Skeleton className="mt-4 h-40" />}
      {rows.isError && (
        <p role="alert" className="mt-4 text-sm font-medium text-red-600">
          {refusalMessage(rows.error)}
        </p>
      )}

      {rows.data && rows.data.rows.length === 0 && (
        <p className="mt-4 text-sm text-ink-muted">No factor in this pack matches.</p>
      )}

      {rows.data && rows.data.rows.length > 0 && (
        <ul className="mt-4 grid gap-0">
          {rows.data.rows.map((row: PackRow) => (
            <li
              key={row.code}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-teal/5 py-2 last:border-0"
            >
              <span className="min-w-0 flex-1">
                <span className="font-medium">{row.name}</span>
                <span className="block text-xs text-ink-muted">
                  {[row.sourceCategory, row.sourceActivity, row.sourceDetail]
                    .filter(Boolean)
                    .join(' / ')}
                </span>
                <span className="block font-mono text-xs break-all text-ink-muted">{row.code}</span>
              </span>
              <span className="text-right">
                <span className="block tabular-nums">
                  {row.kgCo2ePerUnit} <span className="text-ink-muted">kg CO2e</span>
                </span>
                <span className="block text-xs text-ink-muted">per {row.unit}</span>
                {row.co2eOnly && <span className="block text-xs text-ink-muted">CO2e only</span>}
                {!row.approved && (
                  <span className="block text-xs font-semibold text-amber-700">Not approved</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {rows.data && total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-ink-muted">
            {from} to {to} of {total.toLocaleString()}
          </span>
          <span className="flex gap-2">
            <Button
              variant="ghost"
              className="px-3 py-1 text-xs"
              disabled={page === 0}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              className="px-3 py-1 text-xs"
              disabled={to >= total}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </span>
        </div>
      )}
    </Drawer>
  )
}
