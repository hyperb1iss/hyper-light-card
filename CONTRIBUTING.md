# Contributing

Use a separate Home Assistant development instance with a configured Hypercolor
or SignalRGB integration. The card calls real Home Assistant services, so choose
lights you can safely change during testing.

## Setup

Install Node.js 24 or newer and the Bun version declared in `package.json`
(`packageManager`). From the checkout:

```sh
bun install --frozen-lockfile
bun run build:dev
```

The bundle is written to `target/hyper-light-card.js`. To copy it into your
Home Assistant configuration directory:

```sh
export HASS_CONFIG_PATH=/path/to/homeassistant/config
bun run dev
```

The copy script requires an explicit path. It writes the bundle and source map
to `www/hyper-light-card/` beneath that directory. Register
`/local/hyper-light-card/hyper-light-card.js` as a **JavaScript module** in Home
Assistant's dashboard resources, then add the card to a dashboard. Restart Home
Assistant once if the `www` directory did not exist when it started.

After each change, run `bun run dev` and reload the dashboard. The card needs
Home Assistant's frontend components, entity state, and service connection;
`bun run start` alone does not provide a standalone card demo.

## Checks

Run the same gates as CI before opening a pull request:

```sh
bun run lint
bun run format:check
bun run typecheck
bun run test
bun run build
bun run test:build
```

Biome checks source, tests, and tooling. Prettier formats TypeScript and
JavaScript, including Lit templates. Use `bun run lint:fix` and `bun run format`
for fixes, then inspect the diff. For focused test work:

```sh
bun run test -- tests/state-manager.test.ts
bun run test:watch
bun run test:coverage
```

Browser-check user-facing changes in Home Assistant at desktop and phone
widths. Exercise power, brightness, effect selection, keyboard navigation, and
the card editor. Check both backends when changing shared behavior. Reconfigure
and remove/re-add the card to catch lifecycle bugs that a fresh mount misses.

## Code layout

| Area | Responsibility |
| --- | --- |
| `src/hyper-light-card.ts` | Card rendering, events, and Home Assistant lifecycle |
| `src/hyper-light-card-editor.ts` | Backend-aware visual editor |
| `src/backends/` | Entity discovery, backend state, and service calls |
| `src/state-manager.ts` | State synchronization, pending controls, and palette requests |
| `src/state.ts` | Reactive presentation state |
| `tests/` | Vitest regressions and Home Assistant fixtures |

Keep entity discovery scoped to the selected integration instance. Async work
must not publish into a replaced or disconnected card manager. Cover behavioral
fixes with tests that exercise the public lifecycle where practical.

## Production builds and releases

`bun run build` produces a single minified ES module and its source map in
`target/`. The version banner comes from `package.json`. `bun run build:hacs`
uses the same build, so local and release artifacts follow one path.

Maintainers can use the Release workflow to prepare a version bump and tag.
Its dry-run mode validates the version and runs the checks and build without pushing. A `vX.Y.Z` tag triggers
CI/CD, runs the checks, builds the card, and publishes `hyper-light-card.js`
with its source map and GitHub-generated release notes. Releases use the
repository's GitHub token; no external model API key is required.

## Pull requests

Explain the user-visible problem and resulting behavior. Include the checks you
ran and screenshots or a short recording for visual changes. Update the
[configuration reference](docs/configuration.md) when options change, and keep
installation instructions consistent with the released bundle.
