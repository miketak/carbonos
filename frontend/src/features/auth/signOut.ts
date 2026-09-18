/**
 * Whether a sign-out is in flight (spec 01.6). Clearing the session makes
 * RequireAuth bounce to /login with a `from` deep link, and that bounce can
 * land after the sign-out's own navigation, so RequireAuth reads this flag to
 * leave the deep link out: the next account lands where its own work starts,
 * not on the page the previous account was on. The login page clears it.
 */
let signingOut = false

export function beginSignOut(): void {
  signingOut = true
}

export function endSignOut(): void {
  signingOut = false
}

export function isSigningOut(): boolean {
  return signingOut
}
