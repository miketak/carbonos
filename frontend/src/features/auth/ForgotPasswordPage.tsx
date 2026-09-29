import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button } from '../../components/Button'
import { InputField } from '../../components/Field'
import { GlassCard } from '../../components/GlassCard'
import { Wordmark } from '../../components/Wordmark'
import { ApiError, fieldErrors, problemDetail } from '../../lib/api'
import { requestPasswordReset } from './passwordApi'

const linkClasses = 'text-sm font-medium text-link hover:underline'

/**
 * "Forgot your password?" (spec 01.9). The confirmation reads the same
 * whether or not the address has an account, because the server's answer
 * does.
 */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [missing, setMissing] = useState(false)

  const send = useMutation({ mutationFn: () => requestPasswordReset(email.trim()) })

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (email.trim() === '') {
      setMissing(true)
      return
    }
    setMissing(false)
    send.mutate()
  }

  const errors = fieldErrors(send.error)
  const generalError =
    send.error instanceof ApiError && send.error.status === 429
      ? problemDetail(send.error)
      : send.isError && !errors
        ? 'Something went wrong. Please try again.'
        : undefined

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <GlassCard className="w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <Wordmark size="page" />
          <h1 className="mt-4 text-xl">Reset your password</h1>
        </div>

        {send.isSuccess ? (
          <div className="flex flex-col gap-4 text-center">
            <p className="text-sm text-ink-muted">
              If <strong>{email.trim()}</strong> belongs to an active CarbonOS account, a reset link
              is on its way. The link is valid for 1 hour and works once.
            </p>
            <Link to="/login" className={linkClasses}>
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <p className="text-sm text-ink-muted">
              Enter the email you sign in with. We will send a link to choose a new password.
            </p>
            <InputField
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={missing ? 'Enter your email.' : errors?.email}
            />
            {generalError && (
              <p role="alert" className="text-sm font-medium text-red-600">
                {generalError}
              </p>
            )}
            <Button type="submit" busy={send.isPending} className="mt-2">
              Send reset link
            </Button>
            <Link to="/login" className={`${linkClasses} text-center`}>
              Back to sign in
            </Link>
          </form>
        )}
      </GlassCard>
    </main>
  )
}
