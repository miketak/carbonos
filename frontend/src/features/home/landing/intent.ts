/** What the visitor pressed; the access form titles itself accordingly. */
export type AccessIntent = 'access' | 'pilot' | 'licence' | 'talk'

export interface IntentCopy {
  title: string
  note: string
  /** The submit button. */
  action: string
  /** The wire value the backend stores (spec 01.1). */
  code: 'ACCESS' | 'PILOT' | 'LICENCE' | 'TALK'
  /** The title of the confirmation, and what happens next; the reader's email is appended. */
  doneTitle: string
  done: string
}

export const INTENT_COPY: Record<AccessIntent, IntentCopy> = {
  access: {
    title: 'Request access',
    note: 'Leave your details and we set up your organization. We usually reply in 48 hours.',
    action: 'Request access',
    code: 'ACCESS',
    doneTitle: 'Request received',
    done: 'Your request is with our team. Once it is approved you will get an email with a link to set your password at',
  },
  pilot: {
    title: 'Ask about the pilot',
    note: 'One site, three months, with ECORIV alongside your team. Tell us who you are and we usually reply in 48 hours with the pilot offer and a kick-off date.',
    action: 'Send',
    code: 'PILOT',
    doneTitle: 'Message received',
    done: 'We usually reply in 48 hours with the pilot offer and a kick-off date, by email at',
  },
  licence: {
    title: 'Request a licence',
    note: 'A standalone licence for your own team. We set up your organization and usually reply in 48 hours.',
    action: 'Request a licence',
    code: 'LICENCE',
    doneTitle: 'Request received',
    done: 'We will set up your organization and usually reply in 48 hours with the licence terms, by email at',
  },
  talk: {
    title: 'Talk to ECORIV',
    note: 'For the Core and Comprehensive packages we scope the engagement with you first. Leave your details and we usually reply in 48 hours.',
    action: 'Send',
    code: 'TALK',
    doneTitle: 'Message received',
    done: 'We usually reply in 48 hours to arrange a call, by email at',
  },
}
