import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { InputField } from '../../components/Field'
import { Wordmark } from '../../components/Wordmark'
import { ApiError } from '../../lib/api'
import { login } from './api'
import { endSignOut } from './signOut'
import { triggerSplash } from './SplashScreen'
import { sessionQueryKey } from './useSession'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const state =
    (location.state as { from?: string; signedOut?: boolean; passwordReset?: boolean } | null) ?? {}
  // a sign-out clears the deep link: the next account lands where its own
  // work starts, not on the page the previous account was bounced from
  const from = state.signedOut ? undefined : state.from
  // the sign-out that brought a visitor here is over once the page is up
  useEffect(endSignOut, [])

  const signIn = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: (user) => {
      queryClient.setQueryData(sessionQueryKey, user)
      triggerSplash()
      // a deep link wins; otherwise "/app" resolves where this account's work
      // starts, so the rule lives in one place (spec 01.6)
      void navigate(from ?? '/app', { replace: true })
    },
  })

  const errorMessage =
    signIn.error instanceof ApiError && signIn.error.status === 401
      ? 'Invalid email or password.'
      : signIn.error
        ? 'Something went wrong. Please try again.'
        : undefined

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    signIn.mutate()
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-5 text-center">
          <Wordmark size="page" byline={false} />
          <h1 className="text-[32px] leading-tight font-semibold tracking-[-0.02em]">Sign in</h1>
        </div>
        {state.passwordReset && (
          <p
            role="status"
            className="mb-4 rounded-lg border border-hairline border-l-[3px] border-l-info bg-surface px-4 py-3 text-sm"
          >
            Your password is reset. Sign in with your new password.
          </p>
        )}
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <InputField
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <InputField
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {errorMessage && (
            <p role="alert" className="text-sm font-medium text-danger">
              {errorMessage}
            </p>
          )}
          <Button type="submit" busy={signIn.isPending} className="mt-2 w-full">
            Sign in
          </Button>
          <Link
            to="/forgot-password"
            className="text-center text-sm font-medium text-link hover:underline"
          >
            Forgot your password?
          </Link>
        </form>
      </div>
    </main>
  )
}
