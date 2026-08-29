import { useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { InputField } from '../../components/Field'
import { GlassCard } from '../../components/GlassCard'
import { ApiError } from '../../lib/api'
import { login } from './api'
import { sessionQueryKey } from './useSession'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/app'

  const signIn = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: (user) => {
      queryClient.setQueryData(sessionQueryKey, user)
      void navigate(from, { replace: true })
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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-soft-mint via-soft-mint to-bright-teal/20 p-6">
      <GlassCard className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <p className="bg-gradient-to-r from-teal to-accent-green bg-clip-text text-2xl font-bold text-transparent">
            ECORIV
          </p>
          <h1 className="mt-1 text-xl">Sign in to CarbonOS</h1>
          <p className="mt-1 text-sm text-dark-teal/60">Measure. Certify. Sustain.</p>
        </div>
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
            <p role="alert" className="text-sm font-medium text-red-600">
              {errorMessage}
            </p>
          )}
          <Button type="submit" busy={signIn.isPending} className="mt-2">
            Sign in
          </Button>
        </form>
      </GlassCard>
    </main>
  )
}
