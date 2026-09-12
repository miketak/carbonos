import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { SourceDocumentsPage } from './SourceDocumentsPage'
import type { EvidenceDocument } from './api'

vi.mock('./api', () => import('./testApiMock'))

import { getOrganization, listFacilities, listImportBatches, searchEvidence } from './api'

const invoice: EvidenceDocument = {
  id: 'ev-1',
  kind: 'FILE',
  name: 'invoice-2938.pdf',
  url: null,
  contentType: 'application/pdf',
  sizeBytes: 20480,
  uploadedBy: 'kojo@ecoriv.test',
  uploadedAt: '2026-09-01T10:00:00Z',
  activityId: 'act-1',
  recordNo: 1,
  recordRef: 'ACT-0001',
  activityType: 'Diesel consumption',
  streamName: 'Standby gensets',
  facilityId: 'fac-1',
  facilityName: 'Nkran Mine',
  periodStart: '2025-03-01',
  periodEnd: '2025-03-31',
  evidenceRef: 'INV-2938',
  recordRemoved: false,
  calculated: true,
}

const orphan: EvidenceDocument = {
  ...invoice,
  id: 'ev-2',
  kind: 'LINK',
  name: 'ECG bill (SharePoint)',
  url: 'https://example.com/ecg',
  activityId: 'act-2',
  recordNo: 2,
  recordRef: 'ACT-0002',
  activityType: 'Grid electricity',
  recordRemoved: true,
  calculated: false,
}

beforeEach(() => {
  vi.mocked(searchEvidence)
    .mockReset()
    .mockResolvedValue({ items: [invoice, orphan], page: 0, size: 24, total: 2 })
  vi.mocked(listImportBatches)
    .mockReset()
    .mockResolvedValue([
      {
        id: 'batch-1',
        fileName: 'q1-dispensing.csv',
        sha256: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
        rowCount: 13,
        sizeBytes: 2048,
        importedBy: 'kojo@ecoriv.test',
        importedAt: '2026-09-02T10:00:00Z',
        firstRecordRef: 'ACT-0003',
        lastRecordRef: 'ACT-0015',
      },
    ])
  vi.mocked(listFacilities).mockReset().mockResolvedValue([])
  vi.mocked(getOrganization).mockReset().mockResolvedValue({
    id: 'org-1',
    name: 'Ecoriv Holdings',
    myRole: 'OWNER',
    address: null,
    contact: null,
    facilityCount: 1,
    supportAccess: [],
    createdAt: '2026-08-01T00:00:00Z',
  })
})

function renderPage() {
  return renderWithProviders(<SourceDocumentsPage />, {
    route: '/app/ghg/org-1/activity/documents',
    path: '/app/ghg/:organizationId/activity/documents',
  })
}

test('lists each document with its record, the imported files, and the index download', async () => {
  renderPage()

  expect(await screen.findByText('invoice-2938.pdf')).toHaveAttribute(
    'href',
    '/api/ghg/evidence/ev-1',
  )
  expect(screen.getByRole('link', { name: 'ACT-0001 · Diesel consumption →' })).toHaveAttribute(
    'href',
    '/app/ghg/org-1/activity?record=act-1',
  )
  expect(screen.getByText('ACT-0002 · Grid electricity')).toHaveClass('line-through')
  expect(screen.getByText('(record removed)')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'q1-dispensing.csv' })).toHaveAttribute(
    'href',
    '/api/ghg/import-batches/batch-1/file',
  )
  expect(screen.getByText(/13 rows \(ACT-0003 to ACT-0015\)/)).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Remove invoice-2938.pdf' })).not.toBeInTheDocument()
  expect(screen.getByText('on a calculated run')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Remove ECG bill (SharePoint)' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Download evidence index (CSV)' })).toHaveAttribute(
    'href',
    '/api/ghg/organizations/org-1/evidence/index.csv',
  )
})

test('the search and the filter ask the server', async () => {
  const user = userEvent.setup()
  renderPage()
  await screen.findByText('invoice-2938.pdf')

  await user.type(screen.getByLabelText('Search'), 'ecg')
  await waitFor(() =>
    expect(searchEvidence).toHaveBeenLastCalledWith(
      'org-1',
      expect.objectContaining({ q: 'ecg', page: 0, size: 24 }),
    ),
  )
  await user.selectOptions(screen.getByLabelText('Show'), 'ORPHANED')
  await waitFor(() =>
    expect(searchEvidence).toHaveBeenLastCalledWith(
      'org-1',
      expect.objectContaining({ filter: 'ORPHANED' }),
    ),
  )
})

test('a verifier cannot upload or remove a document (spec 01.4)', async () => {
  vi.mocked(getOrganization).mockResolvedValue({
    id: 'org-1',
    name: 'Ecoriv Holdings',
    myRole: 'VERIFIER',
    address: null,
    contact: null,
    facilityCount: 1,
    supportAccess: [],
    createdAt: '2026-08-01T00:00:00Z',
  })
  renderPage()
  await screen.findByText('invoice-2938.pdf')

  // nothing on the page lets a verifier attach a new document
  expect(screen.queryByRole('button', { name: /attach/i })).not.toBeInTheDocument()
  expect(document.querySelector('input[type="file"]')).not.toBeInTheDocument()

  // removal stays visible, so the page keeps its shape, but is refused
  const remove = screen.getByRole('button', { name: 'Remove ECG bill (SharePoint)' })
  expect(remove).toBeDisabled()
  expect(remove).toHaveAttribute('title', 'Needs the Preparer, Reviewer or Owner role.')
  expect(remove).toHaveAccessibleDescription('Needs the Preparer, Reviewer or Owner role.')
})
