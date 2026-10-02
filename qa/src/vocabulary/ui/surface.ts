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
    accessOutcome: {
      APPROVED: 'Approved, waiting for the password to be set',
      COMPLETED: 'Approved, account active',
      DENIED: 'Denied',
    } as Record<string, string>,
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
    alreadyDecided: 'Already decided',
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
  org: {
    sections: {
      overview: 'Overview',
      entities: 'Legal entities',
      facilities: 'Facilities',
      factors: 'Emission factors',
      units: 'Units',
      settings: 'Settings',
      activity: 'Activity data',
      documents: 'Source documents',
      inventories: 'Inventories',
    },
    button: {
      createOrganization: 'Create organization',
      createAnyway: 'Create anyway',
      saveDetails: 'Save details',
      saveAnyway: 'Save anyway',
      saveChanges: 'Save changes',
      deleteOrganization: 'Delete organization',
      addMember: 'Add member',
      addEntity: 'Add entity',
      addFacility: 'Add facility',
      sourceStreams: 'Source streams',
      addStream: 'Add stream',
      defineUnit: 'Define unit',
      recordDensity: 'Record density',
      addFactor: 'Add factor',
      importPack: 'Import pack',
      approve: 'Approve',
      retire: 'Retire…',
      retireFactor: 'Retire factor',
      remove: 'Remove',
      edit: 'Edit',
    },
    field: {
      name: 'Name',
      memberEmail: 'Email of an existing account',
      role: 'Role',
      reason: 'Reason',
      relationship: 'Relationship',
      economicInterest: 'Economic interest (%)',
      legalOwnership: 'Legal ownership (%)',
      operatedByCompany: 'Operated by the company',
      heldThrough: 'Held through',
      heldDirectly: 'Held directly by the reporting company',
      acquiredOn: 'Acquired on (optional)',
      disposedOn: 'Disposed of on (optional)',
      jurisdiction: 'Jurisdiction (optional)',
      location: 'Location',
      country: 'Country (optional)',
      gridRegion: 'Grid region (optional)',
      lease: 'Lease (optional)',
      leaseFrom: 'Lease from (optional)',
      leaseUntil: 'Lease until (optional)',
      legalEntity: 'Legal entity',
      streamName: 'Stream name',
      kind: 'Kind',
      fuel: 'Fuel or material (optional)',
      meterOrSupplier: 'Meter or supplier (optional)',
      contractorOperated: 'Operated by a contractor (its emissions default to scope 3)',
      code: 'Code',
      label: 'Label',
      oneUnitEquals: 'One unit equals',
      of: 'Of',
      material: 'Material',
      kgPerLitre: 'kg per litre',
      source: 'Source',
      factorName: 'Name',
      suggestedScope: 'Suggested scope',
      category: 'Category',
      unit: 'Unit',
      kgCo2ePerUnit: 'kg CO₂e per unit',
      hfcsKgPerUnit: 'HFCs kg per unit (optional)',
      blendComposition: 'Blend composition (optional)',
      gwpBasis: 'GWP basis of the published figure',
      factorSource: 'Source (publication, table, data year)',
      publicationYear: 'Publication year',
      dataYear: 'Data year',
      validTo: 'Valid to',
      searchFactors: 'Search factors',
    },
    dialog: {
      newOrganization: 'New organization',
      deleteOrganization: 'Delete organization',
      addEntity: 'Add legal entity',
      editEntity: 'Edit legal entity',
      addFacility: 'Add facility',
      addFactor: 'Add an emission factor',
    },
    option: {
      memberRole: {
        OWNER: 'Owner',
        REVIEWER: 'Reviewer (approves and publishes)',
        PREPARER: 'Preparer (records, classifies, runs)',
        VERIFIER: 'Verifier (read-only)',
      } as Record<string, string>,
      roleShort: { OWNER: 'Owner', REVIEWER: 'Reviewer', PREPARER: 'Preparer', VERIFIER: 'Verifier' } as Record<string, string>,
      relationship: {
        SUBSIDIARY: 'Group company or subsidiary (financial control)',
        ASSOCIATE: 'Associate or affiliate (significant influence, no control)',
      } as Record<string, string>,
      lease: { OPERATING_LEASE_IN: 'Operating lease (leased in)' } as Record<string, string>,
      kind: {
        STATIONARY_COMBUSTION: 'Stationary combustion',
        MOBILE_COMBUSTION: 'Mobile combustion',
        PURCHASED_ELECTRICITY: 'Purchased electricity',
      } as Record<string, string>,
    },
    text: {
      yourRole: 'Your role:',
      readOnlyBanner: 'Your role in this organization is Verifier (read-only).',
      writeTooltip: 'Needs the Preparer, Reviewer or Owner role.',
      approved: 'Approved',
      notApproved: 'Not approved',
      selfApproved: '(self-approved: nobody else could check it)',
      typicalValue: 'Typical value',
      history: 'History',
      ownFactors: "This organization's factors",
    },
  },
  act: {
    button: {
      importCsv: 'Import CSV',
      addRecords: 'Add records',
      downloadTemplate: 'Download CSV template',
      addActivity: '+ Add activity',
      save: 'Save',
      saveDraft: 'Save draft',
      addLink: 'Add link',
      remove: 'Remove',
      downloadIndex: 'Download evidence index (CSV)',
    },
    field: {
      csvFile: 'CSV file',
      activityType: 'Activity type *',
      facility: 'Facility *',
      quantity: 'Activity quantity *',
      periodStart: 'Period start *',
      periodEnd: 'Period end',
      documentReference: 'Document reference',
      reason: 'Reason for the correction *',
      attachFile: 'Attach a file',
      linkName: 'Link name',
      url: 'URL',
      search: 'Search',
    },
    dialog: {
      import: 'Import activity data',
    },
    tab: {
      activity: 'Activity',
      evidence: 'Evidence',
    },
    text: {
      controlTotals: 'Control totals',
      recordsToAdd: 'Records to add',
      supportingEvidence: 'Supporting evidence',
      resolve: 'Resolve',
      noStream: 'No stream',
      ready: 'Ready',
    },
  },
  inv: {
    button: {
      newInventory: 'New inventory',
      createInventory: 'Create inventory',
      saveChanges: 'Save changes',
      cancel: 'Cancel',
      open: 'Open',
      editInventory: 'Edit inventory',
      saveDeclaration: 'Save declaration',
      reviewActivityData: 'Review activity data',
      freezeInventory: 'Freeze inventory',
    },
    field: {
      name: 'Name',
      periodStart: 'Period start',
      periodEnd: 'Period end',
      straddle: 'Records that straddle the period or a membership window',
      purpose: 'Purpose (optional)',
      approach: 'Consolidation approach',
      gwpSet: 'GWP set',
      prefillBoundary: 'Start with every operation the approach includes in the boundary',
    },
    dialog: {
      newInventory: 'New inventory',
      editInventory: 'Edit inventory',
      freeze: 'Freeze the inventory?',
    },
    option: {
      approach: { EQUITY_SHARE: 'Equity share', FINANCIAL_CONTROL: 'Financial control', OPERATIONAL_CONTROL: 'Operational control' } as Record<string, string>,
      gwpSet: { AR5: 'AR5 (default)', AR6: 'AR6' } as Record<string, string>,
      straddle: { PRO_RATE: 'Pro-rate by days (default)', BLOCK: 'Block the run until the record is split' } as Record<string, string>,
      whyLeftOut: 'Why is it left out?',
    },
    text: {
      outsideUnder: 'Outside the boundary under',
      operationalBoundary: 'Operational boundary declaration',
      declarationSaved: 'Operational boundary declaration saved.',
    },
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
