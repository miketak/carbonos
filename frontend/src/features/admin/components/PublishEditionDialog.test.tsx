import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../../test/utils'
import { PublishEditionDialog } from './PublishEditionDialog'
import type { FactorPackEdition } from '../api'

vi.mock('../api', () => ({
  listFactorPacks: vi.fn(),
  createFactorPackFamily: vi.fn(),
  createFactorPackEdition: vi.fn(),
  getFactorPackEdition: vi.fn(),
  updateFactorPackEdition: vi.fn(),
  deleteFactorPackEdition: vi.fn(),
  listFactorPackRows: vi.fn(),
  createFactorPackRow: vi.fn(),
  updateFactorPackRow: vi.fn(),
  deleteFactorPackRow: vi.fn(),
  getFactorPackValidation: vi.fn(),
  listFactorPackChanges: vi.fn(),
  listFactorPackEvents: vi.fn(),
  getFactorPackBlastRadius: vi.fn(),
  uploadFactorPackEvidence: vi.fn(),
  publishFactorPackEdition: vi.fn(),
  withdrawFactorPackEdition: vi.fn(),
}))
vi.mock('../../auth/api', () => ({ login: vi.fn(), logout: vi.fn(), me: vi.fn() }))

import { publishFactorPackEdition, uploadFactorPackEvidence } from '../api'

const draft: FactorPackEdition = {
  editionId: 'defra-2027',
  packKey: 'defra',
  name: 'UK Government (DESNZ) GHG conversion factors 2027',
  status: 'DRAFT',
  source: 'UK Government (DESNZ) GHG Conversion Factors for Company Reporting, flat file',
  sourceUrl: 'https://example.test/defra-2027.xlsx',
  publicationYear: 2027,
  gwpBasis: 'AR5',
  license: 'Open Government Licence v3.0',
  retrieved: '2027-01-04',
  notes: null,
  appliesFrom: '2027-01-01',
  publishedAt: null,
  sourceDocument: null,
  evidenceChecksum: null,
  evidenceName: null,
  evidenceSize: null,
  curator: 'Ama Mensah',
  approver: null,
  provenanceReview: 'REVIEWED',
  provenanceNote: null,
  supersedesId: 'defra-2026',
  erratum: false,
  erratumNote: null,
  errorNote: null,
  withdrawnAt: null,
  withdrawnBy: null,
  withdrawalReason: null,
  mutable: true,
  rowCount: 1868,
  holderCount: 0,
}

beforeEach(() => {
  vi.mocked(uploadFactorPackEvidence).mockReset()
  vi.mocked(publishFactorPackEdition).mockReset()
})

function renderDialog(props: Partial<Parameters<typeof PublishEditionDialog>[0]> = {}) {
  return renderWithProviders(
    <PublishEditionDialog
      edition={draft}
      findings={[]}
      onClose={vi.fn()}
      onPublished={vi.fn()}
      onOpenBlastRadius={vi.fn()}
      {...props}
    />,
    { route: '/admin/factor-packs/defra-2027' },
  )
}

test('publishing is disabled while a rule is broken, and the dialog names the count', async () => {
  renderDialog({
    findings: [
      { rule: 'unit', code: 'DEFRA:one', message: 'not a registered unit' },
      { rule: 'code', code: 'two', message: 'needs a namespace' },
    ],
  })

  expect(screen.getByText(/2 rows break a rule/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /^publish$/i })).toBeDisabled()
})

test('publishing needs the source document, and the upload shows the checksum it computed', async () => {
  const user = userEvent.setup()
  vi.mocked(uploadFactorPackEvidence).mockResolvedValue({
    key: 'ghg/factor-packs/defra-2027/abc',
    name: 'defra-2027.pdf',
    size: 1024,
    checksum: 'a'.repeat(64),
  })
  renderDialog()

  expect(screen.getByText(/No source document yet/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /^publish$/i })).toBeDisabled()

  const file = new File(['the 2027 tables'], 'defra-2027.pdf', { type: 'application/pdf' })
  await user.upload(screen.getByLabelText(/source document$/i), file)

  await waitFor(() => expect(uploadFactorPackEvidence).toHaveBeenCalledWith('defra-2027', file))
  expect(await screen.findByTestId('evidence-checksum')).toHaveTextContent('a'.repeat(64))
  expect(screen.getByText(/computed over the bytes stored/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /^publish$/i })).toBeEnabled()
})

test('the gate says publishing moves no organization numbers, and who may not publish', async () => {
  renderDialog()

  expect(screen.getByText(/moves no organization's numbers/i)).toBeInTheDocument()
  expect(screen.getByText(/Ama Mensah built this draft/i)).toBeInTheDocument()
})

test('publishing sends the source document, the date, and the erratum answer', async () => {
  const user = userEvent.setup()
  const onPublished = vi.fn()
  vi.mocked(publishFactorPackEdition).mockResolvedValue({ ...draft, status: 'PUBLISHED' })
  renderDialog({ edition: { ...draft, evidenceChecksum: 'b'.repeat(64) }, onPublished })

  await user.clear(screen.getByLabelText(/source document as cited/i))
  await user.type(screen.getByLabelText(/source document as cited/i), 'DESNZ 2027 flat file (PDF)')
  await user.click(screen.getByRole('checkbox'))
  await user.type(screen.getByLabelText(/what was wrong/i), 'The butane row was mistranscribed.')
  await user.click(screen.getByRole('button', { name: /^publish$/i }))

  await waitFor(() =>
    expect(publishFactorPackEdition).toHaveBeenCalledWith('defra-2027', {
      sourceDocument: 'DESNZ 2027 flat file (PDF)',
      appliesFrom: '2027-01-01',
      erratum: true,
      erratumNote: 'The butane row was mistranscribed.',
    }),
  )
  await waitFor(() => expect(onPublished).toHaveBeenCalled())
})
