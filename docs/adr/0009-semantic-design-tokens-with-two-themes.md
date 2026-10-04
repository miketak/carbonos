---
status: proposed
date: 2026-10-03
decision-makers: miketak
owner: miketak
last_reviewed: 2026-10-03
---

# 0009: Semantic design tokens as CSS variables, with two themes

## Context and problem statement

Spec 10 replaces the app's glassmorphism with a flat workbench in a light
and a dark theme. Today colour reaches the components as Tailwind
utilities over the five brand hexes (`text-dark-teal`, `bg-white/55`,
`border-teal/20`) in 2,700 class strings across 175 files, and 50 feature
files use `backdrop-blur` directly. A second theme cannot be added to that
without touching every file twice, and nothing stops the next feature from
reaching for a raw colour again. The question is where colour lives so that
one change restyles the app and a theme is a swap, not a rewrite.

## Considered options

- Keep the brand palette utilities and restyle each component by hand: no
  new machinery, but a dark theme means a second class string on every
  element and the drift continues.
- Semantic tokens as CSS custom properties on the root, two value sets
  switched by a `data-theme` attribute, and Tailwind v4's `@theme inline`
  mapping each token to a utility (`bg-surface`, `text-ink-muted`,
  `border-hairline`): one source of truth, themes at runtime, and the
  utilities read as intent, not colour.
- A theme object in JavaScript (a context provider, styled components):
  themes at runtime too, but a second styling system beside Tailwind, a
  runtime cost on every render, and nothing the style sheet can enforce.

## Decision outcome

Chosen option: semantic tokens as CSS variables with `@theme inline`,
because it keeps one styling system, makes the theme a one-attribute swap
the browser handles, and lets a lint rule and a contrast test hold the line.

The rules that follow:

- Tokens are named for their role (`ground`, `surface`, `ink`, `primary`,
  `success`), never for a colour. The five brand hexes stay as tokens for
  the landing page, the symbol and the splash only.
- The light set lives on `:root`; the dark set on `[data-theme="dark"]`,
  and under `prefers-color-scheme: dark` when no choice has been made. The
  choice is kept in local storage and applied before first paint.
- A feature file uses the token utilities and the kit; it never writes a
  hex, a brand utility, an opacity tint of a brand colour, or
  `backdrop-blur`. A lint script in the frontend build fails on any of
  them outside `src/index.css` and `src/features/home`.
- A unit test checks every text token against its surfaces for WCAG 2.2 AA
  in both themes.

### Consequences

- Good: a theme is a token set, so the dark theme is one block of CSS and
  a future density or branding change is the same kind of block.
- Good: the kit and the utilities say what a colour is for, so a review
  reads intent and the lint rule catches the rest.
- Bad: the migration touches every feature file once, with a codemod for
  the mechanical renames and a hand pass on the fifty glass files; until
  the guard lands, old and new styles coexist for a few pull requests.
- Bad: a raw red or amber utility that survives the codemod renders wrong
  in the dark theme, so the dark theme ships only after the guard is green.
- Watch for: the help figures and the landing page, which keep their own
  rules and must not be swept up by the codemod.
