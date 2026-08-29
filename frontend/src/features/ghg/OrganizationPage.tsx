import { Link, useParams } from 'react-router-dom'
import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
import { ActivitiesSection } from './components/ActivitiesSection'
import { ApproachBadge } from './components/badges'
import { FacilitiesSection } from './components/FacilitiesSection'
import { GhgHeader } from './components/GhgHeader'
import { RunsSection } from './components/RunsSection'
import { useOrganizationQuery } from './useGhg'

/** One organization's full GHG workflow: boundary → activity data → runs. */
export function OrganizationPage() {
  const { organizationId = '' } = useParams()
  const organizationQuery = useOrganizationQuery(organizationId)
  const organization = organizationQuery.data

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-mint via-soft-mint to-bright-teal/15">
      <GhgHeader />

      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-10">
        <div>
          <Link to="/app/ghg" className="text-sm font-medium text-teal hover:text-bright-teal">
            ← All organizations
          </Link>
          {organizationQuery.isPending && (
            <div aria-label="Loading organization" className="mt-2">
              <Skeleton className="h-9 w-64" />
            </div>
          )}
          {organizationQuery.isError && (
            <GlassCard className="mt-4 p-8 text-center">
              <h1 className="text-lg">Organization not found</h1>
              <p className="mt-1 text-sm text-dark-teal/60">
                It may have been deleted. Head back to the list to pick another.
              </p>
            </GlassCard>
          )}
          {organization && (
            <div className="mt-2 flex items-center gap-3">
              <h1 className="text-2xl">{organization.name}</h1>
              <ApproachBadge approach={organization.consolidationApproach} />
            </div>
          )}
        </div>

        {organization && (
          <>
            <FacilitiesSection organizationId={organizationId} />
            <ActivitiesSection organizationId={organizationId} />
            <RunsSection organizationId={organizationId} />
          </>
        )}
      </main>
    </div>
  )
}
