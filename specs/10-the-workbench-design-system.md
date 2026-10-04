# 10: The workbench design system

- **Status**: Approved
- **Protocol**: none; the product's own surface. Corporate Standard chapter 1
  (credibility and transparency) in that a verifier reads the product's
  calm and legibility as care
- **Owner**: Michael Takrama (mockup and spec approved on 2026-10-03)
- **Created**: 2026-10-03
- **Modules**: frontend `src/index.css`, `src/components`, `src/app`, and
  every feature under `src/features`; `help/docs/assets/screens` (figures);
  no backend change
- **Mockup**: the approved clickable mockup is the Design canvas at
  <https://claude.ai/artifact/KDKR7QHSZe6incbVwkMjeW>; its source (one
  artboard per screen and the style sheet that defines the tokens) is kept
  under `specs/assets/10-design-system/`

## Problem

The app's surface is the ECORIV landing page's: frosted glass cards over a
drifting aurora, teal tints on every border, rounded corners of three sizes,
and a sticky translucent header. That treatment sells the product on the
landing page and fights it everywhere else. A register of two hundred
activity records, a run report with fourteen sections, and a classification
decision all sit on a background that moves, behind panels that blur it,
with status conveyed by tinted pills. Fifty of the feature files reach for
the glass directly, so no single change can calm the whole app.

The owner chose two mockups as the target. The first is a calm light
workbench: a solid rail on the left, flat white surfaces, hairline rules,
one radius, a large page title, and tables with two-line cells. The second
is a dark workbench whose list-and-detail layout shows one record beside
the register it came from. This spec takes the first as the light theme,
the second as the dark theme and the source of the list-and-detail pattern,
and re-keys both to the ECORIV teal.

## Behavior

### The shell

- **The rail.** The organization workspace and the administration area have
  a solid dark teal rail on the left, 260 px wide, with light text. It
  holds, top to bottom: the wordmark; a labelled workspace switcher (the
  organization's name over its account number, opening a menu of the
  member's organizations and **All organizations**); the sections; and a
  foot with **Settings**, **Help** and the account.
- **The sections.** Entries that are steps of the inventory workflow carry a
  number: **01 Legal entities**, **02 Facilities**, **03 Activity data**,
  **04 Inventories**. **Overview** sits above them with a dash. Below a
  divider, the reference sections **Emission factors**, **Updates** and
  **Units** carry no number and sit flush left. The open section has a
  lighter fill and a 3 px bright-teal bar on its left edge; its number turns
  bright teal. **Updates** keeps its count badge (spec 02.7). The
  administration rail numbers its own sections the same way: a dash for
  **Dashboard**, then **01 Access requests** to **06 Platform settings**.
- **The account.** The foot shows the avatar, the display name and the role
  line of spec 01.4 ("Your role: Owner", or "Support access"). Its menu is
  the account menu of spec 01.6 plus one entry: **Switch to dark theme** /
  **Switch to light theme**.
- **No top bar in the workspace.** The sticky header leaves the organization
  and administration areas. The breadcrumb row at the top of the content
  carries what the header carried: the way back, the breadcrumb, a help
  link, and the page's status line on the right (a save state, a boundary
  version, the run's timestamp). The organizations list, the profile page
  and the sign-in page keep a plain top bar with the wordmark and the
  account.
- **Back.** Every page except sign-in and the organizations list has a
  **Back** link at the head of the breadcrumb row. It leads where the app
  came from: a form to its list, a run to its inventory, the register to
  the overview, a reference page to the overview, the profile and the
  administration area to the organizations list.

### Surfaces, shape and type

- **Flat.** One page ground, one panel surface, one sunken surface, 1 px
  hairlines. No blur, no gradient, no inset highlight, no aurora. The only
  shadow is on things that float: menus, popovers, modals, toasts.
- **One radius.** 8 px for controls and panels, 6 px for chips and menu
  items, full for dots and avatars.
- **One typeface.** Inter at 400, 500 and 600, plus 700 for the wordmark.
  Identifiers, dates, quantities and percentages are set in the same face
  with proportional digits; there is no monospace anywhere in the app.
- **The scale.** Page title 40 px semibold with tight tracking (32 px on a
  form page); detail title the same; section title 20 px; panel title 16 px;
  body 15 px; secondary lines 13 px; labels 13 px medium; eyebrows 11 px
  semibold uppercase with 0.12 em tracking.
- **The wordmark.** The C-and-three-bars symbol (`CarbonOsMark`, with its
  gradient) beside **CarbonOS** in title case, bold, 4 px from the symbol,
  the symbol nudged up 1 px so its optical centre meets the letters. "OS" is
  the deep brand teal on a light surface and bright teal on the rail and in
  the dark theme. The sign-in page sets the same lockup larger and centred,
  with no tagline.

### Colour

Semantic tokens, never raw palette values, in every component. The brand
palette stays on the landing page, the symbol and the splash.

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| ground | `#f7f8f7` | `#0e1113` | the page |
| surface | `#ffffff` | `#15191b` | panels, inputs, table rows |
| surface-sunken | `#f2f4f3` | `#111416` | table heads, hover |
| surface-raised | `#ffffff` | `#1c2124` | menus, popovers |
| hairline | `#e3e7e5` | `#272e31` | every border |
| hairline-strong | `#c9d2cf` | `#3a4448` | control borders |
| ink | `#1a2224` | `#f1f4f3` | text |
| ink-muted | `#5b6e71` | `#9aa5a3` | secondary text, labels |
| ink-faint | `#8a9a9c` | `#6f7b79` | separators, placeholders |
| primary | `#246169` | `#05cebb` | the filled button, the active bar |
| primary-ink | `#ffffff` | `#0c2b30` | text on primary |
| link | `#0a6f66` | `#5fd8c9` | links, row actions |
| success | `#1f7a4d` | `#5ccf8f` | Ready, Approved, Published |
| warning | `#8f5508` | `#e0a634` | Needs evidence, Waiting on you |
| danger | `#b8322a` | `#f07167` | errors, Remove, Void |
| info | `#2a5f9e` | `#7db4f0` | Frozen, Final |
| focus | `#05cebb` | `#05cebb` | the focus ring |
| selected | `#eaf4f2` | `#1a2325` | the open row |
| sidebar-bg | `#11363c` | `#0a1e22` | the rail |
| sidebar-ink | `#eef8f6` | `#eef8f6` | text on the rail |
| sidebar-muted | `#9cc0bd` | `#8fb3b0` | labels on the rail |
| sidebar-active | `#1b4a51` | `#15353a` | the open section |
| sidebar-accent | `#05cebb` | `#05cebb` | the active bar, the badge, "OS" |

Every text token clears WCAG 2.2 AA (4.5:1, or 3:1 at 24 px and above)
against the surface it is meant for, in both themes; a unit test holds the
table to that. A status is never conveyed by colour alone: the word is
always printed beside the dot.

### Themes

- The light theme is the default. The dark theme is chosen from the account
  menu or follows the operating system when the person has never chosen.
- The choice is a per-browser convenience, kept in local storage; it is not
  an account setting and never reaches the server.
- Every screen, drawer, modal, menu and toast renders correctly in both
  themes. There is no third theme.

### The kit

The shared components under `src/components` become the kit below. A feature
composes the kit; it does not reach for a colour, a border or a blur of its
own.

| Component | What it is |
| --- | --- |
| `AppShell`, `Sidebar` | the rail and the content column; the admin rail is the same component with other sections |
| `PageHeader` | the breadcrumb row (Back, crumbs, help, status line) and the title row (title, chips, subtitle, actions) |
| `Button` | primary (filled), secondary (outlined), ghost, danger; an icon slot; a small size |
| `Chip` | an outlined label: a state (**Draft**, **Final**), an approach, a pack tag |
| `StatusDot` | a dot and a word, in the success, warning, danger, info or neutral tone; replaces `StatusPill` |
| `StatStrip` | a row of label, value and unit separated by hairlines |
| `Tabs` | the underline tabs, counts as plain numbers |
| `FilterRow` | the search field and up to four selects on one row, sharing the width; they wrap to two columns under 1100 px and never stack one per line |
| `DataTable` | header, selectable rows, two-line cells, right-aligned quantities, a status cell, a row menu, a footer with the count and Previous and Next |
| `Panel` | the flat card with an optional head; replaces `GlassCard` |
| `Field`, `Select`, `TextArea`, `Search` | 44 px controls with a 13 px label, a hint, an inline error |
| `Banner` | a hairline box with a 3 px coloured left edge, for the read-only, support-access and completeness notices |
| `LifecycleBar` | the four states with dots and a connecting line |
| `SplitView` | a summary list on the left and a detail on the right (below) |
| `Drawer`, `Modal`, `Menu`, `Popover`, `Toast` | the floating surfaces, flat, with the one shadow |

### Lists

A list of records is a table, not a grid of cards: organizations,
inventories, source documents and runs join entities, facilities, activity
and factors. Each row's first cell is two lines, the record's name over its
identifier or meta line; quantities are right-aligned with the unit on a
second line; the status is a dot and a word.

### The split register

Two screens show one record beside the register it came from: the activity
register (spec 04.6) and the inventory workbench's Records tab (spec 05.6).

- With no record open the register is the full table with its stat strip,
  tabs, filter row and footer.
- Opening a record (a click on a row, **Enter** on the keyboard cursor,
  **Add activity**, or the `?record=` key in the URL) turns the page into a
  split: on the left the register as a **summary list**, on the right the
  record's **detail**. The page title and actions stay.
- The summary list keeps the tabs and shows one compact row per record: the
  name, the facility and period (or the scope and category on the inventory)
  underneath, the quantity on the right; a record needing attention carries
  an amber dot and its first issue; the open record has the selected fill
  and the 3 px primary bar. The count line closes the list.
- The detail has an eyebrow (the scope and category), the record's name as
  a large title, a meta line (reference, status, and on the inventory the
  facility, quantity and period), previous and next arrows, a close button,
  and tabs. On the activity register the tabs are **Activity**,
  **Calculation** and **Evidence**; the Activity tab holds the fields of
  the former drawer, the attached file with a **View** link, and the
  completion note ("Activity data complete, Ready for calculation", or the
  draft's issues). On the inventory the tabs are **Classify** and
  **Exclude**, with the former drawer's forms. Closing the detail, or
  **Cancel**, returns the full table.
- Everything the drawers did stays: the URL key, the j, k and Enter
  shortcuts, focus landing on the first control and returning to the row,
  the role gating and the read-only state of a frozen inventory.

### Pre-flight

The inventory workbench shows pre-flight as a **chip** at the right end of
the title row, beside the lifecycle actions, instead of a banner above the
tabs and a panel at the foot of the Records tab:

- green with a check and **Ready to launch** when every gate passes;
- amber with an exclamation mark and **Ready to launch · 1 warning** when a
  gate warns;
- red with the count and **Launch on hold · 2 blocking** when a gate blocks.

Clicking the chip opens a **popover** under it: **Pre-flight checks**, the
one-line summary, the five gates each with a dot, name and verdict (Pass,
Warn or Hold) and the finding under the gate that raised it, and a footer
with **Resolve the finding →** (to the page where the fix lives) and
**Close**. Esc, the chip and a click outside close it. It is not a modal
and not a side panel, so the register stays in reach while the person reads
the checks.

### Page specifics the mockup settled

- The organizations list has no heading and no lede; the table and the
  **New organization** button are the page.
- The overview opens with a stat strip (latest final run, activity records,
  needs attention, updates waiting), then the headline inventory and the
  top facilities side by side, then the setup checklist as a table.
- The sign-in card is the lockup, **Sign in**, the fields and the button;
  the tagline is gone.

## API

No change.

## Data

No change. The theme choice lives in the browser.

## Events

None.

## Verification

- A unit test over the token table checks every text token against its
  surfaces for AA contrast in both themes, so a colour cannot regress
  silently.
- Each kit component has a test; `StatusDot` asserts the word is present,
  `Sidebar` asserts the numbering and the active state, `SplitView` asserts
  the URL key, the shortcuts and the focus rules the drawers had.
- `ActivityPage.test.tsx` and `InventoryDetailPage.test.tsx` cover the
  split: a row opens the detail, Esc and Cancel return the table, the
  shortcuts still work, the pre-flight chip reads from the gates and the
  popover lists them.
- A lint script fails the frontend build on `backdrop-blur`, a glass tint,
  a raw palette utility or a hex literal in a feature file; the landing and
  the style sheet are the only exceptions.
- A Playwright sweep opens the nine QA procedures' pages in both themes and
  saves screenshots for review.
- The help figures under `help/docs/assets/screens` are reshot from the
  product after the GHG feature lands, and `make help-check` passes.
- The QA scenarios need no change: they name statuses, buttons and
  drawers' content, not styles. Where a procedure says "drawer" it still
  reads correctly, since the detail is the drawer's content in a new place;
  the vocabulary is updated only if a product string changes.

## Rollout

One pull request per step, in order, each green on the full Definition of
Done:

1. ADR 0009 and this spec (this pull request).
2. Tokens and base: the semantic tokens as CSS variables with the light and
   dark sets, Tailwind utilities mapped to them, the theme switch, the
   contrast test. Nothing visible changes.
3. The kit, with tests. `GlassCard`, `StatusPill` and the app's
   `AmbientBackground` are removed; the landing keeps its own aurora.
4. The shells: the organization and administration layouts move onto the
   rail; the top bar leaves the workspace; spec 08's header rules are
   retired.
5. The GHG feature, in three pull requests: the lists and the split
   register; the inventory workbench and the run report; the reference
   pages and settings.
6. Administration, then authentication, access and profile.
7. The help centre on the tokens, and the nineteen figures reshot.
8. The lint guard, and the removal of every dead keyframe and class.

## Non-goals and open questions

- The landing page keeps the brand aurora and glass; it is marketing, not
  the workbench. Its buttons and type adopt the kit when the landing is next
  touched.
- The help centre's prose layout is not redesigned; it adopts the tokens so
  it reads as the same product.
- No third theme, no per-organization branding, no density setting.
- Mockup B's top navigation is not adopted; the rail keeps the information
  architecture the app has.
- Whether the split register should remember the open record across a
  reload beyond the URL key is left to spec 04.6's next revision.
