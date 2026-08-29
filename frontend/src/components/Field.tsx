import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

const controlClasses =
  'w-full rounded-lg border border-teal/20 bg-white/70 px-3 py-2 text-dark-teal transition-colors duration-150 placeholder:text-dark-teal/40 focus:border-bright-teal focus:ring-2 focus:ring-bright-teal/40 focus:outline-none disabled:opacity-50'

interface FieldShellProps {
  label: string
  error?: string
  hint?: string
  htmlFor: string
  children: ReactNode
}

function FieldShell({ label, error, hint, htmlFor, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-dark-teal/60">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export function InputField({ label, error, hint, id, ...props }: InputFieldProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  return (
    <FieldShell label={label} error={error} hint={hint} htmlFor={fieldId}>
      <input id={fieldId} className={controlClasses} aria-invalid={!!error} {...props} />
    </FieldShell>
  )
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  hint?: string
}

export function SelectField({ label, error, hint, id, children, ...props }: SelectFieldProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  return (
    <FieldShell label={label} error={error} hint={hint} htmlFor={fieldId}>
      <select id={fieldId} className={controlClasses} aria-invalid={!!error} {...props}>
        {children}
      </select>
    </FieldShell>
  )
}
