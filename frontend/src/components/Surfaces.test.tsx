import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Banner } from './Banner'
import { Chip } from './Chip'
import { Panel, PanelBody, PanelHead } from './Panel'
import { Stat, StatStrip } from './StatStrip'
import { Table, TableFooter, Td, Th, TwoLine } from './Table'

test('a panel is flat: one surface, one hairline, and a head with its actions', () => {
  render(
    <Panel aria-label="Factor packs">
      <PanelHead title="Factor packs" description="Built from published tables.">
        <button type="button">Import pack</button>
      </PanelHead>
      <PanelBody>rows</PanelBody>
    </Panel>,
  )
  const panel = screen.getByLabelText('Factor packs')
  expect(panel.className).toContain('border-hairline')
  expect(panel.className).not.toContain('backdrop-blur')
  expect(screen.getByRole('heading', { level: 2, name: 'Factor packs' })).toBeInTheDocument()
  expect(screen.getByText('Built from published tables.')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Import pack' })).toBeInTheDocument()
})

test('a chip is an outlined label and a banner a notice with a coloured edge', () => {
  render(
    <>
      <Chip tone="primary">Final</Chip>
      <Banner tone="warning" title="Launch on hold" role="status">
        Classification is blocking.
      </Banner>
    </>,
  )
  expect(screen.getByText('Final').className).toContain('border-primary')
  const banner = screen.getByRole('status')
  expect(banner.className).toContain('border-l-warning-dot')
  expect(screen.getByText('Launch on hold')).toBeInTheDocument()
  expect(screen.getByText('Classification is blocking.')).toBeInTheDocument()
})

test('a stat strip is a definition list of figures with their units', () => {
  render(
    <StatStrip label="Record completeness">
      <Stat label="Records ready" value="5" unit="of 7" note="Nothing here has been verified." />
      <Stat label="Needs attention" value="2" />
    </StatStrip>,
  )
  const strip = screen.getByLabelText('Record completeness')
  expect(strip.tagName).toBe('DL')
  expect(screen.getByText('Records ready')).toBeInTheDocument()
  expect(screen.getByText('of 7')).toBeInTheDocument()
  expect(screen.getByText('Nothing here has been verified.')).toBeInTheDocument()
})

test('a table keeps its semantics and aligns quantities to the right', () => {
  render(
    <>
      <Table aria-label="Activity">
        <thead>
          <tr>
            <Th>Activity</Th>
            <Th align="right">Quantity</Th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <Td>
              <TwoLine primary="Haul fleet diesel" secondary="Haul fleet · ACT-0001" />
            </Td>
            <Td align="right">
              <TwoLine primary="11,923,608" secondary="litre" align="right" />
            </Td>
          </tr>
        </tbody>
      </Table>
      <TableFooter pager={<button type="button">Next</button>}>7 of 7 records</TableFooter>
    </>,
  )
  expect(screen.getByRole('table', { name: 'Activity' })).toBeInTheDocument()
  expect(screen.getByRole('columnheader', { name: 'Quantity' }).className).toContain('text-right')
  expect(screen.getByText('Haul fleet · ACT-0001')).toBeInTheDocument()
  expect(screen.getByText('7 of 7 records')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
})
