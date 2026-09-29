import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '../../components/Button'
import { HelpLink } from '../../components/HelpLink'
import { InputField, TextAreaField } from '../../components/Field'
import { Modal } from '../../components/Modal'
import { fieldErrors, problemDetail } from '../../lib/api'
import { submitAccessRequest } from './api'
import { INTENT_COPY } from '../home/landing/intent'
import type { AccessIntent } from '../home/landing/intent'

/**
 * The landing-page access form: name, email, optional company. The `intent`
 * names the button the visitor pressed (the pilot, a licence, a conversation)
 * so the form titles itself accordingly; the request itself is the same.
 */
export function RequestAccessModal({
  onClose,
  intent = 'access',
}: {
  onClose: () => void
  intent?: AccessIntent
}) {
  const copy = INTENT_COPY[intent]
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [message, setMessage] = useState('')

  const submit = useMutation({
    mutationFn: () =>
      submitAccessRequest({
        displayName,
        email,
        company: company.trim() === '' ? undefined : company,
        intent: copy.code,
        message: message.trim() === '' ? undefined : message.trim(),
      }),
  })

  const errors = fieldErrors(submit.error)
  const generalError = submit.isError && !errors ? problemDetail(submit.error) : undefined

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    submit.mutate()
  }

  if (submit.isSuccess) {
    return (
      <Modal title={copy.doneTitle} onClose={onClose}>
        <p className="text-sm text-ink-muted">
          Thanks, {displayName.trim() || 'there'}. {copy.done} <strong>{email}</strong>.
        </p>
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title={copy.title} onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <p className="text-sm text-ink-muted">
          {copy.note} <HelpLink topic="requestAccess" label="How access works" />
        </p>
        <InputField
          label="Full name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          error={errors?.displayName}
          required
        />
        <InputField
          label="Work email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors?.email}
          required
        />
        <InputField
          label="Company (optional)"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          error={errors?.company}
        />
        <TextAreaField
          label="Anything we should know? (optional)"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          error={errors?.message}
          rows={3}
          maxLength={1000}
        />
        {generalError && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {generalError}
          </p>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" busy={submit.isPending}>
            {copy.action}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
