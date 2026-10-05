import { FAQ } from './landingData'
import { Reveal } from './Reveal'

export function FaqSection() {
  return (
    <section id="faq" className="landing-section">
      <div className="landing-container landing-container--narrow flex flex-col gap-8">
        <Reveal className="flex flex-col gap-4">
          <p className="landing-eyebrow">Honest answers</p>
          <h2 className="landing-title">Questions a finance lead asks first.</h2>
        </Reveal>
        <div className="flex flex-col border-t border-hairline">
          {FAQ.map((item, i) => (
            <Reveal key={item.q} as="details" className="faq" step={i} open={i === 0}>
              <summary className="faq-q">
                {item.q}
                <span className="faq-chevron" aria-hidden>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <p className="faq-a">{item.a}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
