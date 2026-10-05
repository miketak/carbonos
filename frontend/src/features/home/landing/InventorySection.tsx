import type { CSSProperties } from 'react'
import { PERSONA } from './landingData'
import { Reveal } from './Reveal'

const fmt = new Intl.NumberFormat('en-GH')

/** The published report of the example, as a panel: by scope, by gas footing to the total, Scope 2 both ways. */
export function InventorySection() {
  const max = Math.max(...PERSONA.scopes.map((s) => s.value))
  const gasTotal = PERSONA.gases.reduce((sum, g) => sum + g.co2e, 0)
  const ties = gasTotal === PERSONA.total

  return (
    <section id="inventory" className="landing-section">
      <div className="landing-container flex flex-col gap-10">
        <Reveal className="flex max-w-2xl flex-col gap-4">
          <p className="landing-eyebrow">What the report says</p>
          <h2 className="landing-title">Emissions by gas that tie to the total.</h2>
          <p className="landing-lede">
            The published report of a fictional gold mine, {PERSONA.name}, from run 4 of its FY2025
            inventory. Every line names its factor and edition.
          </p>
        </Reveal>

        <Reveal className="landing-frame" step={1}>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline px-6 py-6 sm:px-7">
            <div>
              <div className="landing-eyebrow mb-1 text-ink-muted">Total gross emissions</div>
              <div className="text-[40px] leading-[1.1] font-semibold tracking-[-0.02em] text-ink">
                {fmt.format(PERSONA.total)}{' '}
                <span className="text-base font-medium text-ink-muted">tCO₂e</span>
              </div>
            </div>
            <div className="text-[13px] text-ink-muted sm:text-right">
              {PERSONA.name} · {PERSONA.period}
              <br />
              {PERSONA.boundary} · {PERSONA.run}
            </div>
          </div>

          <div className="grid gap-px bg-hairline md:grid-cols-3">
            <div className="flex flex-col gap-4 bg-surface p-6 text-[13px] sm:p-7">
              <h3 className="font-semibold text-ink">By scope</h3>
              <ul className="flex flex-col gap-4" aria-label="Emissions by scope">
                {PERSONA.scopes.map((s, i) => (
                  <li key={s.name}>
                    <div className="flex justify-between text-ink">
                      <span>{s.name}</span>
                      <strong>{fmt.format(s.value)}</strong>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-sm bg-selected">
                      <div
                        className={`h-1.5 rounded-sm ${i === 0 ? 'bg-teal-deep' : i === 1 ? 'bg-teal' : 'bg-bright-teal'}`}
                        style={{ width: `${(s.value / max) * 100}%` } as CSSProperties}
                      />
                    </div>
                    <div className="mt-1 text-xs text-ink-muted">{s.note}</div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-surface p-6 text-[13px] sm:p-7">
              <h3 className="mb-4 font-semibold text-ink">
                By gas <span className="font-normal text-ink-muted">(GWP₁₀₀, AR5)</span>
              </h3>
              <table className="w-full">
                <thead>
                  <tr className="text-left text-ink-muted">
                    <th scope="col" className="pb-2 font-normal">
                      Gas
                    </th>
                    <th scope="col" className="pb-2 text-right font-normal">
                      Mass
                    </th>
                    <th scope="col" className="pb-2 text-right font-normal">
                      tCO₂e
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PERSONA.gases.map((g) => (
                    <tr key={g.gas} className={g.gwp === null ? 'text-ink-muted' : 'text-ink'}>
                      <th scope="row" className="py-1 text-left font-normal">
                        {g.gas}
                      </th>
                      <td className="py-1 text-right">{g.mass}</td>
                      <td className="py-1 text-right">{fmt.format(g.co2e)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-hairline font-semibold text-ink">
                    <th scope="row" className="pt-2 text-left">
                      Total
                    </th>
                    <td className="pt-2" />
                    <td className="pt-2 text-right">{fmt.format(gasTotal)}</td>
                  </tr>
                </tbody>
              </table>
              <p
                className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold ${ties ? 'text-link' : 'text-danger'}`}
              >
                {ties && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                )}
                {ties ? 'Ties to the total' : 'Does not tie to the total'}
              </p>
            </div>

            <div className="flex flex-col gap-4 bg-surface p-6 text-[13px] sm:p-7">
              <h3 className="font-semibold text-ink">Scope 2, both ways</h3>
              <div>
                <div className="flex justify-between text-ink">
                  <span>Location-based</span>
                  <strong>{fmt.format(PERSONA.scope2.location)}</strong>
                </div>
                <div className="mt-1 text-xs text-ink-muted">
                  Ghana grid factor · Ghana pack, 2025 edition
                </div>
              </div>
              <div>
                <div className="flex justify-between text-ink">
                  <span>Market-based</span>
                  <strong>{fmt.format(PERSONA.scope2.market)}</strong>
                </div>
                <div className="mt-1 text-xs text-ink-muted">{PERSONA.scope2.note}</div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
