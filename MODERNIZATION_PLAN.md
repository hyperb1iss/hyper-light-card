# 🔮 Hyper Light Card: Modernization & Multi-Backend Plan

_Authored 2026-05-05. Living document; update as decisions land._

## 0. Snapshot & decisions

**Today.** v1.0.0 ships a Lit 3.2 / Vite 6 / ESLint 9 / Prettier card welded to SignalRGB. Render code reads SignalRGB-shaped attributes (`effect_image`, `effect_description`, `effect_publisher`, `effect_uses_audio/input/video`, `effect_parameters`). Auto-discovery and stub config hardcode `signalrgb_*` entity prefixes. Layout/preset/effect-button entities are externally configurable but assumed to be SignalRGB-flavored.

**Decisions locked in.**

- **Backend abstraction.** Render code stops reading raw HA attributes; consumes view models from a `LightBackend`. SignalRGB and Hypercolor are siblings, not subclasses.
- **Effect imagery is unified.** Hypercolor will expose `effect_image` on the master light (work tracked upstream in `hypercolor-hass`). Color extraction pipeline survives unchanged.
- **Toolchain target.** Biome 2.4 for linting and non-TS formatting (JSON, CSS); Prettier 3.x kept for TS/JS formatting because it auto-formats Lit's `` html`` `` template literals and Biome 2.4 still doesn't. ESLint is dropped. Vite 7, Vitest 4 with browser mode, Lit 3.3.1, TS 5.9, custom-card-helpers v2, standard TC39 decorators.
- **HA UI tokens.** Compose with `ha-card`, `ha-control-slider`, `ha-control-switch`, `ha-control-button-group`, `ha-form` for editor. Bind to HA CSS custom properties; never hardcode.
- **Sections view.** Implement `getGridOptions()`. Mandatory in 2026.

**Deferred until needed.** Lit `@lit-labs/signals` (still labs), Rolldown bundler (Vite 8 lands but unstable for HACS use cases), per-device child lights (Phase 4 optional surface).

---

## 1. Phase 1: Toolchain modernization

**Goal.** Pristine toolchain on a clean repo before any architectural work. Zero behavior change. One PR.

**Scope in.** Lint/format/test/build tooling, dependency refresh, TS decorator migration, CI tightening, perf-hostile CSS removal.

**Scope out.** Render logic, state shape, backend assumptions.

### 1.1 Dependency targets

| Package | Current | Target | Notes |
| --- | --- | --- | --- |
| `lit` | 3.2.1 | ^3.3.1 | No breaking changes |
| `typescript` | ^5.8.2 | ^5.9 | Standard decorators stable |
| `vite` | 6.2.2 | ^7 | Skip Vite 8 / Rolldown until late 2026 |
| `vitest` | 3.0.8 | ^4 | Adds browser mode |
| `@vitest/coverage-istanbul` | 3.0.8 | ^4 | Match Vitest |
| `custom-card-helpers` | ^1.9.0 | ^2.0.0 | Resurrected Feb 2026 |
| `chroma-js` | 3.1.2 | ^3.1 | Float on minor |
| `colorthief` | 2.6.0 | ^2.6 | Stable |
| `@biomejs/biome` | — | ^2.4 | New: lint + format (non-TS) |
| `prettier` | 3.5.3 | ^3.5 | Kept; TS/JS format only (Lit template literals) |
| `eslint`, `eslint-*`, `lint-staged` | various | **removed** | Biome + simple pre-commit subsume |
| `@vitejs/plugin-react` | ^4.2.1 | **removed** | Unused |
| `@types/testing-library__jest-dom` | ^5.14.9 | **removed** | Vitest browser supersedes |
| `jsdom` | 26.0.0 | **removed** | Vitest browser supersedes |
| `tslib` | ^2.8.1 | float | Auto-managed by TS |
| `vitest-browser-lit` | — | latest | New: Lit component testing |
| `@vitest/browser` | — | ^4 | New: browser mode |
| `playwright` | — | latest | Browser provider |

### 1.2 File changes

- `package.json` — script overhaul: `lint` → `biome check`, `format` → `prettier --write 'src/**/*.{ts,js}' && biome format --write 'src/**/*.{json,css}'`. Drop `prepare`'s build hook, drop `lint-staged`. Engine bump to `>=22`. Pin Node 22 LTS. Move existing `prettier` config block into `.prettierrc.json` so it stays out of `package.json`.
- `biome.json` (new) — Biome 2.4 config: indent 2, line width 100, single quotes, trailing comma es5, arrow parens avoid, recommended rules. Formatter scope: `**/*.{json,css}` only; explicitly disable formatter for `.ts`/`.js` so it doesn't conflict with Prettier. Override: disable `noExplicitAny` for `*.d.ts` until properly typed.
- `.prettierrc.json` (new) — extracted from `package.json`'s embedded config; scope via `.prettierignore` to TS/JS only.
- `tsconfig.json` — flip `experimentalDecorators: false`, add `useDefineForClassFields: true`, bump `target` to `ES2023`. Verify Lit `@property`/`@state` decorators still bind under standard semantics (they do as of 3.3).
- `vite.config.ts` — drop unused, simplify; keep terser config since it's load-bearing for HACS distribution.
- `eslint.config.mjs` — delete.
- `.github/workflows/*` — Node 22, run `biome check` and `prettier --check 'src/**/*.{ts,js}'` in CI, parallelize lint/typecheck/test/build.
- `src/hyper-light-card-styles.css` — remove `* { transition: all 0.5s ease }` (perf hazard during palette swaps); add explicit transitions only on the elements that animate (light icon, dropdown, effect-info reveal, brightness slider thumb, effect button hover).
- `package-lock.json` — regenerated.
- `tests/config/vitest.config.ts` — switch to browser mode with Playwright provider.

### 1.3 Verification

```bash
npm install
npm run check        # biome lint + format check
npm run typecheck    # tsc --noEmit (new script)
npm run test         # vitest run (browser mode)
npm run build        # vite build, terser pass
```

Manual smoke: load built `target/hyper-light-card.js` in a real HA instance, verify card renders identically to v1.0.0 against a SignalRGB entity.

### 1.4 Acceptance

- `npm run check && npm run typecheck && npm run test && npm run build` all green.
- Card renders byte-identical UI in real HA against SignalRGB.
- Bundle size delta ≤ +5% (Lit 3.2 → 3.3 is tiny; Biome adds zero runtime).
- No behavior changes user-visible.

---

## 2. Phase 2: Backend adapter

**Goal.** Decouple render code from SignalRGB-specific entity attributes. Ship `LightBackend` interface with a `SignalRgbBackend` implementation that preserves current behavior 1:1. One PR.

**Scope in.** New `src/backends/` directory, refactor of `state-manager.ts` to consume backends, adapter detection logic, full unit-test coverage of `SignalRgbBackend`.

**Scope out.** Hypercolor implementation (Phase 3). New UI surfaces (Phase 4). Editor rewrite (Phase 5).

### 2.1 Architecture

```
src/
  backends/
    types.ts          # LightBackend interface + view models
    detect.ts         # auto-detect backend from entity
    signalrgb.ts      # SignalRgbBackend
    index.ts          # registry + lookup
  state-manager.ts    # consumes backend, no raw attribute reads
  hyper-light-card.ts # renders from view models
```

### 2.2 LightBackend interface (final shape)

```ts
export interface LightBackend {
  readonly id: BackendId;
  readonly displayName: string;

  describeCard(ctx: BackendContext): CardModel;
  describeEffect(ctx: BackendContext): EffectModel;
  effectList(ctx: BackendContext): EffectListModel;

  layouts(ctx: BackendContext): SelectModel | null;
  presets(ctx: BackendContext): SelectModel | null;
  scenes?(ctx: BackendContext): SelectModel | null;
  profiles?(ctx: BackendContext): SelectModel | null;

  navigation(ctx: BackendContext): NavigationModel;
  liveControls?(ctx: BackendContext): LiveControlModel[];
  connectivity?(ctx: BackendContext): ConnectivityModel | null;
  fps?(ctx: BackendContext): number | null;
  audio?(ctx: BackendContext): AudioModel | null;
  perDevice?(ctx: BackendContext): DeviceModel[] | null;

  togglePower(ctx: BackendContext, on: boolean): Promise<void>;
  setBrightness(ctx: BackendContext, value: number): Promise<void>;
  setEffect(ctx: BackendContext, effect: string): Promise<void>;
  setLayout(ctx: BackendContext, value: string): Promise<void>;
  setPreset(ctx: BackendContext, value: string): Promise<void>;
  setScene?(ctx: BackendContext, value: string): Promise<void>;
  setProfile?(ctx: BackendContext, value: string): Promise<void>;
  setLiveControl?(ctx: BackendContext, id: string, value: number): Promise<void>;
  pressNavigation(ctx: BackendContext, action: 'next' | 'previous' | 'random' | 'stop'): Promise<void>;

  autoDiscover?(ctx: BackendContext): Partial<Config>;
  stubConfig?(hass: HomeAssistant, entities: string[]): Config | null;
}

export interface BackendContext {
  hass: HomeAssistant;
  config: Config;
}
```

### 2.3 Detection

Two-stage detection in `backends/detect.ts`:

1. **Domain prefix.** `entity_id.split('.')[1]` matches `^signalrgb_` → SignalRGB; matches `^hypercolor` → Hypercolor.
2. **Feature signature fallback.** If prefix is renamed, inspect the device registry via `hass.entities[entityId].platform`. Returns `'signalrgb'` or `'hypercolor'` from HA's authoritative source. Use this as the primary path once Phase 3 lands.
3. **Manual override.** New optional `Config.backend?: BackendId` for power users. Honored above auto-detection.

Picked backend is memoized per card instance until `setConfig()` runs again.

### 2.4 SignalRgbBackend (Phase 2 deliverable)

Lifts every current attribute read into the backend:

- `describeEffect()` → reads `effect_description`, `effect_publisher`, `effect_uses_audio/input/video`, `effect_parameters`.
- `describeCard()` → reads `effect_image` for palette source.
- `effectList()` → reads `effect_list` and applies `allowed_effects` filter.
- `setBrightness()`, `setEffect()` → existing `light.turn_on` paths.
- `pressNavigation()` → existing `button.press` paths.
- `autoDiscover()` → existing `signalrgb_*` regex matching.
- `stubConfig()` → existing entity-list-based defaults.
- `liveControls`, `scenes`, `profiles`, `connectivity`, `fps`, `audio`, `perDevice`, `setLiveControl`, `setScene`, `setProfile` → undefined / return null.

### 2.5 Render code refactor

`hyper-light-card.ts` and `state-manager.ts` lose all `stateObj.attributes.*` reads outside of the backend. The render method consumes view models. State manager owns:

- Color extraction (driven by `describeCard().paletteSource`).
- Dropdown open/close state.
- Brightness debounce and drag tracking.
- Calling backend setters.

### 2.6 Verification

- New unit tests under `tests/backends/signalrgb.test.ts` covering each interface method against fixture `HassEntity` shapes.
- Existing card tests (`hyper-light-card.test.ts`) updated to inject a `SignalRgbBackend` directly and verify render output.
- Visual regression: hand-test against real SignalRGB instance, compare to Phase 1 baseline.

### 2.7 Acceptance

- `grep -r "stateObj.attributes\|signalrgb_" src/` returns zero hits outside `src/backends/`.
- Test coverage on `SignalRgbBackend` ≥ 90% lines.
- Existing card tests pass without modification beyond setup.
- No behavior change in real HA.

---

## 3. Phase 3: Hypercolor backend

**Goal.** Implement `HypercolorBackend` mapping the integration's entity surface to the same view models. Card now works against either SignalRGB or Hypercolor with auto-detection. One PR.

**Prerequisite.** Effect-image API lands in `hypercolor-hass` (Bliss owns this).

### 3.1 Entity surface mapping

| View model field | Hypercolor source |
| --- | --- |
| `CardModel.paletteSource` | `light.hypercolor.attributes.effect_image` (once API ships) |
| `EffectModel.name` | `light.hypercolor.attributes.effect` or `sensor.hypercolor_active_effect.state` |
| `EffectModel.description` | catalog metadata via `active_effect_id` lookup |
| `EffectModel.publisher` | catalog metadata, fallback to "Hypercolor" |
| `EffectModel.usesAudio` | catalog `audio_reactive` flag |
| `EffectModel.usesVideo/Input` | not applicable, return false |
| `EffectModel.parameters` | derived from live controls (label/value/type) |
| `EffectListModel.list` | `light.hypercolor.attributes.effect_list` |
| `EffectListModel.current` | `light.hypercolor.attributes.effect` |
| `SelectModel layouts` | `select.hypercolor_layout` |
| `SelectModel presets` | `select.hypercolor_preset` |
| `SelectModel scenes` | `select.hypercolor_scene` |
| `SelectModel profiles` | `select.hypercolor_profile` |
| `LiveControlModel[]` | `number.hypercolor_brightness/speed/hue_shift/intensity` |
| `ConnectivityModel` | `binary_sensor.hypercolor_connected` |
| `FPS` | `sensor.hypercolor_fps.state` |
| `AudioModel.beat` | `binary_sensor.hypercolor_audio_beat` |
| `AudioModel.energy` | `sensor.hypercolor_audio_energy` |
| `AudioModel.reactiveActive` | `binary_sensor.hypercolor_audio_reactive_active` |
| `DeviceModel[]` | child lights with `via_device == light.hypercolor`, queried from `hass.entities` + `hass.devices` |
| Navigation buttons | `button.hypercolor_previous_effect/next_effect/random_effect/stop_effect` |

### 3.2 Catalog metadata access

The catalog isn't on the light entity. Two paths:

1. **Best-effort.** Lookup against the active-effect attributes the light already exposes. Sufficient for description/publisher if Hypercolor surfaces them on the light entity (recommend a small upstream addition: `effect_description`, `effect_publisher`, `effect_audio_reactive` as light attributes mirroring SignalRGB).
2. **Service-call enrichment.** If we can't get the upstream addition, fall back to `hass.callApi('GET', 'states/...')` for the active-effect-detail attribute. Avoid this path; ask Bliss to mirror the four attributes.

Recommendation: bundle the upstream `hypercolor-hass` light-attribute additions with the effect-image work since they're trivial and unlock the description/publisher/audio fields with zero card-side gymnastics.

### 3.3 Auto-discovery

Hypercolor's hub model means all related entities share the device registry entry. Discovery becomes:

```
device_id = hass.entities[main_entity].device_id
related = entries(hass.entities)
  .filter(e => e.device_id === device_id)
  .by_domain_and_translation_key(...)
```

Cleaner than SignalRGB's regex-based approach. Falls back to `^hypercolor_` prefix matching if device registry isn't populated.

### 3.4 Verification

- `tests/backends/hypercolor.test.ts` mirrors SignalRGB coverage with hypercolor fixtures.
- Live test against `just hass-dev` running `hypercolor-hass` in a throwaway HA instance.
- Switch the same card config between SignalRGB and Hypercolor entities, verify both render correctly without code change.

### 3.5 Acceptance

- Card renders correctly in real HA against `light.hypercolor` with no manual config beyond the entity ID.
- Auto-discovery picks up layout/preset/scene/profile/buttons/live-controls without user intervention.
- Switching between backends in the same dashboard works without state leakage.

---

## 4. Phase 4: Hypercolor-flavored UI surfaces

**Goal.** Land the new card territory hypercolor unlocks. One or two PRs depending on review appetite.

### 4.1 Live control rail

Replace the static `effect_parameters` list with an interactive slider stack when the active backend exposes `liveControls`. Use `ha-control-slider` for native feel. Each slider:

- Auto-binds min/max/step from the backend.
- Shows label from control metadata.
- Calls `setLiveControl(id, value)` with debounced commit (50ms).
- Goes unavailable when the active effect doesn't expose that control.

Keeps the existing static-params view as a fallback when the backend doesn't ship live controls (SignalRGB).

### 4.2 Scene + profile pickers

New row above layout/preset, only rendered when backend exposes scenes/profiles. Uses the existing dropdown UI. Toggleable via `show_scene_select` / `show_profile_select` config.

### 4.3 Status chips

Compact header chips, opt-in via `show_status_chips: true`:

- **FPS.** Small `60 fps` badge tinted by accent color.
- **Connectivity.** Color dot from `ConnectivityModel`. Red when daemon disconnected.
- **Audio pulse.** When `AudioModel.reactiveActive` is true, sync the existing `light-icon` pulse animation period to the beat sensor instead of a fixed 1.5s. CSS animation-delay or explicit `animationiteration` listener; pick whichever is cheapest.

### 4.4 Per-device drilldown (optional, off by default)

Bottom expandable section. Each child light gets a row: name, brightness slider, identify button. Wired to `light.turn_on` / `light.turn_off` and `button.press` for the identify entity. Off by default to keep the card focused; opt-in via `show_per_device: true`.

### 4.5 Sections view

`static getGridOptions()` returning `{ rows: 'auto', columns: 12, min_rows: 3, min_columns: 6 }` (refine after testing). Required for HA 2025.x sections-view layout.

### 4.6 Acceptance

- Live controls work against hypercolor with smooth (sub-100ms) commit latency.
- Scene/profile pickers behave like layout/preset.
- Status chips render and update live; audio-beat pulse visible when audio reactive effect is active.
- Sections view sizes the card sensibly.
- All Phase 4 features are config-gated; SignalRGB users see no changes unless they opt in.

---

## 5. Phase 5: Editor rewrite

**Goal.** Replace the hand-rolled `<hyper-light-card-editor>` with `getConfigForm()` + `ha-form` schemas. One PR.

**Why.** Half the editor's surface area is reimplementing HA's own widgets badly. `ha-form` gives us native selectors, dark-mode, theme tokens, validation, and one third of the code.

### 5.1 Schema strategy

Driver-aware schema generated from the active backend:

```ts
static getConfigForm() {
  return {
    schema: (data: Config) => buildSchema(detectBackendByEntity(data.entity)),
    assertConfig: (config) => assertHyperLightConfig(config),
  };
}
```

When the picked entity is hypercolor, schema includes scene/profile/live-control toggles. When signalrgb, schema includes the existing layout/preset/effect-button toggles. Auto-discovery hints rendered as helper text under each field.

### 5.2 Allowed-effects picker

Replace the hand-rolled checkbox dropdown with `ha-form`'s `selector: { select: { multiple: true, options: [...] } }` populated from the active backend's `effectList()`.

### 5.3 Acceptance

- Editor renders with native HA styling, respects dark/light theme automatically.
- All existing config options remain available with identical semantics.
- `assertConfig()` rejects invalid configs with a clear message.
- Switching entity in the editor updates the schema (e.g., hypercolor-only fields appear/disappear).

---

## 6. Sequencing

```
Phase 1  (toolchain)          ──►  PR #1
Phase 2  (adapter + signalrgb) ──►  PR #2  (depends on #1)
Phase 3  (hypercolor backend)  ──►  PR #3  (depends on #2 + upstream effect_image)
Phase 4  (new UI surfaces)     ──►  PR #4  (depends on #3, can chunk further)
Phase 5  (editor rewrite)      ──►  PR #5  (parallel with #4 once #3 lands)
```

PRs #4 and #5 can land in either order. PR #1 must land before any other work. PR #3 depends on Bliss shipping `effect_image` (and ideally `effect_description` / `effect_publisher` / `effect_audio_reactive`) on the hypercolor master light.

Estimated effort: PR #1 ½ day, PR #2 1 day, PR #3 ½–1 day, PR #4 1–2 days depending on chunking, PR #5 ½ day.

## 7. Test strategy

| Layer | Tooling | What it covers |
| --- | --- | --- |
| Unit | Vitest 4 (node) | Pure utilities (`utils.ts`, `color-manager.ts`), backend logic |
| Component | Vitest 4 browser + `vitest-browser-lit` + Playwright | Card render, dropdown interactions, brightness slider, editor schema |
| Integration | Manual against `just hass-dev` | Both backends, real HA, live control responsiveness |

Test fixtures: synthesize `HassEntity` shapes for both SignalRGB and Hypercolor under `tests/fixtures/`. One file per backend, contains a fully-formed master light, layout/preset selects, navigation buttons, and (for hypercolor) live-control numbers, sensors, binary sensors.

## 8. Rollback

Each PR is self-contained and revertible. Phase 2 is the only architectural shift; if it ships and a regression emerges, revert PR #2 reverts cleanly to Phase 1 state. Phases 3–5 are additive and can be reverted individually without destabilizing earlier phases.

Backwards compat: every Phase 4/5 feature is gated by config flags, defaulting to old behavior. SignalRGB users on existing dashboards see zero changes through the entire migration.

## 9. Out of scope

- Theme presets / user color overrides (separate feature).
- WLED / OpenRGB backends (the adapter pattern enables them, but not in this plan).
- Card v2 visual redesign (this is a refactor, not a redesign).
- HACS-store metadata changes beyond version bump.
- Migrating existing users' YAML configs (no breaking changes shipped).

## 10. Open questions

None blocking. Outstanding upstream asks for Bliss in `hypercolor-hass`:

- Add `effect_image` attribute to `light.hypercolor` (confirmed in flight).
- Recommended: add `effect_description`, `effect_publisher`, `effect_audio_reactive` as mirrors. Without these, Phase 3 needs catalog enrichment via WS calls, which adds latency and surface area.

---

_Plan ends. Edit freely as decisions evolve. Phase 1 is ready to start on go-ahead._
