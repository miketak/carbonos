import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '../../components/Button'
import { InputField } from '../../components/Field'
import { Modal } from '../../components/Modal'
import { fieldErrors, problemDetail } from '../../lib/api'
import { submitAccessRequest } from './api'

/** The landing-page "Request access" form: name, email, optional company. */
export function RequestAccessModal({ onClose }: { onClose: () => void }) {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')

  const submit = useMutation({
    mutationFn: () =>
      submitAccessRequest({
        displayName,
        email,
        company: company.trim() === '' ? undefined : company,
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
      <Modal title="Request received" onClose={onClose}>
        <p className="text-sm text-ink-muted">
          Thanks, {displayName.trim() || 'there'} — your request is with our team. Once it's
          approved you'll get an email at <strong>{email}</strong> with a link to set your password.
        </p>
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Request access" onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
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
            Request access
          </Button>
        </div>
      </form>
    </Modal>
  )
}
