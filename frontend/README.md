# CarbonOS frontend

React 19 single-page application built with Vite 8 and TypeScript.

- Structure, the feature-to-module mapping and the npm scripts:
  `docs/reference/frontend-structure.md` in the engineering docs
  (`make docs-serve` from the repository root).
- Dev server: `npm run dev` on http://localhost:5173, proxying `/api` to
  the backend on 8080.
- Definition of Done: `npm run lint && npm run format:check && npm test && npm run build`.
