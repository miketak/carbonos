import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { InputField } from '../../components/Field'
import { Wordmark } from '../../components/Wordmark'
import { Skeleton } from '../../components/Skeleton'
import { fieldErrors, problemDetail } from '../../lib/api'
import { triggerSplash } from '../auth/SplashScreen'
import { sessionQueryKey } from '../auth/useSession'
import { completeSetup, getSetupInfo } from './api'

/** Destination of the approval email: set a password, get signed in, land in the app. */
export function SetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [mismatch, setMismatch] = useState(false)
  const [weak, setWeak] = useState(false)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const infoQuery = useQuery({
    queryKey: ['access', 'setup', token],
    queryFn: () => getSetupInfo(token),
    enabled: token !== '',
    retry: false,
  })

  const complete = useMutation({
    mutationFn: () => completeSetup(token, password),
    onSuccess: (user) => {
      queryClient.setQueryData(sessionQueryKey, user)
      triggerSplash()
      void navigate('/app', { replace: true })
    },
  })

  const errors = fieldErrors(complete.error)
  const generalError = complete.isError && !errors ? problemDetail(complete.error) : undefined

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    // spec 01.2: the same rule the server applies
    setWeak(false)
    if (!/^(?=.*[A-Za-z])(?=.*\d).{12,72}$/.test(password)) {
      setWeak(true)
      return
    }
    if (password !== confirm) {
      setMismatch(true)
      return
    }
    setMismatch(false)
    complete.mutate()
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-5 text-center">
          <Wordmark size="page" byline={false} />
          <h1 className="text-[32px] leading-tight font-semibold tracking-[-0.02em]">
            Set your password
          </h1>
        </div>

        {token === '' || infoQuery.isError ? (
          <div className="text-center">
            <p className="text-sm text-ink-muted">
              This link is invalid or has expired. Access links are valid for 7 days; you can always
              request access again.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-ink transition-colors duration-150 hover:bg-primary-hover"
            >
              Back to CarbonOS
            </Link>
          </div>
        ) : infoQuery.isPending ? (
          <div aria-label="Checking your link" className="flex flex-col gap-3">
            <Skeleton className="h-6" />
            <Skeleton className="h-24" />
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <p className="text-sm text-ink-muted">
              Welcome, <strong>{infoQuery.data.displayName}</strong>. Choose a password for{' '}
              <strong>{infoQuery.data.email}</strong>.
            </p>
            <InputField
              label="New password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={weak ? 'At least 12 characters, with a letter and a digit.' : errors?.password}
              hint="At least 12 characters, with a letter and a digit."
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
              Set password and sign in
            </Button>
          </form>
        )}
      </div>
    </main>
  )
}
