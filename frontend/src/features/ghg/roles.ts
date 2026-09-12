import type { Organization } from './api'

/** The caller's role in an organization; ADMIN means active support access (spec 01.3). */
export type MyRole = Organization['myRole']

/**
 * The role sets of spec 01.4. `write` records facts and runs, `approve` also
 * designates final runs and publishes, `owner` manages the organization.
 * A platform administrator under support access acts as an owner, except for
 * deletion and membership, which stay with an owner by membership (spec 01.3).
 */
const WRITE_ROLES: ReadonlyArray<MyRole> = ['PREPARER', 'REVIEWER', 'OWNER', 'ADMIN']
const APPROVE_ROLES: ReadonlyArray<MyRole> = ['REVIEWER', 'OWNER', 'ADMIN']
const OWNER_ROLES: ReadonlyArray<MyRole> = ['OWNER', 'ADMIN']

export const WRITE_TOOLTIP = 'Needs the Preparer, Reviewer or Owner role.'
export const APPROVE_TOOLTIP = 'Needs the Reviewer or Owner role.'
export const OWNER_TOOLTIP = 'Needs the Owner role.'

/**
 * The role is a display concern only (spec 01.4): while the organization is
 * still loading the role is unknown, and the screen shows the control rather
 * than flickering. The server checks of spec 01.2 stay the authority.
 */
function may(role: MyRole | undefined, set: ReadonlyArray<MyRole>): boolean {
  return role == null || set.includes(role)
}

export function mayWrite(role: MyRole | undefined): boolean {
  return may(role, WRITE_ROLES)
}

export function mayApprove(role: MyRole | undefined): boolean {
  return may(role, APPROVE_ROLES)
}

export function mayOwn(role: MyRole | undefined): boolean {
  return may(role, OWNER_ROLES)
}

/** Deleting the organization and changing its members: an owner by membership only (spec 01.3). */
export function mayManageMembership(role: MyRole | undefined): boolean {
  return role == null || role === 'OWNER'
}

/** A verifier reads everything and changes nothing, and the page says so. */
export function isReadOnly(role: MyRole | undefined): boolean {
  return role === 'VERIFIER'
}
