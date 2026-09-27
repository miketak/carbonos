import { Reveal } from './Reveal'

const ITEMS = [
  {
    title: 'Made for Ghana and West Africa',
    body: 'A Ghana factor pack beside the UK DESNZ set, cedi pricing, and a team in Accra that prepares these inventories for mines, drilling contractors and construction firms.',
  },
  {
    title: 'Four roles, every refusal explained',
    body: 'Owner, Preparer, Reviewer and Verifier. When the product refuses an action, the screen says why and names the role that can do it.',
  },
  {
    title: 'Your organization is invisible to outsiders',
    body: 'Nobody outside your organization can see that it exists. Support access needs a stated reason, expires within 72 hours, and is disclosed in your history.',
  },
  {
    title: 'Deliberate by design',
    body: 'A run is a snapshot you can defend and a published report is a document you can reproduce. Nothing updates itself behind your back and nothing is decided for you.',
  },
]

export function TrustSection() {
  return (
    <section className="landing-section">
      <div className="landing-container">
        <Reveal className="landing-head">
          <p className="landing-eyebrow">Rooted in Ghana, serving West Africa</p>
          <h2 className="landing-title">
            Built by the consultancy that prepares these inventories.
          </h2>
          <p className="landing-lede">
            ECORIV Land Limited built CarbonOS because we prepare greenhouse gas inventories
            ourselves and wanted to stop rebuilding the verification record by hand. We deliver the
            first inventories on it; your team, or another consultancy, licenses it after that.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {ITEMS.map((item, i) => (
            <Reveal key={item.title} className="trust" step={i}>
              <h3 className="trust-title">{item.title}</h3>
              <p className="trust-body">{item.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
