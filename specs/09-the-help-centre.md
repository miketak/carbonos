# 09: The help centre

- **Status**: Approved
- **Protocol**: none; the product's own help. Corporate Standard chapter 7
  (information management) in that the help describes the record the product
  keeps, and ISO 14064-1 clause 8.2 in that nothing here is itself a record of
  the inventory
- **Owner**: Michael Takrama (approved with the rebuild plan on 2026-09-28)
- **Created**: 2026-09-28
- **Modules**: backend `help`; frontend `src/features/help`,
  `src/features/admin`, `src/lib/helpHref.ts`; content under `help/docs`
  compiled by `frontend/scripts/compile-help.mjs`

## Problem

The end-user help is a separate MkDocs site served beside the app at
`/help/` (ADR 0005). It is organized by page type (concepts, tasks,
reference), its concept pages run to a thousand words each, its one tutorial
takes two hours, it looks nothing like the product, and nothing tells us
whether anyone found what they came for. The owner wants the help to look
and feel like the product, to be organized by the reader's job the way
Confluence Cloud's support site is, and to be measured: a reader with a
question should reach the section that answers it within two minutes.

This spec covers the parts of that rebuild that are product behavior: the
help routes inside the app, the feedback and search-miss endpoints, and the
help metrics on the administration console. The content itself, its style
and its migration are covered by the plan and ADR 0006, not by this spec.

## Behavior

### Help is a public route of the app

- `/help` and everything under it renders inside the React app. No account
  is needed; a signed-in reader sees the same pages with the app's account
  menu in the header, a visitor sees a sign-in link instead.
- The hub at `/help` lists nine groups named by the reader's job (Get
  started; Get access and manage your account; Set up your organization;
  Record activity data; Manage emission factors and updates; Build, check and
  run an inventory; Publish the report and track it over time; Administer the
  platform; Fix a problem) and the glossary. Each group is a plain list of
  article links; past a threshold the list folds behind **Show more**.
- `/help/<group>` is a topic page: the group's articles as cards with a
  one-sentence description each. `/help/<group>/<article>` is an article:
  breadcrumb, title, the role it needs when one applies, the body, previous
  and next links inside a series, the feedback widget, and one contact route
  under **Still need help?**. `/help/glossary` is the glossary.
  `/help/search?q=` searches article sections client-side and lands the
  reader on the section, not the page top.
- A URL of the retired MkDocs site redirects to its new article: the
  `legacy` map in `help/tree.yaml` holds every page the old site served
  (the takeover shipped on 2026-09-28).
- Every article carries **Was this helpful?** with **Yes** and **No**. **No**
  asks for one reason (It wasn't accurate, It wasn't clear, It wasn't
  relevant) and an optional comment of up to 500 characters, with the note
  "Don't include personal details". A browser votes once per article; a
  changed vote replaces the earlier one.
- The app links into the help where a reader is most likely to be stuck: the
  pre-flight panel, the lifecycle bar, the CSV import preview, the factor
  update notices, the access request form, the members card, and the foot of
  both sidebars. Every such link resolves to an article that exists; the
  build fails otherwise.

### Feedback and search misses are recorded without identifying anyone

- A vote is stored with the article slug, whether it helped, the reason and
  comment when it did not, the time, and a voter hash. The hash is a salted
  SHA-256 of the session id when there is one and of the client address
  otherwise. It exists to keep one vote per voter per article and is never
  returned by any endpoint.
- A comment that contains an email address or a run of nine or more digits
  is refused with a validation error, so nobody can leave a phone number or
  an address in it by accident.
- A search that returns no result is recorded as its normalized query
  (trimmed, lower case, punctuation stripped, at most 120 characters) with a
  count; every search increments a per-day counter so the miss rate has a
  denominator. The queries of successful searches are not stored.
- Both endpoints accept ten requests per minute per voter hash; beyond that
  they answer 429 with `Retry-After`. Feedback is kept for 365 days, misses
  for 180 days, and day counters for 400 days; a nightly job deletes the
  rest.

### The administration console shows whether the help works

- The dashboard gains two tiles: the share of helpful votes over the last 30
  days against a target of 80%, and the share of searches with no result
  over the last 30 days against a target of 5%.
- **Help metrics** (`/admin/help`) lists every article with votes, its
  helpful rate and the target line; the recent comments, filterable to the
  unhelpful ones and by article; and the most frequent missed searches with
  a link that runs each search in the help.
- A member account never sees any of it; the endpoints sit under
  `/api/admin/**`.

### Given / When / Then

- Given a visitor with no account, when they open `/help/inventories/clear-the-pre-flight-findings`,
  then the article renders with a sign-in link in the header and no request
  is made to any organization endpoint.
- Given a reader who voted **No** with a reason on an article, when they vote
  **Yes** on the same article from the same browser, then the stored vote for
  that voter and article is replaced and the totals move by one.
- Given a comment "call me on 0244123456", when it is submitted, then the
  response is 422 with an `errors.comment` message and nothing is stored.
- Given eleven feedback requests from one voter hash within a minute, when
  the eleventh arrives, then it is answered 429 and nothing is stored for it.
- Given a search for "recalcuation" that returns no result, when the search
  page reports it, then `help_search_misses` holds `recalcuation` with a
  count of 1 and the day's `searches` and `misses` both rose by one.
- Given a member (not an administrator) session, when it requests
  `/api/admin/summary/help`, then the answer is 403.

## API

Public, `permitAll` for `POST /api/help/**`; the CSRF token is still
required, as on every POST:

- `POST /api/help/feedback` `{pageSlug, helpful, reason?, comment?}` → 204.
  `pageSlug` matches `^(glossary|[a-z0-9-]{1,60}/[a-z0-9-]{1,100})$`;
  `reason` is one of `NOT_ACCURATE`, `NOT_CLEAR`, `NOT_RELEVANT` and is
  required exactly when `helpful` is false; `comment` is at most 500
  characters after control characters are stripped. 422 with an `errors` map
  on any violation, including a comment that contains an email address or
  nine or more consecutive digits. 429 with `Retry-After: 60` past the rate
  limit.
- `POST /api/help/searches` `{hit, query?}` → 204. `query` is required when
  `hit` is false and is normalized before storage; a normalized query shorter
  than two characters is counted as a search but not stored as a miss.

Administrator (`/api/admin/**`, platform role ADMIN):

- `GET /api/admin/summary/help` →
  `{feedback: {votes30d, helpful30d, helpfulRate30d}, search: {searches30d, misses30d, missRate30d}, pagesBelowTarget: [{pageSlug, votes, helpfulRate}], topMisses: [{query, count, lastSeen}]}`.
  Rates are null when the denominator is zero. `pagesBelowTarget` holds at
  most five articles with at least five votes and a rate under 0.8, worst
  first. `topMisses` holds at most five.
- `GET /api/admin/help/pages` → `[{pageSlug, votes, helpful, helpfulRate, lastVoteAt}]`.
- `GET /api/admin/help/feedback?slug=&helpful=&page=0&size=50` →
  `{items: [{id, pageSlug, helpful, reason, comment, createdAt}], total}`.
- `GET /api/admin/help/search-misses?size=100` → `[{query, count, firstSeen, lastSeen}]`.

## Data

`V58__help_centre.sql`:

- `help_feedback(id identity, page_slug varchar(160), helpful boolean,
  reason varchar(20) check in (NOT_ACCURATE, NOT_CLEAR, NOT_RELEVANT),
  comment varchar(500), voter_hash char(64), created_at timestamptz)`, with
  `check (helpful = false or reason is null)`, `unique (page_slug, voter_hash)`,
  and an index on `(page_slug, created_at desc)`.
- `help_search_misses(query_normalized varchar(120) primary key, count
  integer, first_seen timestamptz, last_seen timestamptz)`, indexed on
  `last_seen desc`.
- `help_search_days(day date primary key, searches integer, misses integer)`.

The voter salt is `HELP_VOTER_SALT`; without it the backend uses a random
salt per boot, so deduplication then survives only until a restart. Every
deployment sets it.

## Events

None. The `help` module depends on nothing but `shared`, and nothing depends
on it; `ModularityTests` asserts the first half.

## Verification

- `HelpApiIntegrationTests`: the Given / When / Then cases above, the
  validation cases (comment of 501 characters, reason with `helpful` true,
  malformed slug, email in a comment), the replaced vote, the eleventh
  request, the miss upsert and day counters, the member refused on the
  summary, the summary shape with seeded rows, and the retention job.
- Frontend: the manifest test (every tree slug has a body, every
  `helpHref` topic resolves), the shell, hub, topic, article, rail, feedback,
  search, header, legacy redirect, account menu, admin tiles and metrics page
  tests.
- `npm run help:check` fails the build on a page missing from the tree, a
  broken link or anchor, a word budget breach, an em-dash, a stale diagram, or
  a missing screenshot.
- Findability: `frontend/e2e/help-findability.spec.ts` runs the 25
  questions of `help/questions.yaml` against a deployed build and reports
  time and clicks per question; the target is 80% within 120 seconds and
  three clicks.

## Non-goals and open questions

- No per-user reading history, no comment moderation queue, no rate limiting
  shared across backend instances (the limiter is in memory; one instance per
  environment today).
- No search analytics beyond counts; no third-party analytics script.
- The MkDocs help site is retired (the takeover of 2026-09-28); the
  engineering docs stay on MkDocs (ADR 0001).
- Whether the help should be translated is not decided here.
