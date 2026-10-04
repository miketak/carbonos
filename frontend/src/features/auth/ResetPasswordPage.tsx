import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { InputField } from '../../components/Field'
import { Skeleton } from '../../components/Skeleton'
import { Wordmark } from '../../components/Wordmark'
import { ApiError, fieldErrors, problemDetail } from '../../lib/api'
import {
  PASSWORD_RULE,
  completePasswordReset,
  getPasswordResetInfo,
  meetsPasswordPolicy,
} from './passwordApi'

const buttonLinkClasses =
  'mt-6 inline-flex min-h-11 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-ink transition-colors duration-150 hover:bg-primary-hover'

/** A refused link: the server's own sentence (used, expired, not valid) and the way to a new one. */
function linkRefusal(error: unknown): string | undefined {
  if (error instanceof ApiError && (error.status === 404 || error.status === 410)) {
    return problemDetail(error) ?? 'This reset link is not valid.'
  }
  return undefined
}

/** Destination of the reset email (spec 01.9): choose a new password, then sign in with it. */
export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [weak, setWeak] = useState(false)
  const [mismatch, setMismatch] = useState(false)
  const navigate = useNavigate()

  const infoQuery = useQuery({
    queryKey: ['auth', 'password-reset', token],
    queryFn: () => getPasswordResetInfo(token),
    enabled: token !== '',
    retry: false,
  })

  const complete = useMutation({
    mutationFn: () => completePasswordReset(token, password),
    onSuccess: () => void navigate('/login', { replace: true, state: { passwordReset: true } }),
  })

  const refusal =
    token === ''
      ? 'This reset link is not valid.'
      : (linkRefusal(infoQuery.error) ?? linkRefusal(complete.error))
  const errors = fieldErrors(complete.error)
  const generalError =
    (infoQuery.isError && !refusal) || (complete.isError && !errors && !refusal)
      ? 'Something went wrong. Please try again.'
      : undefined

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    setWeak(false)
    setMismatch(false)
    if (!meetsPasswordPolicy(password)) {
      setWeak(true)
      return
    }
    if (password !== confirm) {
      setMismatch(true)
      return
    }
    complete.mutate()
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-5 text-center">
          <Wordmark size="page" byline={false} />
          <h1 className="text-[32px] leading-tight font-semibold tracking-[-0.02em]">
            Choose a new password
          </h1>
        </div>

        {refusal ? (
          <div className="text-center">
            <p role="alert" className="text-sm text-ink-muted">
              {refusal} Ask for a new link and use the latest email.
            </p>
            <Link to="/forgot-password" className={buttonLinkClasses}>
              Ask for a new link
            </Link>
          </div>
        ) : infoQuery.isPending ? (
          <div aria-label="Checking your link" className="flex flex-col gap-3">
            <Skeleton className="h-6" />
            <Skeleton className="h-24" />
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            {infoQuery.data && (
              <p className="text-sm text-ink-muted">
                Choose a new password for <strong>{infoQuery.data.email}</strong>. Every session of
                the account is signed out when you save it.
              </p>
            )}
            <InputField
              label="New password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={weak ? PASSWORD_RULE : errors?.password}
              hint={PASSWORD_RULE}
              required
            />
            <InputField
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              error={mismatch ? 'Passwords do not match.' : undefined}
              required
            />
            {generalError && (
              <p role="alert" className="text-sm font-medium text-danger">
                {generalError}
              </p>
            )}
            <Button type="submit" busy={complete.isPending} className="mt-2 w-full">
              Set new password
            </Button>
          </form>
        )}
      </div>
    </main>
  )
}
