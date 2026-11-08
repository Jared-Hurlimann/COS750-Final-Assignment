# Forest of Keys (COS750 final assignment)

Group project: a React + Vite + TypeScript web app teaching BST **search** to COS212 students before their lecture.
The source of truth for the design is `docs/Suggestions.docx` (10-screen journey, LO1–LO6) and `docs/Tech stack.docx`.
`docs/COS750 Instructional Design Document Draft.pdf` is the earlier draft (it still mentions insertion as a taught
algorithm, badges and drag-and-drop; the group dropped those: insertion is only used in the sandbox to build trees,
and drag-and-drop was replaced by Go left / Go right / Found it buttons).

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
- Deploys to GitHub Pages from `main` (`base: './'` in `vite.config.ts`).
