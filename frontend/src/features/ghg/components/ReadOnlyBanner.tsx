import { Banner } from '../../../components/Banner'
import type { MyRole } from '../roles'
import { isReadOnly } from '../roles'

/** Spec 01.4: a verifier is told, on every page of the organization, why nothing can be changed. */
export function ReadOnlyBanner({ myRole }: { myRole: MyRole | undefined }) {
  if (!isReadOnly(myRole)) return null
  return (
    <Banner role="status" tone="neutral" className="mb-6 font-medium">
      Your role in this organization is Verifier (read-only).
    </Banner>
  )
}
