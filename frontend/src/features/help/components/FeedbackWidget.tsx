import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../../components/Button'
import { TextAreaField } from '../../../components/Field'
import { fieldErrors } from '../../../lib/api'
import { postFeedback } from '../api'
import type { FeedbackReason } from '../api'

const REASONS: { value: FeedbackReason; label: string }[] = [
  { value: 'NOT_ACCURATE', label: "It wasn't accurate" },
  { value: 'NOT_CLEAR', label: "It wasn't clear" },
  { value: 'NOT_RELEVANT', label: "It wasn't relevant" },
]

const key = (slug: string) => `help.feedback.${slug}`

/**
 * "Was this helpful?" A yes is one click. A no asks why and, optionally, for
 * a sentence. One vote per browser per article; the server keeps one per
 * voter as well, so a changed mind replaces the earlier vote.
 */
export function FeedbackWidget({ slug }: { slug: string }) {
  const [state, setState] = useState<'ask' | 'why' | 'sending' | 'done'>(() => {
    try {
      return localStorage.getItem(key(slug)) ? 'done' : 'ask'
    } catch {
      return 'ask'
    }
  })
  const [reason, setReason] = useState<FeedbackReason | ''>('')
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | undefined>()

  const remember = () => {
    try {
      localStorage.setItem(key(slug), new Date().toISOString())
    } catch {
      // storage may be unavailable
    }
  }

  const send = async (helpful: boolean) => {
    setState('sending')
    setError(undefined)
    try {
      await postFeedback({
        pageSlug: slug,
        helpful,
        reason: helpful ? undefined : (reason as FeedbackReason),
        comment: helpful || comment.trim() === '' ? undefined : comment.trim(),
      })
      remember()
      setState('done')
    } catch (caught) {
      const fields = fieldErrors(caught)
      setError(fields?.comment ?? fields?.reason ?? 'Your feedback could not be sent. Try again.')
      setState(helpful ? 'ask' : 'why')
    }
  }

  const onSubmitNo = (event: FormEvent) => {
    event.preventDefault()
    if (!reason) {
      setError('Choose a reason.')
      return
    }
    void send(false)
  }

  return (
    <section className="help-feedback" aria-labelledby={`feedback-${slug.replace('/', '-')}`}>
      <div aria-live="polite">
        {state === 'done' && (
          <p className="help-feedback-thanks">Thanks. Your feedback shapes what we rewrite next.</p>
        )}
      </div>
      {state === 'done' ? null : (
        <p id={`feedback-${slug.replace('/', '-')}`} className="help-feedback-question">
          Was this helpful?
        </p>
      )}
      {state !== 'why' && state !== 'done' && (
        <div className="help-feedback-buttons">
          <Button
            type="button"
            variant="ghost"
            busy={state === 'sending'}
            onClick={() => void send(true)}
          >
            Yes
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={state === 'sending'}
            onClick={() => setState('why')}
          >
            No
          </Button>
        </div>
      )}
      {state === 'why' && (
        <form onSubmit={onSubmitNo} className="help-feedback-form" noValidate>
          <fieldset>
            <legend>What was wrong?</legend>
            {REASONS.map((r) => (
              <label key={r.value} className="help-feedback-reason">
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                />
                {r.label}
              </label>
            ))}
          </fieldset>
          <TextAreaField
            label="Tell us more (optional)"
            hint="Don't include personal details."
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={3}
            maxLength={500}
          />
          <div className="help-feedback-buttons">
            <Button type="submit">Send</Button>
            <Button type="button" variant="ghost" onClick={() => setState('ask')}>
              Cancel
            </Button>
          </div>
        </form>
      )}
      {error && (
        <p role="alert" className="help-error">
          {error}
        </p>
      )}
    </section>
  )
}
