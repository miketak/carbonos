import { useState } from 'react'
import { Button } from '../../../components/Button'
import { Modal } from '../../../components/Modal'
import { fieldErrors, problemDetail } from '../../../lib/api'
import { activityImportTemplateUrl } from '../api'
import type { ActivityImportResult } from '../api'
import { useImportActivities } from '../useGhg'

/**
 * Bulk entry from a CSV file (spec 04.5). The whole file is validated first:
 * every row imports, or none does and each rejected row is named with what
 * was wrong, so the corrected file can be uploaded again without doubling
 * records.
 */
export function ImportActivitiesModal({
  organizationId,
  onClose,
  onImported,
}: {
  organizationId: string
  onClose: () => void
  onImported: (count: number) => void
}) {
  const importActivities = useImportActivities(organizationId)
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ActivityImportResult | null>(null)
  const errors = fieldErrors(importActivities.error)
  const generalError =
    importActivities.isError && !errors ? problemDetail(importActivities.error) : undefined

  return (
    <Modal title="Import activity data" onClose={onClose}>
      <p className="text-sm text-ink-muted">
        One row per record. Facility and stream are matched by name; dates read as 2025-03-31;
        period end defaults to the start; data quality defaults to measured.{' '}
        <a
          href={activityImportTemplateUrl(organizationId)}
          className="font-semibold text-link hover:underline"
          download
        >
          Download the template
        </a>
        .
      </p>
      <p className="mt-2 text-sm text-ink-muted">
        Every row imports, or none does: a rejected row is named below with what was wrong, and a
        row that repeats a record already on file is rejected as a duplicate.
      </p>
      <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium">
        CSV file
        <input
          type="file"
          aria-label="CSV file"
          accept=".csv,text/csv"
          className="text-sm font-normal"
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null)
            setResult(null)
          }}
        />
        {errors?.file && (
          <span role="alert" className="text-xs font-medium text-red-600">
            {errors.file}
          </span>
        )}
      </label>
      {generalError && (
        <p role="alert" className="mt-2 text-sm font-medium text-red-600">
          {generalError}
        </p>
      )}
      {result && result.rejected.length > 0 && (
        <div className="mt-4 max-h-64 overflow-y-auto rounded-lg border border-red-200 bg-red-50/60 p-3">
          <p className="text-sm font-semibold text-red-700">
            Nothing imported: {result.rejected.length} row{result.rejected.length === 1 ? '' : 's'}{' '}
            rejected. Fix them and upload the file again.
          </p>
          <ul className="mt-2 flex flex-col gap-1 text-xs text-red-800">
            {result.rejected.map((rejection) => (
              <li key={rejection.row}>
                <span className="font-mono font-semibold">Row {rejection.row}:</span>{' '}
                {rejection.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Close
        </Button>
        <Button
          type="button"
          disabled={file === null}
          busy={importActivities.isPending}
          onClick={() => {
            if (!file) return
            importActivities.mutate(file, {
              onSuccess: (outcome) => {
                setResult(outcome)
                if (outcome.rejected.length === 0) onImported(outcome.imported)
              },
            })
          }}
        >
          Import
        </Button>
      </div>
    </Modal>
  )
}
