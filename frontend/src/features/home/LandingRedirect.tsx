import { Navigate } from 'react-router-dom'
import { LoadingCard } from '../../components/LoadingCard'
import { useSession } from '../auth/useSession'
import { ghgLandingPath } from '../ghg/navigation'
import { useOrganizationsQuery } from '../ghg/useGhg'

/**
 * `/app` resolves rather than renders (spec 01.6). One rule serves the login
 * form, the set-password flow and every bookmark of `/app`: an administrator's
 * work starts in the administration panel, everybody else's in their
 * organization.
 */
export function LandingRedirect() {
  const session = useSession()
  const isAdmin = session.data?.role === 'ADMIN'
  // not merely `!isAdmin`: until the session has resolved, an administrator
  // would look like a member and fetch the membership list on the way past,
  // which is the list spec 01.5 keeps out of the panel
  const organizationsQuery = useOrganizationsQuery({ enabled: !!session.data && !isAdmin })

  if (session.isPending) return <LoadingCard />
  if (isAdmin) return <Navigate to="/admin" replace />

  if (organizationsQuery.isPending) return <LoadingCard label="Opening your workspace" />

  // on an error `data` is undefined, so this lands on the list, which renders
  // the failure itself: a failed lookup must never strand anyone here
  return <Navigate to={ghgLandingPath(organizationsQuery.data)} replace />
}
