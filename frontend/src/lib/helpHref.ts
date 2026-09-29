/*
 * Deep links from the product into the help centre. The keys are the places
 * where a reader is most likely to be stuck; the values are article slugs
 * (group/article, plus an anchor when a section answers better than the
 * page). A test checks every entry against the compiled manifest, so a
 * renamed article fails the build rather than a reader's click.
 */
export const HELP_TOPICS = {
  hub: '',
  preflight: 'inventories/clear-the-pre-flight-findings',
  lifecycle: 'inventories/what-is-the-inventory-lifecycle',
  csvTemplate: 'activity-data/prepare-the-csv-file',
  editionNotice: 'factors/accept-or-decline-an-edition-notice',
  requestAccess: 'access/request-access',
  roles: 'access/check-what-your-role-may-do',
} as const

export type HelpTopic = keyof typeof HELP_TOPICS

/** The route for a help topic; opened beside the work, so callers add `target="_blank"`. */
export function helpHref(topic: HelpTopic, anchor?: string): string {
  const slug = HELP_TOPICS[topic]
  const path = slug ? `/help/${slug}` : '/help'
  return anchor ? `${path}#${anchor}` : path
}
