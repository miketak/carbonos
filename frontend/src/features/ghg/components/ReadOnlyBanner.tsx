import type { MyRole } from '../roles'
import { isReadOnly } from '../roles'

/** Spec 01.4: a verifier is told, on every page of the organization, why nothing can be changed. */
export function ReadOnlyBanner({ myRole }: { myRole: MyRole | undefined }) {
  if (!isReadOnly(myRole)) return null
  return (
    <p
      role="status"
      className="mb-6 rounded-lg border border-teal/20 bg-white/70 px-4 py-2.5 text-sm font-medium text-dark-teal"
    >
      Your role in this organization is Verifier (read-only).
    </p>
  )
}
