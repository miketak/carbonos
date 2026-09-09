# 08: Form validation and UI polish

- **Status**: Implemented
- **Protocol**: none directly; the credibility and transparency principles (Chapter 1), and what a verifier reads into product copy
- **Owner**: product owner
- **Created**: 2026-09-09
- **Modules**: frontend `ghg` (entity, record and instrument forms), `auth` (splash), shared `lib` and styles

## Problem

The GHG officer audit of v0.5.0 raised three usability findings that a
verifier would also notice (tickets T-24, T-25 and T-26):

- An economic interest of 150% left the entity dialog open with no message,
  because only the browser's native range check ran, and a market instrument
  at -0.1 kg CO2e per kWh was dropped silently. The backend rejects both
  with a 422 and a field error, but the browser stopped the request before
  it was sent and showed nothing a screen reader or an automated browser
  could see.
- The post-login loader printed "Verifying audit trail integrity" and
  "Calibrating consolidation models". Nothing was verified; a verifier asks
  what was.
- "Create correction" on a published inventory did not respond to a real
  pointer click under browser automation: the sticky page header intercepted
  the click when the button was scrolled into view underneath it.

## Behavior

### Inline validation for numeric fields

Every numeric field on the entity, record and instrument forms is checked
on submit, in the browser, with the same rule the backend enforces. The
form sets `noValidate`, so the native tooltip never runs; the message
prints under the field, in the same place a backend field error prints.

| Form | Field | Rule | Message |
|---|---|---|---|
| Legal entity | Economic interest (%) | required, 0 to 100 | "Economic interest must be between 0 and 100." |
| Legal entity | Legal ownership (%) | 0 to 100 when given | "Legal ownership must be between 0 and 100." |
| Activity record | Quantity | required, greater than 0 | "Quantity must be greater than 0." |
| Activity record | Uncertainty (%) | 0 to 100 when given | "Uncertainty must be between 0 and 100." |
| Instrument | kg CO2e per kWh | required, 0 or more | "kg CO₂e per kWh must be 0 or more." |
| Instrument | Covered quantity (MWh) | required, greater than 0 | "Covered quantity must be greater than 0." |
| Instrument | Vintage (year) | 1990 to 2100 when given | "Vintage must be between 1990 and 2100." |
| Residual mix | kg CO2e per kWh | 0 or more when a residual mix is available | "Residual mix must be 0 or more." |

A value that is not a number reads "<Label> must be a number."; a missing
required value reads "Enter <label>.". The client check runs first; when it
passes and the backend still answers 422, the backend's field errors print
in the same places. The instrument card, which used to report every failure
as a toast, now prints field errors inline and keeps the toast for errors
that belong to no field.

Given an entity form with economic interest 150, when the accountant saves,
then the dialog stays open, the field is marked invalid, and the message
"Economic interest must be between 0 and 100." prints under it; no request
is sent.

### Material difference between economic interest and legal ownership

While the accountant types, the entity form compares the two percentages.
When they differ by 10 points or more it shows a note (not an error):
"Economic interest and legal ownership differ by N points. Equity share
follows economic interest; a verifier will ask why they differ, so keep the
agreement that explains it with the entity's evidence." Saving is not
blocked; the Standard lets substance override form.

### A neutral loader

The splash after login keeps its wordmark, tagline and progress bar and
prints "Loading your workspace. Click or press any key to skip." The staged
status lines are gone. The progress bar is exposed as a `progressbar` named
"Loading" so assistive technology reads it as progress, not as a claim.

### Controls scrolled into view stay clickable

The app header is sticky, 57 px tall, and blurs what is under it. A browser
that scrolls a control into view (automation, keyboard navigation, a
"skip to" link) may place it under that header, where the header receives
the pointer event. The document now declares `scroll-padding-top: 5rem`, so
any scroll-into-view lands the control below the header. Modals keep their
own scrim and close only on a mouse-down that starts on the scrim itself.

## API

No change. The backend rules the client repeats are the existing
`@DecimalMin`, `@DecimalMax`, `@Positive` and `@Min`/`@Max` constraints on
`EntityRequest`, `CreateActivityRequest` and `MarketFactorRequest`, which
answer 422 with `errors.<field>`.

## Data

No change.

## Events

None.

## Verification

- `frontend/src/lib/validate.test.ts`: the range, positive, number and
  required messages.
- `EntitiesPage.test.tsx`: an economic interest of 150 keeps the dialog open
  with the inline message and sends no request; a 40-point gap shows the
  note.
- `MarketFactorsCard.test.tsx`: a negative factor prints the inline message
  and sends no request.
- `SplashScreen.test.tsx`: the loader has a progress bar and no "verifying"
  or "calibrating" text.
- Manual: QA procedure 008 (publication and corrections) clicks "Create
  correction" with a real pointer after scrolling the lifecycle bar to the
  top of the viewport.

## Non-goals and open questions

- The scroll-padding fix addresses the one interception the audit
  reproduced. The follow-up audit's real-mouse retest of "Create correction"
  (todo.md, follow-up list) stays on the list; no automated browser runs in
  this repository's CI.
- The facility form has no numeric fields; date-order checks stay with the
  backend.
