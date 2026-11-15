# Forest of Keys

A COS750 web app that prepares COS212 students for the lecture on **binary search trees**.
It teaches one data structure (the BST) and one algorithm (**BST search**: finding a key, or deciding that it is absent).
Students watch a worked example, complete searches with fading support, practise with generated questions,
build their own trees, and finish with a 10-question check that reports readiness outcome by outcome.
Nothing is marked and nothing leaves the browser.

Design documents are in [`docs/`](docs/).

## Getting started (run it on your computer)

### 1. Install the tools (once per computer)

- **Node.js 20.19 or newer** (version 24 LTS recommended). Download the LTS installer from <https://nodejs.org> and keep the default options; npm comes with it.
- **Git**: <https://git-scm.com/downloads>.

Check that both work by opening a terminal (on Windows: PowerShell, or the terminal in VS Code) and running:

```bash
node -v    # should print v20.19 or higher, e.g. v24.x
npm -v
git --version
```

If you use a Node version manager (nvm, nvm-windows or fnm), run `nvm use` in the project folder to pick the version in `.nvmrc`.

### 2. Get the code

```bash
git clone https://github.com/Jared-Hurlimann/COS750-Final-Assignment.git
cd COS750-Final-Assignment
```

### 3. Install the project's packages (first time, and after every pull that changes `package.json`)

```bash
npm install
```

This creates a `node_modules/` folder. It is not committed to git, so every teammate runs this once.

### 4. Start the app

```bash
npm run dev
```

Open the link it prints, normally **<http://localhost:5173>**. The page reloads by itself when you save a file.
Press `Ctrl + C` in the terminal to stop it.

### 5. Before you push: check nothing is broken

```bash
npm run typecheck   # TypeScript errors
npm test            # all unit tests must pass
npm run build       # makes sure the production build works
```

GitHub runs the same checks on every push and pull request.

### Try it on your phone

With your phone on the **same Wi-Fi** as your computer:

```bash
npm run dev -- --host
```

Open the **Network** address it prints (e.g. `http://192.168.1.23:5173`) in your phone's browser. If it doesn't load, allow Node.js through your firewall when Windows asks.

The **"Install app" / offline** features only work in the production build served over HTTPS, so test those on the deployed GitHub Pages site. `npm run build` then `npm run preview` shows the production build locally.

### All commands

| Command | What it does |
| --- | --- |
| `npm install` | Install packages (run after cloning or pulling new dependencies) |
| `npm run dev` | Start the dev server at http://localhost:5173 |
| `npm run dev -- --host` | Same, but reachable from your phone on the same Wi-Fi |
| `npm test` | Run all Vitest tests once |
| `npm run test:watch` | Re-run tests whenever you save |
| `npm run typecheck` | TypeScript check only |
| `npm run build` | Typecheck and build the production site to `dist/` |
| `npm run preview` | Serve the production build locally |

### Common problems

| Problem | Fix |
| --- | --- |
| `'npm' is not recognized` / `command not found` | Node isn't installed or the terminal was open before installing. Install Node, then close and reopen the terminal (or VS Code). |
| `Cannot find module …` or a strange error after pulling | Run `npm install` again. Still broken: delete the `node_modules` folder and run `npm install`. |
| `Port 5173 is already in use` | Another dev server is running; stop it with `Ctrl + C`, or use the new port Vite suggests. |
| PowerShell says `running scripts is disabled` | Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, or use Command Prompt / Git Bash. |
| The app shows an old screen or old progress | Progress is saved in your browser. Use ⚙ Settings → *Start again from scratch*, or open the site in a private window. |
| Node version error (`requires Node >= 20.19`) | Update Node from <https://nodejs.org>. |

### Working together

1. `git pull` before you start, then `npm install` if `package.json` changed.
2. Make a branch for your work: `git checkout -b your-name/what-you-are-doing`.
3. Run `npm run typecheck && npm test` before committing.
4. Push your branch and open a pull request into `main`. Merging into `main` deploys the site automatically.

VS Code will suggest the Vitest and EditorConfig extensions when you open the folder (`.vscode/extensions.json`).

## Tech stack

| Layer | Choice |
| --- | --- |
| UI | React + Vite |
| Language | TypeScript |
| Tree drawing | Plain SVG (`src/components/TreeView.tsx`) |
| Styling | Plain CSS (`src/styles.css`), light and dark themes |
| Content | JSON (`src/content/lessons.json`, `src/content/questionBank.json`) |
| Progress | `localStorage` only: no login, no student data, works offline |
| Testing | Vitest on the algorithm engine, question generator and screen rendering |
| Icons / fonts | lucide-react icons; Atkinson Hyperlegible (body) and Bricolage Grotesque (headings), bundled for offline use |
| Mobile | Installable PWA (`public/manifest.webmanifest`, `public/sw.js`), works offline after the first visit |
| Hosting | GitHub Pages via GitHub Actions |
| Back end | None |

## Project layout

```
docs/            Design documents (Final ID Document, earlier draft, suggestions, tech stack)
public/          Static files: favicon, PWA manifest, service worker (sw.js), app icons
src/
  engine/        Pure TypeScript, no React: fully unit-tested
    bst.ts         insert, search trace, validation, measures, layout
    questions.ts   question generators tagged by learning outcome (LO1–LO5)
    random.ts      seeded RNG so generated questions are reproducible
  components/
    TreeView.tsx           SVG tree drawing with smooth movement and the travelling key bubble
    SearchWalker.tsx       Go left / Go right / Found it, in watch, guided and free modes
    useInsertAnimation.ts  animated insertion used on the learning screens
    QuestionCard.tsx       multiple-choice and trace questions
    Glossary.tsx           tappable terms, glossary panel, [[term]] text markup
    SettingsPanel.tsx      theme, text size, animations, narration, install app
    Narrate.tsx            optional narration (Listen buttons, worked-example steps) with the device's voice
    LeaveDialog.tsx        "Leave the final check?" confirmation
    Pseudocode.tsx, Logo.tsx
  screens/       The 10 screens of the user journey (0 Welcome … 9 Results)
  content/       Editable text: lessons.json, glossary.json, questionBank.json
  settings.tsx   Display settings (per device)
  progress.ts    Learner progress in localStorage
  App.tsx        Header, journey navigation, page switching
  styles.css     All styling and colour tokens (light and dark)
```

## Screens and learning outcomes

| # | Screen | Outcomes |
| --- | --- | --- |
| 0 | Welcome | Hook, where BSTs are used, outcomes, reassurance |
| 1 | What is a tree? | LO1 |
| 2 | The BST rule | LO2 |
| 3 | How a search works | prepares LO3 |
| 4 | Worked example | LO3, LO4 |
| 5 | Your turn (fading support) | LO3, LO4 |
| 6 | Practice (adaptive) | LO2–LO5 |
| 7 | Sandbox (incl. the class-list task) | LO5 |
| 8 | Final check (10 questions, 2 per LO; asks before you leave mid-check) | LO1–LO5 |
| 9 | Results, revision route and downloadable summary | LO6 |

Results routes: **80%+** lecture-ready · **50–79%** review weak outcomes · **below 50%** back to the worked example and
"Your turn". Every route then retakes the full check.

Comparison counting convention used everywhere: **one comparison per node visited**; reaching an empty spot costs nothing.

## Accessibility

- Colour-blind safe palette: right/wrong use blue/orange (never green vs red), always with ✓ / ✗ and solid/dashed outlines.
- Light, dark or automatic theme; three text sizes; animations can be turned off (also follows the device's reduced-motion setting).
- Every technical word is tappable for a plain-language definition (`src/content/glossary.json`), and there is a full Glossary panel.
- Atkinson Hyperlegible font, keyboard operable, buttons instead of drag-and-drop, 44px+ touch targets.
- Optional narration (⚙ Settings → Narration): Listen buttons on lesson text, and the worked example reads each step
  aloud. It uses the device's own voice, so nothing is sent anywhere; everything spoken is also on screen.

Handy URLs for presenting: `?screen=4` opens a screen directly, `?theme=light` or `?theme=dark` sets the theme.

## Editing content

- Lesson wording, term definitions and outcome text: `src/content/lessons.json`. Write `[[node]]` or `[[node|nodes]]` to link a glossary term, `**text**` for bold.
- Real-world uses on the Welcome screen: `welcome.uses` in `lessons.json`. Sandbox class-list task: `sandbox.task`
  (the answers are worked out from the numbers, so you can change them freely).
- Glossary: `src/content/glossary.json`. Every `[[term]]` must exist here; a test checks this.
- Fixed conceptual questions: `src/content/questionBank.json` (`answer` is the index of the correct option).
- Generated questions: `src/engine/questions.ts`. Run `npm test` after any change.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`: install, test, build, then publish `dist/` to GitHub Pages.
One-time setup in the GitHub repo: **Settings → Pages → Source: GitHub Actions**.
Pull requests and other branches run `.github/workflows/ci.yml` (typecheck, tests, build).
