import type { Organization } from './api'

/**
 * Where the GHG side opens for this caller (spec 01.6). One organization is a
 * workspace, so we go straight in; none or several is a choice, so we show the
 * list. The single-organization target is the overview on purpose: it is where
 * `SupportAccessCard` states who is inside the organization and until when
 * (spec 01.3), which a member who skips the list would otherwise never see.
 */
export function ghgLandingPath(organizations: Organization[] | undefined): string {
  return organizations?.length === 1 ? `/app/ghg/${organizations[0].id}` : '/app/ghg'
}
