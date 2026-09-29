import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { HELP_TOPICS, helpHref } from '../../lib/helpHref'
import { renderWithProviders } from '../../test/utils'
import { me } from '../auth/api'
import { postFeedback, postSearchEvent } from './api'
import { FeedbackWidget } from './components/FeedbackWidget'
import HelpRoutes from './HelpRoutes'
import { manifest } from './manifest'
import { hasBody } from './pages'

vi.mock('./api', () => ({ postFeedback: vi.fn(), postSearchEvent: vi.fn() }))
vi.mock('../auth/api', () => ({ me: vi.fn(), login: vi.fn(), logout: vi.fn() }))

beforeEach(() => {
  vi.mocked(postFeedback).mockReset().mockResolvedValue(undefined)
  vi.mocked(postSearchEvent).mockReset().mockResolvedValue(undefined)
  vi.mocked(me)
    .mockReset()
    .mockResolvedValue(null as never)
  localStorage.clear()
  sessionStorage.clear()
})

function renderHelp(route: string) {
  return renderWithProviders(<HelpRoutes />, { route, path: '/help/*' })
}

test('every article in the tree has a compiled body, and every product deep link resolves', () => {
  for (const group of manifest.groups) {
    for (const slug of group.articles) {
      expect(manifest.pages[slug], `${slug} is in the tree but has no page`).toBeDefined()
      expect(hasBody(slug), `${slug} has no compiled body`).toBe(true)
    }
  }
  for (const [topic, slug] of Object.entries(HELP_TOPICS)) {
    if (slug)
      expect(
        manifest.pages[slug],
        `helpHref topic ${topic} points at a missing article`,
      ).toBeDefined()
  }
  expect(helpHref('hub')).toBe('/help')
  expect(helpHref('preflight', 'how-the-panel-reads')).toBe(
    '/help/inventories/clear-the-pre-flight-findings#how-the-panel-reads',
  )
})

test('the hub lists every group by its job, with a sign-in link for a visitor', async () => {
  renderHelp('/help')
  expect(
    await screen.findByRole('heading', { level: 1, name: 'CarbonOS help' }),
  ).toBeInTheDocument()
  for (const group of manifest.groups) {
    expect(screen.getByRole('heading', { level: 2, name: group.title })).toBeInTheDocument()
  }
  expect(await screen.findByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login')
})

test('a topic page shows its articles as cards with a description each', async () => {
  const group = manifest.groups[0]
  renderHelp(`/help/${group.slug}`)
  expect(await screen.findByRole('heading', { level: 1, name: group.title })).toBeInTheDocument()
  const first = manifest.pages[group.articles[0]]
  const main = screen.getByRole('main')
  expect(
    within(main).getAllByRole('link', { name: new RegExp(first.title) }).length,
  ).toBeGreaterThan(0)
  expect(within(main).getByText(first.description)).toBeInTheDocument()
})

test('an article renders its compiled body, breadcrumb and feedback', async () => {
  const slug = manifest.groups[1].articles[0]
  const page = manifest.pages[slug]
  renderHelp(`/help/${slug}`)
  expect(await screen.findByRole('heading', { level: 1, name: page.title })).toBeInTheDocument()
  expect(await screen.findByRole('article')).not.toBeEmptyDOMElement()
  const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' })
  expect(within(crumbs).getByRole('link', { name: 'Help' })).toHaveAttribute('href', '/help')
  expect(screen.getByText('Was this helpful?')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Still need help?' })).toBeInTheDocument()
})

test('a no vote asks for a reason and sends it once per browser', async () => {
  const user = userEvent.setup()
  renderWithProviders(<FeedbackWidget slug="access/request-access" />)
  await user.click(screen.getByRole('button', { name: 'No' }))
  await user.click(screen.getByRole('button', { name: 'Send' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Choose a reason.')
  await user.click(screen.getByRole('radio', { name: "It wasn't clear" }))
  await user.type(screen.getByLabelText(/Tell us more/), 'Where is the button?')
  await user.click(screen.getByRole('button', { name: 'Send' }))
  expect(await screen.findByText(/Thanks/)).toBeInTheDocument()
  expect(postFeedback).toHaveBeenCalledWith({
    pageSlug: 'access/request-access',
    helpful: false,
    reason: 'NOT_CLEAR',
    comment: 'Where is the button?',
  })
  expect(localStorage.getItem('help.feedback.access/request-access')).not.toBeNull()
})

test('search lands on sections and reports a miss once', async () => {
  renderHelp('/help/search?q=password')
  expect(await screen.findByRole('status')).toHaveTextContent(/result/)
  const results = screen.getAllByRole('link', { name: /password/i })
  expect(results.length).toBeGreaterThan(0)
  await vi.waitFor(() => expect(postSearchEvent).toHaveBeenCalledWith({ hit: true }), {
    timeout: 3000,
  })

  renderHelp('/help/search?q=zzqxv')
  expect(await screen.findByText(/Nothing matched/)).toBeInTheDocument()
  await vi.waitFor(
    () => expect(postSearchEvent).toHaveBeenCalledWith({ hit: false, query: 'zzqxv' }),
    {
      timeout: 3000,
    },
  )
})

test('a signed-in reader gets the account menu instead of a sign-in link', async () => {
  vi.mocked(me).mockResolvedValue({
    id: 'u1',
    email: 'abena@sankofa.test',
    displayName: 'Abena',
    role: 'MEMBER',
    status: 'ACTIVE',
  } as never)
  renderHelp('/help')
  expect(await screen.findByRole('button', { name: /Abena/ })).toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument()
})

test('an unknown page offers the groups', async () => {
  renderHelp('/help/nowhere/at-all')
  expect(await screen.findByRole('heading', { level: 1, name: /not here/ })).toBeInTheDocument()
})

// the takeover map covers the whole old site: articles, section indexes and the home page
const legacy = Object.entries(manifest.legacy)

test('the legacy map covers the old site and redirects to an article', async () => {
  expect(legacy.length).toBeGreaterThanOrEqual(54)
  const [path, target] = legacy.find(([, t]) => t in manifest.pages) ?? []
  expect(path).toBeDefined()
  renderHelp(path as string)
  expect(
    await screen.findByRole('heading', { level: 1, name: manifest.pages[target as string].title }),
  ).toBeInTheDocument()
})

test('a legacy index path redirects to the hub', async () => {
  const [path] = legacy.find(([, t]) => t === '') ?? []
  expect(path).toBeDefined()
  renderHelp(path as string)
  expect(
    await screen.findByRole('heading', { level: 1, name: 'CarbonOS help' }),
  ).toBeInTheDocument()
})

test('a legacy section path redirects to its topic page', async () => {
  const [path, target] = legacy.find(([, t]) => manifest.groups.some((g) => g.slug === t)) ?? []
  expect(path).toBeDefined()
  renderHelp(path as string)
  const group = manifest.groups.find((g) => g.slug === target)
  expect(await screen.findByRole('heading', { level: 1, name: group?.title })).toBeInTheDocument()
})
