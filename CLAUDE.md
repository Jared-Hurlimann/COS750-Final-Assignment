# Forest of Keys (COS750 final assignment)

Group project: a React + Vite + TypeScript web app teaching BST **search** to COS212 students before their lecture.
The source of truth for the design is `docs/COS750 Final ID Document.pdf` (LO1–LO6, 10-screen journey, scope) and
`docs/Tech stack.docx`. `docs/Suggestions.docx` and `docs/COS750 Instructional Design Document Draft.pdf` are earlier versions.

The Final ID Document was updated to match the app (learning theories, VARK, motivation, assessment & scaffolding,
user journey, App Features Summary). If the app and the document ever disagree, raise it rather than guessing.
These were decided deliberately; do not build them:
- No badges, XP, points or certificate (streaks and a "Lecture-ready" result only); no timed challenges.
- No drag-and-drop (Go left / Go right / Found it buttons); no delete, no traversal simulator; insertion is not taught
  or assessed, only used to build trees on the BST-rule screen and in the sandbox.
- No diagnostic pre-test; the BST rule is stated first, then practised by prediction.
- Results routes: 80%+ lecture-ready, 50–79% review weak outcomes, below 50% back to the worked example and
  "Your turn"; every route retakes the full 10-question check (no separate short re-test).
- Narration uses the device's own voice only (`src/components/Narrate.tsx`); online/cloud voices were rejected because
  of the no-network rule. Off by default; never in the final check or practice.

## Commands
- `npm run dev`, `npm test`, `npm run typecheck`, `npm run build`
- Always run `npm run typecheck && npm test` after changes.

## Rules
- Keep `src/engine/` free of React; every engine rule needs a Vitest test.
- Comparison counting: one per node visited; reaching an empty spot costs nothing. Height is counted in levels.
- Feedback must never be colour-only: pair colour with ✓ / ✗ or text.
- No back end, no login, no network calls; progress is `localStorage` only (wrapped in try/catch).
- Plain SVG and plain CSS; no UI component libraries (lucide-react icons are fine).
- Colours: use the CSS tokens in `src/styles.css` only; right = blue `--ok`, wrong = orange `--bad`, never green vs red.
- Animations (insert walk-down, tweening) only in learning screens, never in challenges; respect `useSettings().animate`.
- Any new technical word must go in `src/content/glossary.json` and be wrapped in `<Term>` / `[[id]]`.
- Lesson text lives in `src/content/*.json` so non-coders in the group can edit it.
- The final check must not be left without confirming: screens block navigation via `setLeaveGuard` (see `App.tsx`).
- Deploys to GitHub Pages from `main` (`base: './'` in `vite.config.ts`).
