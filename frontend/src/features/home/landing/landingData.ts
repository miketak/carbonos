import type { AccessIntent } from './intent'

/*
 * Copy for the landing page. Every capability stated in the present tense is
 * an Implemented spec (specs/README.md); every price is one ECORIV sets. The
 * claim IDs are those of the pitch pack's claims register.
 */

export interface Tier {
  id: string
  name: string
  audience: string
  price: string
  cadence: string
  priceNote?: string
  summary: string
  includes: string[]
  cta: string
  intent: AccessIntent
  flag?: string
  featured?: boolean
}

/*
 * Prices in Ghana cedis, exclusive of VAT and statutory levies. The pilot,
 * standalone, core and comprehensive prices are the ones in the pitch pack
 * (claims E-01 to E-04). Group is a proposed tier for multi-entity groups.
 */
export const TIERS: Tier[] = [
  {
    id: 'pilot',
    name: 'Pilot',
    audience: 'One site, three months, with ECORIV alongside',
    price: 'GHS 95,000',
    cadence: 'one-off',
    summary: 'Prove the record on one site before you commit the whole organization.',
    includes: [
      'One site or project, one reporting period',
      'Five named users: Owner, Preparer, Reviewer and two more',
      'Boundary workshop, source identification and factor pack selection',
      'First import done alongside your site team',
      'A frozen and final inventory, the PDF report and a scalability assessment',
      'Success criteria agreed at kick-off; 50% at kick-off, 50% at final',
    ],
    cta: 'Ask about the pilot',
    intent: 'pilot',
    flag: 'Start here',
    featured: true,
    priceNote: 'Services included. Credited against the first licence year.',
  },
  {
    id: 'standalone',
    name: 'Standalone licence',
    audience: 'Your own team runs the inventory',
    price: 'GHS 48,000',
    cadence: 'per organization, per year',
    summary:
      'The platform, the factor packs and the record, for a team that already runs its own inventory.',
    includes: [
      'One organization, up to 20 users, all four roles',
      'Ghana and UK DESNZ factor packs with editions and vintages',
      'CSV import with dry run, activity register and source documents',
      'Immutable runs, boundary versions, PDF report export',
      'Online help and email support on Accra business hours',
      'Pilot fee credited against the first year',
    ],
    cta: 'Request a licence',
    intent: 'licence',
  },
  {
    id: 'core',
    name: 'Core',
    audience: 'First inventory delivered with ECORIV',
    price: 'GHS 180,000',
    cadence: 'first year, licence included',
    summary: 'ECORIV builds the first inventory on the platform and hands your team the keys.',
    includes: [
      'Full organization inventory, all scopes in the boundary',
      'GHG policy framework and data request templates',
      'Reporting and verification support through the first ISO 14064-3 engagement',
      '20-user licence for one year',
      'Six months of support after final designation',
      '25% at signing, 25% at baseline, 25% at inventory, 25% at completion',
    ],
    cta: 'Talk to ECORIV',
    intent: 'talk',
  },
  {
    id: 'comprehensive',
    name: 'Comprehensive',
    audience: 'Two years, capacity building, year-two update',
    price: 'GHS 250,000',
    cadence: 'two years, licence included',
    summary:
      'Core, plus the change programme that makes the inventory a routine rather than a project.',
    includes: [
      'Everything in Core',
      'Unlimited users for two years',
      'Organizational change and capacity building for site data owners',
      'Year-two inventory update with base year recalculation check',
      'Twelve months of support',
      'Same payment terms and early-payment discounts as Core',
    ],
    cta: 'Talk to ECORIV',
    intent: 'talk',
  },
]

export const FAQ = [
  {
    q: 'We already do this in Excel. What changes?',
    a: 'Excel produces the total. It does not produce the record: boundary versions, factor vintages, the approval trail, a reason for every change. That record is what a verifier asks for, and rebuilding it after the fact is where verifications stall. CarbonOS writes it as you work.',
  },
  {
    q: 'Does it connect to our ERP, fuel cards or ECG bills?',
    a: 'Not yet. Site data comes in by CSV with a dry run that shows every rejection before anything is written. For an annual inventory that is faster to set up than an integration project. Integrations are on the roadmap.',
  },
  {
    q: 'Where is our data hosted and who can see it?',
    a: 'CarbonOS runs on Railway with separate QA, staging and production environments. Your organization is invisible to anyone who is not a member. If ECORIV support staff need to look, they must state a reason, access expires within 72 hours at most, and the grant is disclosed in your organization history.',
  },
  {
    q: 'Which emission factors does it carry?',
    a: 'The UK DESNZ conversion factors and a Ghana pack, both imported as editions with lineage and vintages. Adopting a new edition is a recorded decision, so a figure can always be traced to the factor year that produced it.',
  },
  {
    q: 'What about reduction targets and SBTi?',
    a: 'The inventory comes first; a target without a defensible base year is not credible. Reduction tracking and targets are on our roadmap, and we do not describe them as if they were here.',
  },
  {
    q: 'Who else uses it?',
    a: 'We are signing the first pilots now. The product was built by a consultancy that prepares these inventories, and every capability follows the GHG Protocol and ISO 14064. We can show a full inventory on an illustrative persona in fifteen minutes.',
  },
]

/*
 * Gye Nyame Gold is a fictional company. Every figure below is read from Run 001
 * of its FY2025 inventory in CarbonOS, built from the help centre's fixture
 * help/docs/assets/gye-nyame-2025.csv on 2026-09-28 (the Get started series).
 */
export const PERSONA = {
  name: 'Gye Nyame Gold',
  period: 'FY2025 · 1 Jan to 31 Dec 2025',
  boundary: 'Operational control · boundary version 3',
  run: 'Run 4 · final',
  total: 86412,
  scopes: [
    { name: 'Scope 1', value: 34194, note: 'Haul fleet diesel 11.9 ML, camp gensets, kitchen LPG' },
    { name: 'Scope 2', value: 32817, note: 'Grid electricity 70 GWh, location-based' },
    { name: 'Scope 3', value: 19401, note: 'Contract haulage; well-to-tank and T&D losses' },
  ],
  gases: [
    { gas: 'CO₂', mass: '45,124 t', gwp: 1, co2e: 45124, color: '#0b9a8a' },
    { gas: 'CH₄', mass: '147 kg', gwp: 28, co2e: 4, color: '#1f5fa8' },
    { gas: 'N₂O', mass: '1.751 t', gwp: 265, co2e: 464, color: '#56a11e' },
    { gas: 'No gas split', mass: 'Not separable', gwp: null, co2e: 40820, color: '#7a8c8a' },
  ],
  scope2: {
    location: 32817,
    market: 32817,
    note: 'No contractual instruments and no residual mix, so the market-based figure uses the same grid factor and says so.',
  },
}
