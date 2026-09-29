import { useEffect, useRef, useState } from 'react'
import { Reveal } from './Reveal'
import { useReducedMotion } from './useReducedMotion'

const QUESTIONS = [
  'Which legal entities were in the boundary on 1 March, and under which consolidation approach?',
  'Why is the generator diesel at the Obuasi camp in Scope 1 and the contractor haulage in Scope 3?',
  'Which edition of the grid factor produced the Scope 2 figure, and who adopted it?',
  'Who approved run 3, and why does run 4 exist?',
  'What changed in the report after the board signed it?',
]

const LEDGER = [
  {
    time: '09:12',
    who: 'A. Mensah (Preparer)',
    what: 'Adopted DESNZ 2025 edition · reason: annual factor update',
  },
  {
    time: '11:40',
    who: 'K. Boateng (Reviewer)',
    what: 'Approved run 3 · self-approval refused for the preparer',
  },
  {
    time: '14:05',
    who: 'A. Mensah (Preparer)',
    what: 'Voided run 3 · reason: Site B November diesel double-counted',
  },
  {
    time: '14:31',
    who: 'System',
    what: 'Run 4 · final run refused: unflagged proxy density on LPG',
  },
  {
    time: '15:02',
    who: 'A. Mensah (Preparer)',
    what: 'Flagged density as proxy · run 4 passed · frozen: boundary version 3',
  },
]

/**
 * The verifier's questions rotate once through the list while the card is on
 * screen, then rest on the last one; the ledger fills once and stays filled.
 * Nothing here loops forever and nothing is announced to a screen reader.
 */
export function ProblemSection() {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const [onScreen, setOnScreen] = useState(false)
  const [q, setQ] = useState(reduced ? QUESTIONS.length - 1 : 0)
  const [rows, setRows] = useState(reduced ? LEDGER.length : 1)

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setOnScreen(true)
      return
    }
    const observer = new IntersectionObserver((entries) =>
      setOnScreen(entries.some((entry) => entry.isIntersecting)),
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (reduced || !onScreen || q >= QUESTIONS.length - 1) return
    const id = setTimeout(() => setQ((n) => n + 1), 3600)
    return () => clearTimeout(id)
  }, [reduced, onScreen, q])

  useEffect(() => {
    if (reduced || !onScreen || rows >= LEDGER.length) return
    const id = setTimeout(() => setRows((n) => n + 1), 1500)
    return () => clearTimeout(id)
  }, [reduced, onScreen, rows])

  return (
    <section id="product" className="landing-section" ref={ref}>
      <div className="landing-container">
        <Reveal className="landing-head">
          <p className="landing-eyebrow">The problem</p>
          <h2 className="landing-title">The problem is not the arithmetic. It is the record.</h2>
          <p className="landing-lede">
            A verifier does not start with your total. They start with your boundary, then each
            source and why it sits in its scope, then the factor behind every figure, then who
            approved what and why anything changed. In a spreadsheet that record lives in file
            names, email threads and memory.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Reveal className="problem-card problem-card--sheet" step={1}>
            <div className="problem-card-head">
              <span className="problem-card-title">The spreadsheet</span>
              <span className="problem-pill problem-pill--warn">inventory_FINAL_v7 (2).xlsx</span>
            </div>
            <div className="sheet">
              <div className="sheet-row sheet-row--head">
                <span>Source</span>
                <span>Factor</span>
                <span>tCO₂e</span>
              </div>
              <div className="sheet-row">
                <span>Grid electricity</span>
                <span className="sheet-cell--overwritten">0.4034 (2024)</span>
                <span>38,320</span>
              </div>
              <div className="sheet-row">
                <span>Fleet diesel</span>
                <span>2.68</span>
                <span className="sheet-cell--overwritten">34,194</span>
              </div>
              <div className="sheet-row sheet-row--ghost">
                <span>Contractor haulage</span>
                <span>?</span>
                <span>0</span>
              </div>
            </div>
            <div className="problem-verifier">
              <span className="problem-verifier-label">
                The verifier asks ({q + 1} of {QUESTIONS.length})
              </span>
              <p key={q} className="problem-verifier-q">
                “{QUESTIONS[q]}”
              </p>
              <p className="problem-verifier-a">
                The team reconstructs it. The verification stalls.
              </p>
            </div>
          </Reveal>

          <Reveal className="problem-card problem-card--ledger" step={2}>
            <div className="problem-card-head">
              <span className="problem-card-title">The CarbonOS record</span>
              <span className="problem-pill problem-pill--ok">Written as you work</span>
            </div>
            <ol className="ledger" aria-label="Organization history">
              {LEDGER.slice(0, rows).map((row, i) => (
                <li key={row.time} className="ledger-row" data-latest={i === rows - 1}>
                  <span className="ledger-time">{row.time}</span>
                  <span className="ledger-body">
                    <span className="ledger-who">{row.who}</span>
                    <span className="ledger-what">{row.what}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="ledger-foot">
              Every boundary change, factor edition, run, approval and correction is written down by
              the product, with a reason, at the moment it happens. Nothing changes silently.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
