/**
 * A checkbox with a generous tap area (DR-02, WCAG 2.5.8): 40px on touch, at
 * least 28px on desktop, around a 20px control, well above the 24px minimum.
 */
export function TapCheckbox({
  label,
  checked,
  disabled = false,
  onChange,
}: {
  label: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="inline-flex h-10 w-10 cursor-pointer items-center justify-center md:h-7 md:w-7">
      <input
        type="checkbox"
        aria-label={label}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-teal-deep disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  )
}
