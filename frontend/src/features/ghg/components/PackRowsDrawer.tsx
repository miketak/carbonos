import { useState } from 'react'
import { Button } from '../../../components/Button'
import { Drawer } from '../../../components/Drawer'
import { FilterRow, FilterSelect, SearchField } from '../../../components/FilterRow'
import { Skeleton } from '../../../components/Skeleton'
import { StatusDot } from '../../../components/StatusDot'
import { Table, TableFooter, Td } from '../../../components/Table'
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
      <div className="flex flex-col gap-5">
        <p className="text-ink-muted">
          Reading a pack changes nothing. Import it from the factors page when you want its rows in
          this organization.
        </p>

        <FilterRow
          search={
            <SearchField
              label="Search"
              value={search}
              placeholder="A code, a name or a detail"
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(0)
              }}
            />
          }
        >
          <FilterSelect
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
          </FilterSelect>
        </FilterRow>

        {rows.isPending && <Skeleton className="h-40" />}
        {rows.isError && (
          <p role="alert" className="text-sm font-medium text-danger">
            {refusalMessage(rows.error)}
          </p>
        )}

        {rows.data && rows.data.rows.length === 0 && (
          <p className="text-sm text-ink-muted">No factor in this pack matches.</p>
        )}

        {rows.data && rows.data.rows.length > 0 && (
          <Table>
            <tbody>
              {rows.data.rows.map((row: PackRow) => (
                <tr key={row.code}>
                  <Td>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{row.name}</span>
                      <span className="text-[13px] text-ink-muted">
                        {[row.sourceCategory, row.sourceActivity, row.sourceDetail]
                          .filter(Boolean)
                          .join(' / ')}
                      </span>
                      <span className="text-[13px] break-all text-ink-muted">{row.code}</span>
                    </div>
                  </Td>
                  <Td align="right">
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="font-medium">
                        {row.kgCo2ePerUnit} <span className="text-ink-muted">kg CO2e</span>
                      </span>
                      <span className="text-[13px] text-ink-muted">per {row.unit}</span>
                      {row.co2eOnly && (
                        <span className="text-[13px] text-ink-muted">CO2e only</span>
                      )}
                      {!row.approved && (
                        <StatusDot tone="warning" className="text-[13px]">
                          Not approved
                        </StatusDot>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {rows.data && total > PAGE_SIZE && (
          <TableFooter
            pager={
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                >
                  Previous
                </Button>
                <span aria-hidden="true" className="mx-2 h-5 w-px bg-hairline" />
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={to >= total}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </>
            }
          >
            {from} to {to} of {total.toLocaleString()}
          </TableFooter>
        )}
      </div>
    </Drawer>
  )
}
