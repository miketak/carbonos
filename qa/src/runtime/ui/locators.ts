/**
 * The few places the UI driver needs a CSS selector. Everything else is a
 * role or a label (components/Field.tsx, Modal.tsx), which is what a tester
 * reads too.
 */
export const locators = {
  /** The account menu's trigger carries the avatar and a visually hidden "Account menu for <name>"; no stable role name. */
  accountMenuTrigger: 'button[aria-haspopup="menu"]',
}

/** The sidebar label or page name of the places the procedures open, to their routes. */
export const routes: Record<string, string> = {
  Dashboard: '/admin',
  'Access requests': '/admin/access-requests',
  Users: '/admin/users',
  'Platform settings': '/admin/settings',
  Organizations: '/admin/organizations',
  'Factor packs': '/admin/factor-packs',
  'GHG accounting': '/app/ghg',
  'Edit profile': '/app/profile',
}
