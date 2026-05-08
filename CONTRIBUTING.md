# 🌟 Contributing to hyper-light-card

🌠🌠🌠 Let's make beautiful pixels together! 🌠🌠🌠


## 🚀 Getting Started

### Issues and Features

- 🔍 Check our [Issues](https://github.com/hyperb1iss/hyper-light-card/issues) page to see if your idea or bug report is already there.
- 💡 If not, feel free to [create a new issue](https://github.com/hyperb1iss/hyper-light-card/issues/new).

### Forking and Branching

1. 🍴 [Fork the hyper-light-card repository](https://help.github.com/articles/fork-a-repo).
2. 🌿 Create a branch with a descriptive name:
   ```sh
   git checkout -b add-new-effect-selector
   ```

## 🛠️ Development Environment

### Prerequisites

- 📦 [Bun](https://bun.com/) `>=1.3.0` — used as the package manager and script runner
- 🟢 [Node.js](https://nodejs.org/) `>=24.0.0` — Vite still runs on Node for the production build

### Setup

1. Clone your fork:
   ```sh
   git clone https://github.com/YOUR_USERNAME/hyper-light-card.git
   ```
2. Navigate to the project directory:
   ```sh
   cd hyper-light-card
   ```
3. Install dependencies:
   ```sh
   bun install
   ```

## 💻 Development Workflow

We use Bun scripts for everything:

- `bun run dev` — Builds in development mode and copies the bundle into your local Home Assistant `www/` folder.
- `bun run build:dev` — One-shot development build (no copy).
- `bun run build` — Production build (minified, terser, prod constants).
- `bun run lint` — Biome lint (also checks JSON/CSS formatting).
- `bun run lint:fix` — Apply Biome autofixes.
- `bun run format:check` — Prettier check on TS/JS sources.
- `bun run format` — Apply Prettier (TS/JS) and Biome formatting.
- `bun run typecheck` — `tsc --noEmit`.
- `bun run test` — Run the Vitest suite once.
- `bun run test:watch` — Vitest in watch mode.
- `bun run test:coverage` — Vitest with V8 coverage output.

### Getting Started with Development

1. Point the dev build at your Home Assistant config directory by setting `HASS_CONFIG_PATH`:
   ```sh
   export HASS_CONFIG_PATH=/path/to/your/homeassistant/config
   ```
   `config.js` reads this env var; the bundle is copied into `<HASS_CONFIG_PATH>/www/hyper-light-card/`.
2. Run the dev build + copy:
   ```sh
   bun run dev
   ```
3. Make your changes to the code.
4. Re-run `bun run dev` (or use `bun run build:dev && bun run copy:hass`) to push the new bundle.
5. Refresh your Home Assistant dashboard to see your changes.

## ✅ QA

Before submitting your changes, run the same gates that CI runs:

```sh
bun run lint
bun run format:check
bun run typecheck
bun run test
```

If lint flags issues that are autofixable, run `bun run lint:fix` and `bun run format`.

## 🏗️ Building for Production

```sh
bun run build
```

This produces the optimized `target/hyper-light-card.js` bundle. CI handles release builds automatically when a tag is pushed.

## 🎉 Submitting a Pull Request

1. Sync your fork with the main repository:
   ```sh
   git remote add upstream git@github.com:hyperb1iss/hyper-light-card.git
   git checkout main
   git pull upstream main
   ```
2. Update your feature branch:
   ```sh
   git checkout add-new-effect-selector
   git rebase main
   git push --set-upstream origin add-new-effect-selector
   ```
3. Go to GitHub and [create a Pull Request](https://help.github.com/articles/creating-a-pull-request).

## 🔄 Keeping Your PR Updated

If asked to rebase your PR, update your branch like this:

```sh
git checkout add-new-effect-selector
git pull --rebase upstream main
git push --force-with-lease add-new-effect-selector
```

## 💡 Best Practices

- 📚 Update documentation for user-facing changes.
- ✨ Add tests for new features or bug fixes.
- 🎯 Keep pull requests focused on a single feature or bug fix.
- 🧪 Run the full QA suite before opening or updating a PR.
