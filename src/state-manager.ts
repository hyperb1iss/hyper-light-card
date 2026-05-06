import type { HomeAssistant } from 'custom-card-helpers';
import { detectBackend, signalRgbBackend } from './backends';
import type { BackendContext, LightBackend } from './backends/types';
import { ColorManager } from './color-manager';
import type { Config } from './config';
import type { State } from './state';
import { log } from './utils';

export class StateManager {
  private _hass?: HomeAssistant;
  private _config: Config | undefined;
  private _state: State;
  private _colorManager: ColorManager;
  private _backend: LightBackend;
  private _brightnessDebounceTimer?: number;
  private _liveControlDebounce = new Map<string, number>();
  private _isDraggingBrightness = false;

  constructor(config: Config | undefined, state: State) {
    this._config = config;
    this._state = state;
    this._colorManager = new ColorManager();
    // Backend resolves once both config and hass are available; fall back
    // to signalrgb so accessors stay non-null during construction.
    this._backend = config
      ? detectBackend({ states: {} } as unknown as HomeAssistant, config)
      : signalRgbBackend;
    log.debug('StateManager: Initialized with config', config);
  }

  get hass() {
    return this._hass;
  }

  set hass(hass: HomeAssistant | undefined) {
    this._hass = hass;
    if (hass && this._config) {
      this._backend = detectBackend(hass, this._config);
    }
    this.updateState();
  }

  get backend(): LightBackend {
    return this._backend;
  }

  private get _ctx(): BackendContext | null {
    if (!this._hass || !this._config) return null;
    return { hass: this._hass, config: this._config };
  }

  async updateState() {
    log.debug('StateManager: Updating state');
    const ctx = this._ctx;
    if (!ctx) return;

    const stateObj = ctx.hass.states[ctx.config.entity];
    if (!stateObj) return;

    const card = this._backend.describeCard(ctx);
    const effect = this._backend.describeEffect(ctx, stateObj);

    if (card.paletteSource !== this._state.lastEffectImage) {
      this._state.lastEffectImage = card.paletteSource;
      if (card.paletteSource) {
        try {
          const colors = await this._colorManager.extractColors(card.paletteSource);
          this._state.backgroundColor = colors.backgroundColor;
          this._state.textColor = colors.textColor;
          this._state.accentColor = colors.accentColor;
        } catch (error) {
          log.error('StateManager: Error extracting colors', error);
        }
      }
    }

    const shouldUpdateBrightness =
      !this._isDraggingBrightness && this._state.brightness !== card.brightness;

    if (
      this._state.currentEffect !== effect.name ||
      this._state.isOn !== card.isOn ||
      shouldUpdateBrightness
    ) {
      this._state.currentEffect = effect.name;
      this._state.isOn = card.isOn;
      if (shouldUpdateBrightness) {
        this._state.brightness = card.brightness;
      }
    }

    const layouts = this._backend.layouts(ctx);
    if (layouts) {
      if (
        this._state.currentLayout !== layouts.current ||
        !arraysEqual(this._state.availableLayouts, layouts.options)
      ) {
        this._state.currentLayout = layouts.current;
        this._state.availableLayouts = [...layouts.options];
      }
    }

    const presets = this._backend.presets(ctx);
    if (presets) {
      if (
        this._state.currentPreset !== presets.current ||
        !arraysEqual(this._state.availablePresets, presets.options)
      ) {
        this._state.currentPreset = presets.current;
        this._state.availablePresets = [...presets.options];
      }
    }

    const cfg = ctx.config;
    const visibilityChanged =
      this._state.showLayoutSelect !== (cfg.show_layout_select !== false) ||
      this._state.showPresetSelect !== (cfg.show_preset_select !== false) ||
      this._state.showEffectControls !== (cfg.show_effect_controls !== false);

    if (visibilityChanged) {
      this._state.showLayoutSelect = cfg.show_layout_select !== false;
      this._state.showPresetSelect = cfg.show_preset_select !== false;
      this._state.showEffectControls = cfg.show_effect_controls !== false;
    }
  }

  toggleDropdown() {
    this._state.isDropdownOpen = !this._state.isDropdownOpen;
    if (this._state.isDropdownOpen) {
      this._closeOtherDropdowns('effect');
    }
  }

  toggleLayoutDropdown() {
    this._state.isLayoutDropdownOpen = !this._state.isLayoutDropdownOpen;
    if (this._state.isLayoutDropdownOpen) {
      this._closeOtherDropdowns('layout');
    }
  }

  togglePresetDropdown() {
    this._state.isPresetDropdownOpen = !this._state.isPresetDropdownOpen;
    if (this._state.isPresetDropdownOpen) {
      this._closeOtherDropdowns('preset');
    }
  }

  toggleSceneDropdown() {
    this._state.isSceneDropdownOpen = !this._state.isSceneDropdownOpen;
    if (this._state.isSceneDropdownOpen) {
      this._closeOtherDropdowns('scene');
    }
  }

  toggleProfileDropdown() {
    this._state.isProfileDropdownOpen = !this._state.isProfileDropdownOpen;
    if (this._state.isProfileDropdownOpen) {
      this._closeOtherDropdowns('profile');
    }
  }

  closeAllDropdowns() {
    this._state.isDropdownOpen = false;
    this._state.isLayoutDropdownOpen = false;
    this._state.isPresetDropdownOpen = false;
    this._state.isSceneDropdownOpen = false;
    this._state.isProfileDropdownOpen = false;
  }

  private _closeOtherDropdowns(keep: 'effect' | 'layout' | 'preset' | 'scene' | 'profile') {
    if (keep !== 'effect') this._state.isDropdownOpen = false;
    if (keep !== 'layout') this._state.isLayoutDropdownOpen = false;
    if (keep !== 'preset') this._state.isPresetDropdownOpen = false;
    if (keep !== 'scene') this._state.isSceneDropdownOpen = false;
    if (keep !== 'profile') this._state.isProfileDropdownOpen = false;
  }

  async setScene(value: string) {
    const ctx = this._ctx;
    if (!ctx) return;
    await this._backend.setScene?.(ctx, value);
    this._state.isSceneDropdownOpen = false;
  }

  async setProfile(value: string) {
    const ctx = this._ctx;
    if (!ctx) return;
    await this._backend.setProfile?.(ctx, value);
    this._state.isProfileDropdownOpen = false;
  }

  /**
   * Update a live control value. Coalesces rapid drag input into one
   * service call per ~50ms window; the final value always lands on
   * release because setLiveControlImmediate triggers the trailing
   * commit when a new debounce window opens.
   */
  setLiveControl(id: string, value: number) {
    const existing = this._liveControlDebounce.get(id);
    if (existing) window.clearTimeout(existing);
    const handle = window.setTimeout(() => {
      this._liveControlDebounce.delete(id);
      const ctx = this._ctx;
      if (!ctx) return;
      void this._backend.setLiveControl?.(ctx, id, value);
    }, 50);
    this._liveControlDebounce.set(id, handle);
  }

  setLiveControlImmediate(id: string, value: number) {
    const existing = this._liveControlDebounce.get(id);
    if (existing) {
      window.clearTimeout(existing);
      this._liveControlDebounce.delete(id);
    }
    const ctx = this._ctx;
    if (!ctx) return;
    void this._backend.setLiveControl?.(ctx, id, value);
  }

  toggleAttributes() {
    this._state.isAttributesExpanded = !this._state.isAttributesExpanded;
  }

  async toggleLight() {
    this._state.isOn = !this._state.isOn;
    const ctx = this._ctx;
    if (!ctx) return;
    await this._backend.togglePower(ctx, this._state.isOn);
  }

  startBrightnessDrag() {
    this._isDraggingBrightness = true;
  }

  endBrightnessDrag() {
    this._isDraggingBrightness = false;
  }

  setBrightness(brightness: number) {
    const validBrightness = Math.min(100, Math.max(1, Math.round(brightness)));
    this._state.brightness = validBrightness;

    if (this._brightnessDebounceTimer) {
      window.clearTimeout(this._brightnessDebounceTimer);
    }

    this._brightnessDebounceTimer = window.setTimeout(() => {
      const ctx = this._ctx;
      if (!ctx) return;
      void this._backend.setBrightness(ctx, validBrightness);
    }, 10);
  }

  async setCurrentEffect(effect: string) {
    this._state.currentEffect = effect;
    const ctx = this._ctx;
    if (!ctx) return;
    await this._backend.setEffect(ctx, effect);
    this._state.isDropdownOpen = false;
  }

  async setCurrentLayout(layout: string) {
    const ctx = this._ctx;
    if (!ctx) return;
    await this._backend.setLayout(ctx, layout);
    this._state.isLayoutDropdownOpen = false;
  }

  async setCurrentPreset(preset: string) {
    const ctx = this._ctx;
    if (!ctx) return;
    await this._backend.setPreset(ctx, preset);
    this._state.isPresetDropdownOpen = false;
  }

  async nextEffect() {
    await this._press('next');
  }

  async previousEffect() {
    await this._press('previous');
  }

  async randomEffect() {
    await this._press('random');
  }

  private async _press(action: 'next' | 'previous' | 'random' | 'stop') {
    const ctx = this._ctx;
    if (!ctx) return;
    await this._backend.pressNavigation(ctx, action);
    setTimeout(() => this.updateState(), 300);
  }

  cleanup() {
    if (this._brightnessDebounceTimer) {
      window.clearTimeout(this._brightnessDebounceTimer);
      this._brightnessDebounceTimer = undefined;
    }
    for (const handle of this._liveControlDebounce.values()) {
      window.clearTimeout(handle);
    }
    this._liveControlDebounce.clear();
  }
}

function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
