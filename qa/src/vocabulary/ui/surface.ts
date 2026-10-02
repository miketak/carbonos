/**
 * Every screen string the UI projections use, in one place. Lint checks that
 * each value appears verbatim in frontend/src, so a renamed button fails
 * `make qa-lint` before it fails a run, and the exported procedures quote the
 * product rather than a memory of it.
 */
export const S = {
  nav: {
    landing: 'CarbonOS',
    signIn: 'Sign in',
    ghg: 'GHG accounting',
    administration: 'Administration',
    dashboard: 'Dashboard',
    accessRequests: 'Access requests',
    users: 'Users',
    platformSettings: 'Platform settings',
    editProfile: 'Edit profile',
    help: 'Help',
    forgotPassword: 'Forgot your password?',
  },
  button: {
    signIn: 'Sign in',
    signOut: 'Sign out',
    requestAccess: 'Request access',
    addUser: 'Add user',
    edit: 'Edit',
    disable: 'Disable',
    enable: 'Enable',
    delete: 'Delete',
    deleteUser: 'Delete user',
    resetPassword: 'Reset password',
    sendResetLink: 'Send reset link',
    approve: 'Approve',
    saveSettings: 'Save settings',
    saveChanges: 'Save changes',
    changePassword: 'Change password',
    setPasswordAndSignIn: 'Set password and sign in',
    setNewPassword: 'Set new password',
    newOrganization: 'New organization',
    cancel: 'Cancel',
  },
  field: {
    email: 'Email',
    password: 'Password',
    workEmail: 'Work email',
    fullName: 'Full name',
    company: 'Company (optional)',
    displayName: 'Display name',
    role: 'Role',
    status: 'Status',
    temporaryPassword: 'Temporary password',
    newPassword: 'New password',
    confirmPassword: 'Confirm password',
    currentPassword: 'Current password',
    confirmNewPassword: 'Confirm new password',
    supportAccessLasts: 'Support access lasts',
    whoMayCreate: 'Who may create an organization',
    editionsInside: 'Editions inside a published period',
    reason: 'Reason for this change',
  },
  option: {
    role: { ADMIN: 'Admin', MEMBER: 'Member' } as Record<string, string>,
    status: { ACTIVE: 'Active', DISABLED: 'Disabled', PENDING: 'Pending activation' } as Record<string, string>,
    organizationCreation: { EVERYONE: 'Everyone signed in', ADMINISTRATORS: 'Administrators only' } as Record<
      string,
      string
    >,
    editions: {
      BLOCKED: 'Blocked (default)',
      ALLOWED: 'Allowed: published runs keep their factors',
    } as Record<string, string>,
  },
  dialog: {
    addUser: 'Add user',
    requestAccess: 'Request access',
  },
  heading: {
    everyChange: 'Every change',
    waitingForADecision: 'Waiting for a decision',
    platformOverview: 'Platform overview',
    setYourPassword: 'Set your password',
    chooseANewPassword: 'Choose a new password',
    resetYourPassword: 'Reset your password',
  },
  tile: {
    users: 'Users',
    organizations: 'Organizations',
    editions: 'Factor pack editions',
    openNotices: 'Open adoption notices',
  },
  text: {
    noPendingRequests: 'No pending requests.',
    noOrganizationsYet: 'No organizations yet',
    createYourFirst: 'Create your first reporting organization to start the GHG Protocol workflow.',
    notAMember: 'You are not a member of any organization yet. Ask an owner to add you, or a platform administrator.',
    resetLinkOnItsWay: 'belongs to an active CarbonOS account, a reset link is on its way. The link is valid for 1 hour and works once.',
    setupLinkInvalid: 'This link is invalid or has expired.',
    askForANewLink: 'Ask for a new link and use the latest email.',
    passwordIsReset: 'Your password is reset. Sign in with your new password.',
    passwordChanged: 'Password changed. Your other sessions are signed out.',
    settingsSaved: 'Platform settings saved.',
    profileUpdated: 'Profile updated',
    accessRequest: 'access request',
    thanks: 'Thanks,',
  },
  historySetting: {
    supportAccessWindowHours: 'Support access window',
    organizationCreation: 'Who may create an organization',
    editionsInPublishedPeriods: 'Editions inside a published period',
  } as Record<string, string>,
} as const

/** Every string of the surface, flattened, for lint. */
export function surfaceStrings(): Array<{ path: string; value: string }> {
  const out: Array<{ path: string; value: string }> = []
  const walk = (node: unknown, path: string) => {
    if (typeof node === 'string') out.push({ path, value: node })
    else if (node && typeof node === 'object')
      for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k)
  }
  walk(S, '')
  return out
}

/** "2 hours", "1 hour": how the settings page and its history print the window. */
export function hoursLabel(hours: number | string): string {
  return `${hours} ${String(hours) === '1' ? 'hour' : 'hours'}`
}

/** A setting's value as the form and the history show it. */
export function settingValueLabel(setting: string, value: string | number): string {
  if (setting === 'supportAccessWindowHours') return hoursLabel(value)
  if (setting === 'organizationCreation') return S.option.organizationCreation[String(value)] ?? String(value)
  if (setting === 'editionsInPublishedPeriods') return S.option.editions[String(value)] ?? String(value)
  return String(value)
}

/** "1 access request waiting", as the dashboard's queue puts it. */
export function accessRequestsWaiting(count: number): string {
  return `${count} ${S.text.accessRequest}${count === 1 ? '' : 's'} waiting`
}
