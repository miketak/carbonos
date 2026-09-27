import { useState } from 'react'
import type { CSSProperties } from 'react'
import { PERSONA } from './landingData'
import { Reveal } from './Reveal'

const fmt = new Intl.NumberFormat('en-GH')

export function InventorySection() {
  const [table, setTable] = useState(false)
  const max = Math.max(...PERSONA.scopes.map((s) => s.value))
  const gasTotal = PERSONA.gases.reduce((sum, g) => sum + g.co2e, 0)

  return (
    <section id="inventory" className="landing-section">
      <div className="landing-container">
        <Reveal className="landing-head">
          <p className="landing-eyebrow">What the report says</p>
          <h2 className="landing-title">Emissions by gas that tie to the total.</h2>
          <p className="landing-lede">
            The report prints the required disclosures, Scope 2 both ways with the instrument
            criteria, the Scope 3 declaration cross-check, and a gas table whose CO₂-equivalents
            reconcile to the total. This is what a lender or an EPA officer receives.
          </p>
        </Reveal>

        <Reveal className="report" step={1}>
          <div className="report-head">
            <div>
              <span className="report-org">{PERSONA.name}</span>
              <span className="report-meta">
                {PERSONA.period} · {PERSONA.boundary} · {PERSONA.run}
              </span>
            </div>
            <div className="report-total">
              <span className="report-total-label">Total gross emissions</span>
              <span className="report-total-value">
                {fmt.format(PERSONA.total)} <span className="report-total-unit">tCO₂e</span>
              </span>
            </div>
          </div>

          <div className="report-grid">
            <div className="report-panel">
              <h3 className="report-panel-title">By scope</h3>
              <ul className="bars" aria-label="Emissions by scope">
                {PERSONA.scopes.map((s, i) => (
                  <li
                    key={s.name}
                    className="bar"
                    style={{ '--stagger': i } as React.CSSProperties}
                  >
                    <span className="bar-label">{s.name}</span>
                    <span className="bar-track">
                      <span
                        className="bar-fill"
                        style={{ '--w': `${(s.value / max) * 100}%` } as CSSProperties}
                      />
                    </span>
                    <span className="bar-value">{fmt.format(s.value)}</span>
                    <span className="bar-note">{s.note}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="report-panel">
              <div className="flex items-center justify-between gap-3">
                <h3 className="report-panel-title">By gas (GWP₁₀₀, AR5)</h3>
                <button
                  type="button"
                  className="report-toggle"
                  onClick={() => setTable((t) => !t)}
                  aria-pressed={table}
                >
                  Table view
                </button>
              </div>
              {table ? (
                <table className="gas-table">
                  <thead>
                    <tr>
                      <th scope="col">Gas</th>
                      <th scope="col">Mass</th>
                      <th scope="col">GWP</th>
                      <th scope="col">tCO₂e</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PERSONA.gases.map((g) => (
                      <tr key={g.gas}>
                        <th scope="row">{g.gas}</th>
                        <td>{g.mass}</td>
                        <td>{g.gwp}</td>
                        <td>{fmt.format(g.co2e)}</td>
                      </tr>
                    ))}
                    <tr className="gas-table-total">
                      <th scope="row">Total</th>
                      <td />
                      <td />
                      <td>{fmt.format(gasTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <>
                  <div
                    className="stack"
                    role="img"
                    aria-label={`Stacked bar of emissions by gas totalling ${fmt.format(gasTotal)} tonnes CO2 equivalent`}
                  >
                    {PERSONA.gases.map((g) => (
                      <span
                        key={g.gas}
                        className="stack-seg"
                        style={
                          {
                            '--w': `${(g.co2e / gasTotal) * 100}%`,
                            '--c': g.color,
                          } as CSSProperties
                        }
                        title={`${g.gas}: ${fmt.format(g.co2e)} tCO₂e`}
                      />
                    ))}
                  </div>
                  <ul className="gas-legend">
                    {PERSONA.gases.map((g) => (
                      <li key={g.gas} className="gas-legend-item">
                        <span
                          className="gas-swatch"
                          style={{ '--c': g.color } as CSSProperties}
                          aria-hidden
                        />
                        <span className="gas-name">{g.gas}</span>
                        <span className="gas-detail">
                          {g.mass} × {g.gwp} = <strong>{fmt.format(g.co2e)}</strong>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className={`gas-tie ${gasTotal === PERSONA.total ? 'is-ok' : 'is-off'}`}>
                    {gasTotal === PERSONA.total ? 'Ties to the total' : 'Does not tie to the total'}
                    : {fmt.format(gasTotal)} tCO₂e
                  </p>
                </>
              )}
            </div>

            <div className="report-panel report-panel--wide">
              <h3 className="report-panel-title">Scope 2, both ways</h3>
              <div className="dual">
                <div className="dual-item">
                  <span className="dual-label">Location-based</span>
                  <span className="dual-value">{fmt.format(PERSONA.scope2.location)}</span>
                  <span className="dual-note">Ghana grid factor · Ghana pack, 2025 edition</span>
                </div>
                <div className="dual-item">
                  <span className="dual-label">Market-based</span>
                  <span className="dual-value">{fmt.format(PERSONA.scope2.market)}</span>
                  <span className="dual-note">No instruments meeting the Quality Criteria</span>
                </div>
                <p className="dual-explain">{PERSONA.scope2.note}</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
