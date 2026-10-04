import { useId } from 'react'
import type {
  ComponentPropsWithRef,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

/** The 44 px control of the kit (spec 10); exported for the fields that compose it elsewhere. */
export const controlClasses =
  'w-full min-h-11 rounded-lg border border-hairline-strong bg-surface px-3 py-2 text-ink transition-colors duration-150 placeholder:text-ink-muted focus:border-primary focus:ring-2 focus:ring-focus/40 focus:outline-none disabled:opacity-50'

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
      <label htmlFor={htmlFor} className="text-[13px] font-medium">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-[13px] text-ink-muted">{hint}</p>}
      {error && (
        <p role="alert" className="text-[13px] font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

interface InputFieldProps extends ComponentPropsWithRef<'input'> {
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

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
}

export function TextAreaField({ label, error, hint, id, ...props }: TextAreaFieldProps) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  return (
    <FieldShell label={label} error={error} hint={hint} htmlFor={fieldId}>
      <textarea
        id={fieldId}
        className={`${controlClasses} min-h-22`}
        aria-invalid={!!error}
        rows={3}
        {...props}
      />
    </FieldShell>
  )
}
