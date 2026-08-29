import { act, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { SplashGate, triggerSplash } from './SplashScreen'

test('plays after triggerSplash and unmounts when finished', () => {
  vi.useFakeTimers()
  try {
    render(<SplashGate />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    act(() => triggerSplash())
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('CarbonOS')).toBeInTheDocument()
    expect(screen.getByText('Measure. Certify. Sustain.')).toBeInTheDocument()
    expect(screen.getByText('Initializing inventory engine')).toBeInTheDocument()

    act(() => vi.advanceTimersByTime(11000))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  } finally {
    vi.useRealTimers()
  }
})

test('a click skips straight to the exit', () => {
  vi.useFakeTimers()
  try {
    render(<SplashGate />)
    act(() => triggerSplash())
    expect(screen.getByRole('status')).toBeInTheDocument()

    act(() => {
      window.dispatchEvent(new Event('pointerdown'))
    })
    act(() => vi.advanceTimersByTime(400))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  } finally {
    vi.useRealTimers()
  }
})

test('does nothing when no gate is mounted', () => {
  expect(() => triggerSplash()).not.toThrow()
})
