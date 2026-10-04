import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { InputField, SelectField } from '../../components/Field'
import { PageHeader } from '../../components/PageHeader'
import { Panel } from '../../components/Panel'
import { Skeleton } from '../../components/Skeleton'
import { useToast } from '../../components/toast'
import { fieldErrors, refusalMessage } from '../../lib/api'
import { approachLabels } from './format'
import type { MyRole } from './roles'
import {
  useCreateInventory,
  useInventoriesQuery,
  useInventoryQuery,
  useOrganizationQuery,
  useUpdateInventory,
} from './useGhg'
import type { ConsolidationApproach, GwpSet, Inventory, StraddleTreatment } from './api'

/** Whole months between two ISO dates (end inclusive), -1 when not whole, null while incomplete. */
function wholeMonths(start: string, end: string): number | null {
  if (!start || !end) return null
  const from = new Date(start + 'T00:00:00Z')
  const to = new Date(end + 'T00:00:00Z')
  to.setUTCDate(to.getUTCDate() + 1)
  if (to <= from) return null
  const months =
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + to.getUTCMonth() - from.getUTCMonth()
  return to.getUTCDate() === from.getUTCDate() ? months : -1
}

/**
 * The page that creates an inventory (`inventories/new`) or edits a draft's
 * settings (`inventories/:inventoryId/edit`): the name, period, purpose,
 * straddle treatment, approach and GWP set (specs 04.2 and 07.1). Copying a
 * view and pre-populating the boundary apply only on creation. A record with
 * an identity of its own gets the whole canvas, under a breadcrumb back to
 * its list (spec 08, form surfaces); a save lands on the inventory's
 * workbench, where the boundary is the next job.
 */
export function InventoryFormPage() {
  const { organizationId = '', inventoryId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const organizationQuery = useOrganizationQuery(organizationId)
  const inventoryQuery = useInventoryQuery(inventoryId ?? '')
  const myRole = organizationQuery.data?.myRole ?? null
  const listPath = `/app/ghg/${organizationId}/inventories`

  if (inventoryId && inventoryQuery.isPending) {
    return (
      <div aria-label="Loading inventory" className="flex flex-col gap-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-96 max-w-2xl" />
      </div>
    )
  }
  if (inventoryId && inventoryQuery.isError) {
    return (
      <Panel className="p-8 text-center">
        <h1 className="text-lg font-semibold">Inventory not found</h1>
        <p className="mt-1 text-sm text-ink-muted">
          It may have been deleted.{' '}
          <Link to={listPath} className="font-medium text-link hover:underline">
            Back to inventories
          </Link>
        </p>
      </Panel>
    )
  }

  const inventory = inventoryId ? inventoryQuery.data : undefined
  const title = inventory ? 'Edit inventory' : 'New inventory'
  const back = inventory ? `${listPath}/${inventory.id}` : listPath

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        size="md"
        back={{ to: back }}
        crumbs={[
          { label: 'Inventories', to: listPath },
          ...(inventory ? [{ label: inventory.name, to: back }] : []),
          { label: title },
        ]}
        title={title}
        subtitle={
          inventory
            ? 'The name, period, purpose, straddle treatment, approach and GWP set of this draft. The boundary and the records are edited on the workbench.'
            : 'One accounting view over the organization’s facts: a reporting period, a consolidation approach and the decisions this view makes about each record.'
        }
      />
      <InventoryForm
        key={inventory?.id ?? 'new'}
        title={title}
        organizationId={organizationId}
        inventory={inventory}
        myRole={myRole}
        onCancel={() => navigate(back)}
        onSaved={(saved, message) => {
          toast(message)
          navigate(`${listPath}/${saved.id}`)
        }}
      />
    </div>
  )
}

function InventoryForm({
  title,
  organizationId,
  inventory,
  myRole,
  onCancel,
  onSaved,
}: {
  title: string
  organizationId: string
  /** The draft being edited; absent when creating. */
  inventory?: Inventory
  myRole: MyRole | null
  onCancel: () => void
  onSaved: (saved: Inventory, message: string) => void
}) {
  const create = useCreateInventory(organizationId)
  const update = useUpdateInventory(organizationId)
  const mutation = inventory ? update : create
  const year = new Date().getFullYear()
  const [name, setName] = useState(inventory?.name ?? `${year} Corporate Inventory`)
  const [periodStart, setPeriodStart] = useState(inventory?.periodStart ?? `${year}-01-01`)
  const [periodEnd, setPeriodEnd] = useState(inventory?.periodEnd ?? `${year}-12-31`)
  const [purpose, setPurpose] = useState(inventory?.purpose ?? '')
  const [approach, setApproach] = useState<ConsolidationApproach>(
    inventory?.consolidationApproach ?? 'OPERATIONAL_CONTROL',
  )
  const [gwpSet, setGwpSet] = useState<GwpSet>(inventory?.gwpSet ?? 'AR5')
  const [straddleTreatment, setStraddleTreatment] = useState<StraddleTreatment>(
    inventory?.straddleTreatment ?? 'PRO_RATE',
  )
  const [prefillBoundary, setPrefillBoundary] = useState(true)
  const [copyFromInventoryId, setCopyFromInventoryId] = useState('')
  const inventoriesQuery = useInventoriesQuery(organizationId)
  const periodMonths = wholeMonths(periodStart, periodEnd)
  // spec 05.4: across approaches the boundary follows from Table 1, not from the source's decisions
  const source = (inventoriesQuery.data ?? []).find(
    (candidate) => candidate.id === copyFromInventoryId,
  )
  const rebuilds = !!source && source.consolidationApproach !== approach

  const errors = fieldErrors(mutation.error)
  const generalError =
    mutation.isError && !errors ? refusalMessage(mutation.error, myRole) : undefined

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const input = {
      name,
      periodStart,
      periodEnd,
      purpose: purpose.trim() === '' ? undefined : purpose,
      consolidationApproach: approach,
      gwpSet,
      straddleTreatment,
    }
    if (inventory) {
      update.mutate(
        { id: inventory.id, input },
        { onSuccess: (saved) => onSaved(saved, `${saved.name} updated.`) },
      )
      return
    }
    create.mutate(
      {
        ...input,
        prefillBoundary: copyFromInventoryId === '' ? prefillBoundary : false,
        copyFromInventoryId: copyFromInventoryId === '' ? undefined : copyFromInventoryId,
      },
      { onSuccess: (saved) => onSaved(saved, `${saved.name} created.`) },
    )
  }

  return (
    // the name lets the QA driver and the tests address the form the way they address a dialog
    <form
      aria-label={title}
      onSubmit={submit}
      className="flex max-w-[760px] flex-col gap-6"
      noValidate
    >
      <InputField
        label="Name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={errors?.name}
        required
      />
      <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
        <InputField
          label="Period start"
          type="date"
          value={periodStart}
          onChange={(event) => setPeriodStart(event.target.value)}
          error={errors?.periodStart}
          required
        />
        <InputField
          label="Period end"
          type="date"
          value={periodEnd}
          onChange={(event) => setPeriodEnd(event.target.value)}
          error={errors?.periodEnd}
          required
        />
      </div>
      {periodMonths !== null && periodMonths !== 12 && (
        <p role="status" className="text-[13px] font-medium text-warning">
          This period is{' '}
          {periodMonths === -1 ? 'not a whole number of months' : `${periodMonths} months`}. Chapter
          9 expects an annual inventory; keep it only if the period is deliberate.
        </p>
      )}
      {periodMonths === 12 && periodStart.slice(5) !== '01-01' && (
        <p role="status" className="text-[13px] text-ink-muted">
          A fiscal year: the inventory will be labelled FY{periodStart.slice(0, 4)}/
          {periodEnd.slice(2, 4)}.
        </p>
      )}
      <SelectField
        label="Records that straddle the period or a membership window"
        value={straddleTreatment}
        onChange={(event) => setStraddleTreatment(event.target.value as StraddleTreatment)}
        hint="An annual total for a site acquired mid-year is either counted for the days inside, with the split on the line, or blocked until split (spec 04.2)."
      >
        <option value="PRO_RATE">Pro-rate by days (default)</option>
        <option value="BLOCK">Block the run until the record is split</option>
      </SelectField>
      <InputField
        label="Purpose (optional)"
        placeholder="Corporate reporting, UK regulatory…"
        value={purpose}
        onChange={(event) => setPurpose(event.target.value)}
        error={errors?.purpose}
      />
      <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
        <SelectField
          label="Consolidation approach"
          value={approach}
          onChange={(event) => setApproach(event.target.value as ConsolidationApproach)}
          error={errors?.consolidationApproach}
          hint="How facility emissions roll up in this view: by equity share, or all-or-nothing under control."
        >
          {Object.entries(approachLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="GWP set"
          value={gwpSet}
          onChange={(event) => setGwpSet(event.target.value as GwpSet)}
          hint="The IPCC 100-year global warming potentials the report converts each gas with (spec 07.1)."
        >
          <option value="AR5">AR5 (default)</option>
          <option value="AR6">AR6</option>
        </SelectField>
      </div>
      {generalError && (
        <p role="alert" className="text-sm font-medium text-danger">
          {generalError}
        </p>
      )}
      {!inventory && (
        <>
          <SelectField
            label="Copy the view from (optional)"
            value={copyFromInventoryId}
            onChange={(event) => setCopyFromInventoryId(event.target.value)}
            hint="The boundary, instruments, declaration and every classification and exclusion of that inventory, so a second inventory or next year's starts from its decisions."
          >
            <option value="">Start from scratch</option>
            {(inventoriesQuery.data ?? []).map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name} ({candidate.periodLabel})
              </option>
            ))}
          </SelectField>
          {rebuilds && (
            <p role="status" className="text-[13px] font-medium text-warning">
              {source.name} is under {approachLabels[source.consolidationApproach].toLowerCase()}.
              Under {approachLabels[approach].toLowerCase()} the boundary is rebuilt from Table 1:
              every entity with a share joins with its facilities, the source's computed exclusions
              are dropped and listed, and leased assignments take their Appendix F scope under this
              approach. The decisions themselves are kept.
            </p>
          )}
          <label className="flex items-start gap-2.5 text-[15px]">
            <input
              type="checkbox"
              aria-label="Start with every operation the approach includes in the boundary"
              disabled={copyFromInventoryId !== ''}
              checked={copyFromInventoryId === '' ? prefillBoundary : false}
              onChange={(event) => setPrefillBoundary(event.target.checked)}
              className="mt-0.5 size-[18px] accent-primary"
            />
            <span>
              Start with every operation the approach includes in the boundary
              <span className="block text-[13px] text-ink-muted">
                Chapter 3: under a control approach every controlled operation is in by definition.
                Leaving one out is then an exclusion with a reason.
              </span>
            </span>
          </label>
        </>
      )}
      <div className="flex justify-end gap-3 border-t border-hairline pt-5">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" busy={mutation.isPending}>
          {inventory ? 'Save changes' : 'Create inventory'}
        </Button>
      </div>
    </form>
  )
}
