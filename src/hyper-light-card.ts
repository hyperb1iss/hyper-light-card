// src/hyper-light-card.ts

import type { HomeAssistant } from 'custom-card-helpers/dist/types';
import { css, html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { property, state } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { styleMap } from 'lit/directives/style-map.js';
import { backendById } from './backends';
import type {
  AudioControlsModel,
  AudioModel,
  BackendContext,
  CardModel,
  ConnectivityModel,
  DeviceModel,
  EffectListModel,
  EffectModel,
  LiveControlModel,
  NavigationModel,
  SelectModel,
  ZoneModel,
} from './backends/types';
import { HYPERCOLOR_MARK_ICON, hypercolorMark } from './brand';
import type { Config } from './config';
import { HyperLightCardEditor } from './hyper-light-card-editor';
// Import CSS as string for Lit CSS
import styleText from './hyper-light-card-styles.css?inline';
import { State } from './state';
import { StateManager } from './state-manager';
import { formatAttributeKey, formatAttributeValue, memoize } from './utils';

if (!customElements.get('hyper-light-card-editor')) {
  customElements.define('hyper-light-card-editor', HyperLightCardEditor);
}

export class HyperLightCard extends LitElement {
  @property({ type: Object }) hass?: HomeAssistant;
  @property({ type: Object }) config?: Config;
  @state() private state: State;
  private stateManager: StateManager;
  private _clickOutsideHandler: (event: Event) => void;
  private _hasScrolledToEffect = false;
  private _hasScrolledToLayout = false;
  private _hasScrolledToPreset = false;
  private _autoDiscovered = false;

  constructor() {
    super();
    this.state = new State(this);
    this.stateManager = new StateManager(this.config!, this.state);
    this._clickOutsideHandler = this._handleClickOutside.bind(this);
  }

  static get styles() {
    return css`
      ${unsafeCSS(styleText)}
    `;
  }

  setConfig(config: Config) {
    if (!config.entity) {
      throw new Error('You need to define an entity');
    }

    this._autoDiscovered = false;

    this.config = {
      name: config.name,
      // Icon defaults are backend-specific; describeCard fills in the
      // right one when the user has not supplied an explicit override.
      icon: config.icon,
      background_opacity: config.background_opacity || 0.7,
      show_effect_info: config.show_effect_info !== false,
      show_effect_parameters: config.show_effect_parameters !== false,
      show_brightness_control: config.show_brightness_control ?? true,
      show_layout_select: config.show_layout_select !== false,
      show_preset_select: config.show_preset_select !== false,
      show_effect_controls: config.show_effect_controls !== false,
      allowed_effects: config.allowed_effects,
      layout_entity: config.layout_entity,
      preset_entity: config.preset_entity,
      next_effect_entity: config.next_effect_entity,
      previous_effect_entity: config.previous_effect_entity,
      random_effect_entity: config.random_effect_entity,
      ...config,
    };
    this.stateManager.cleanup();
    this.stateManager = new StateManager(this.config, this.state);
  }

  getCardSize(): number {
    return 4;
  }

  firstUpdated() {
    if (this.hass && this.config) {
      this.stateManager.hass = this.hass;
    }
    this.stateManager.updateState();
    this._runAutoDiscovery();
  }

  updated(changedProperties: Map<string | number | symbol, unknown>) {
    super.updated(changedProperties);

    if (changedProperties.has('hass') && this.hass && this.config) {
      this.stateManager.hass = this.hass;
      if (!this._autoDiscovered) {
        this._runAutoDiscovery();
      }
    }

    if (this.state.isDropdownOpen && !this._hasScrolledToEffect) {
      this._hasScrolledToEffect = true;
      this._scrollDropdownToSelected('.effect-select-wrapper');
    } else if (!this.state.isDropdownOpen) {
      this._hasScrolledToEffect = false;
    }

    if (this.state.isLayoutDropdownOpen && !this._hasScrolledToLayout) {
      this._hasScrolledToLayout = true;
      this._scrollDropdownToSelected('.layout-select-wrapper');
    } else if (!this.state.isLayoutDropdownOpen) {
      this._hasScrolledToLayout = false;
    }

    if (this.state.isPresetDropdownOpen && !this._hasScrolledToPreset) {
      this._hasScrolledToPreset = true;
      this._scrollDropdownToSelected('.preset-select-wrapper');
    } else if (!this.state.isPresetDropdownOpen) {
      this._hasScrolledToPreset = false;
    }
  }

  render() {
    if (!this.hass || !this.config || !this.hass.states) {
      return html``;
    }

    const stateObj = this.hass.states[this.config.entity];
    if (!stateObj) {
      return html`
        <ha-card>
          <div class="card">Entity not found: ${this.config.entity}</div>
        </ha-card>
      `;
    }

    const ctx: BackendContext = { hass: this.hass, config: this.config };
    const backend = this.stateManager.backend;
    const card = backend.describeCard(ctx);
    const effect = backend.describeEffect(ctx, stateObj);
    const effectList = backend.effectList(ctx, stateObj);
    const layouts = backend.layouts(ctx);
    const presets = backend.presets(ctx);
    const scenes = backend.scenes?.(ctx) ?? null;
    const profiles = backend.profiles?.(ctx) ?? null;
    const navigation = backend.navigation(ctx);
    const liveControls = backend.liveControls?.(ctx) ?? [];
    const connectivity = backend.connectivity?.(ctx) ?? null;
    const fps = backend.fps?.(ctx) ?? null;
    const audio = backend.audio?.(ctx) ?? null;
    const audioControls = backend.audioControls?.(ctx) ?? null;
    const devices = backend.perDevice?.(ctx) ?? [];
    const zones = backend.zones?.(ctx) ?? [];

    const sliderStyle = { '--slider-color': this.state.accentColor };
    const showStatusChips = this.config.show_status_chips !== false;
    const showSceneSelect = this.config.show_scene_select !== false && scenes !== null;
    const showProfileSelect = this.config.show_profile_select === true && profiles !== null;
    const showLiveControls = this.config.show_live_controls !== false && liveControls.length > 0;
    const showAudioControls = this.config.show_audio_controls !== false && audioControls !== null;
    const showPerDevice = this.config.show_per_device === true && devices.length > 0;
    const showZones = this.config.show_zones !== false && zones.length > 0;
    const beating = audio?.reactiveActive && audio?.beat;

    return html`
      <ha-card>
        <div
          class="card ${beating ? 'beat' : ''}"
          style="
            --background-color: ${this.state.backgroundColor};
            --text-color: ${this.state.textColor};
            --accent-color: ${this.state.accentColor};
          "
        >
          ${this._renderBackground(card)}
          ${this._renderHeader(card, showStatusChips ? { connectivity, fps, audio } : null)}
          <div class="effect-row">
            ${this._renderEffectDropdown(effectList)}
            ${this.state.showEffectControls ? this._renderEffectControls(navigation) : ''}
          </div>
          ${this.state.showEffectInfo ? this._renderEffectInfo(effect) : ''}
          ${showAudioControls ? this._renderAudioControls(audioControls!) : ''}
          <div class="controls-row">
            ${this.state.showBrightnessControl ? this._renderBrightnessSlider(sliderStyle) : ''}
            ${this.state.showEffectParameters ? this._renderAttributesToggle() : ''}
          </div>
          ${this.state.showEffectParameters
            ? this._renderAttributes(effect, layouts, presets, {
                scenes,
                profiles,
                liveControls,
                showSceneSelect,
                showProfileSelect,
                showLiveControls,
              })
            : ''}
          ${showZones ? this._renderZones(zones) : ''}
          ${showPerDevice ? this._renderPerDevice(devices) : ''}
        </div>
      </ha-card>
    `;
  }

  private _renderBackground(card: CardModel) {
    const backgroundImage = card.paletteSource ? `url(${card.paletteSource})` : 'none';
    return html`
      <div
        class="card-background"
        style="background-image: ${backgroundImage}; opacity: ${this.config!.background_opacity};"
        aria-hidden="true"
      ></div>
    `;
  }

  private _renderHeader(
    card: CardModel,
    status: {
      connectivity: ConnectivityModel | null;
      fps: number | null;
      audio: AudioModel | null;
    } | null
  ) {
    const fallbackIcon = card.icon || 'mdi:led-strip-variant';
    return html`
      <div class="header" aria-label="${card.name}">
        <div class="light-icon ${this.state.isOn ? 'light-on' : ''}">
          ${this._renderCardIcon(fallbackIcon, card.name)}
        </div>
        <div class="light-name" title="${card.name}">${card.name}</div>
        ${status ? this._renderStatusChips(status) : ''}
        <ha-switch
          .checked=${this.state.isOn}
          @change=${this._toggleLight}
          aria-label="Toggle light"
        ></ha-switch>
      </div>
    `;
  }

  private _renderCardIcon(icon: string, name: string) {
    if (icon === HYPERCOLOR_MARK_ICON) return hypercolorMark();
    if (icon.startsWith('mdi:')) {
      return html`<ha-icon icon="${icon}" aria-hidden="true"></ha-icon>`;
    }
    return html`<img src="${icon}" alt="${name}" />`;
  }

  private _renderStatusChips(status: {
    connectivity: ConnectivityModel | null;
    fps: number | null;
    audio: AudioModel | null;
  }) {
    const { connectivity, fps, audio } = status;
    if (!connectivity && fps === null && !audio) return '';
    return html`
      <div class="status-chips" aria-label="Status">
        ${connectivity
          ? html`<span
              class="status-chip status-connectivity ${connectivity.connected
                ? 'connected'
                : 'disconnected'}"
              title="${connectivity.connected ? 'Connected' : 'Disconnected'}"
              aria-label="${connectivity.connected ? 'Connected' : 'Disconnected'}"
            ></span>`
          : ''}
        ${fps !== null
          ? html`<span class="status-chip status-fps" title="Render rate">
              ${Math.round(fps)} <small>fps</small>
            </span>`
          : ''}
        ${audio?.reactiveActive
          ? html`<span class="status-chip status-audio" title="Audio reactive">
              <ha-icon icon="mdi:music"></ha-icon>
            </span>`
          : ''}
      </div>
    `;
  }

  private _renderEffectDropdown(effectList: EffectListModel) {
    return html`
      <div class="effect-select-wrapper">
        <div class="dropdown ${this.state.isDropdownOpen ? 'open' : ''}">
          <div
            class="dropdown-header"
            @click=${this._toggleDropdown}
            aria-label="Current effect: ${this.state.currentEffect}"
            role="button"
          >
            ${this.state.currentEffect}
          </div>
          <div class="dropdown-content" role="menu">
            ${this._memoizedEffectList(effectList.allowed)}
          </div>
        </div>
      </div>
    `;
  }

  private _renderEffectControls(navigation: NavigationModel) {
    if (
      !navigation.hasNext &&
      !navigation.hasPrevious &&
      !navigation.hasRandom &&
      !navigation.hasStop
    ) {
      return html``;
    }

    return html`
      <div class="effect-controls fade-in">
        ${navigation.hasPrevious
          ? html`
              <button
                class="effect-button"
                @click=${this._previousEffect}
                aria-label="Previous effect"
              >
                <ha-icon icon="mdi:chevron-left"></ha-icon>
              </button>
            `
          : ''}
        ${navigation.hasRandom
          ? html`
              <button
                class="effect-button random"
                @click=${this._randomEffect}
                aria-label="Random effect"
              >
                <ha-icon icon="mdi:shuffle-variant"></ha-icon>
              </button>
            `
          : ''}
        ${navigation.hasNext
          ? html`
              <button class="effect-button" @click=${this._nextEffect} aria-label="Next effect">
                <ha-icon icon="mdi:chevron-right"></ha-icon>
              </button>
            `
          : ''}
        ${navigation.hasStop
          ? html`
              <button
                class="effect-button stop"
                @click=${this._stopEffect}
                aria-label="Stop effect"
              >
                <ha-icon icon="mdi:stop"></ha-icon>
              </button>
            `
          : ''}
      </div>
    `;
  }

  private _memoizedEffectList = memoize((effectList: string[]) =>
    effectList.map(
      (effect: string) => html`
        <div
          class="dropdown-item ${effect === this.state.currentEffect ? 'selected' : ''}"
          @click=${() => this._selectEffect(effect)}
          role="menuitem"
          tabindex="0"
        >
          ${effect}
        </div>
      `
    )
  );

  private _renderEffectInfo(effect: EffectModel) {
    const description = effect.description || 'No effect description available';
    const publisher = effect.publisher || 'Unknown publisher';

    return html`
      <div class="effect-info ${this.state.isOn ? 'visible' : ''}">
        <div class="effect-info-text">
          <div class="effect-description">${description}</div>
          <div class="effect-publisher">
            Published by: ${publisher}${effect.category ? html` · ${effect.category}` : ''}
          </div>
          ${effect.tags.length > 0
            ? html`<div class="effect-tags" aria-label="Tags">
                ${effect.tags.map(tag => html`<span class="effect-tag">${tag}</span>`)}
              </div>`
            : ''}
        </div>
        <div class="effect-features" aria-label="Effect features">
          ${effect.usesAudio
            ? html`<ha-icon
                icon="mdi:volume-high"
                title="Uses Audio"
                aria-label="Uses Audio"
              ></ha-icon>`
            : ''}
          ${effect.usesInput
            ? html`<ha-icon
                icon="mdi:gamepad-variant"
                title="Uses Input"
                aria-label="Uses Input"
              ></ha-icon>`
            : ''}
          ${effect.usesVideo
            ? html`<ha-icon icon="mdi:video" title="Uses Video" aria-label="Uses Video"></ha-icon>`
            : ''}
        </div>
      </div>
    `;
  }

  private _renderBrightnessSlider(sliderStyle: Record<string, string>) {
    const updatedSliderStyle = {
      ...sliderStyle,
      '--slider-percentage': `${this.state.brightness}%`,
      '--slider-color': this.state.accentColor,
    };

    return html`
      <div
        class="brightness-slider"
        style=${styleMap(updatedSliderStyle)}
        role="slider"
        aria-valuemin="1"
        aria-valuemax="100"
        aria-valuenow="${this.state.brightness}"
      >
        <ha-icon icon="mdi:brightness-6" aria-hidden="true"></ha-icon>
        <input
          type="range"
          min="1"
          max="100"
          .value=${this.state.brightness.toString()}
          @change=${this._handleBrightnessChange}
          @input=${this._handleBrightnessInput}
          @mousedown=${this._handleBrightnessStart}
          @touchstart=${this._handleBrightnessStart}
          @mouseup=${this._handleBrightnessEnd}
          @touchend=${this._handleBrightnessEnd}
          aria-label="Adjust brightness"
        />
      </div>
    `;
  }

  private _renderAttributesToggle() {
    return html`
      <div
        class="attributes-toggle"
        @click=${this._toggleAttributes}
        role="button"
        aria-expanded="${this.state.isAttributesExpanded}"
        aria-label="Toggle effect parameters"
      >
        <ha-icon icon="mdi:chevron-down"></ha-icon>
      </div>
    `;
  }

  private _renderAttributes(
    effect: EffectModel,
    layouts: SelectModel | null,
    presets: SelectModel | null,
    extras: {
      scenes: SelectModel | null;
      profiles: SelectModel | null;
      liveControls: LiveControlModel[];
      showSceneSelect: boolean;
      showProfileSelect: boolean;
      showLiveControls: boolean;
    }
  ) {
    const hasParameters = Object.keys(effect.parameters).length > 0;
    const hasLayouts = layouts && layouts.options.length > 0 && this.state.showLayoutSelect;
    const hasPresets = presets && presets.options.length > 0 && this.state.showPresetSelect;
    const hasScenes = extras.scenes && extras.scenes.options.length > 0 && extras.showSceneSelect;
    const hasProfiles =
      extras.profiles && extras.profiles.options.length > 0 && extras.showProfileSelect;
    const hasLiveControls = extras.showLiveControls && extras.liveControls.length > 0;
    if (
      !hasParameters &&
      !hasLayouts &&
      !hasPresets &&
      !hasScenes &&
      !hasProfiles &&
      !hasLiveControls
    ) {
      return html``;
    }

    return html`
      <div
        class="attributes ${this.state.isAttributesExpanded ? 'expanded' : ''}"
        aria-hidden="${!this.state.isAttributesExpanded}"
      >
        <div class="attributes-content">
          <div class="attributes-selectors">
            ${this._renderLayoutSelect(layouts, true)} ${this._renderPresetSelect(presets, true)}
            ${hasScenes ? this._renderSceneSelect(extras.scenes!) : ''}
            ${hasProfiles ? this._renderProfileSelect(extras.profiles!) : ''}
          </div>
          ${hasLiveControls
            ? this._renderLiveControls(extras.liveControls)
            : this._renderAttributesList(effect.parameters)}
        </div>
      </div>
    `;
  }

  private _renderLiveControls(controls: LiveControlModel[]) {
    return html`
      <div class="live-controls" aria-label="Live effect controls">
        ${controls.map(control => this._renderLiveControl(control))}
      </div>
    `;
  }

  private _renderLiveControl(control: LiveControlModel) {
    return html`
      <div class="live-control kind-${control.kind} ${control.available ? '' : 'disabled'}">
        <div class="live-control-label">${control.label}</div>
        ${this._renderLiveControlWidget(control)}
      </div>
    `;
  }

  private _renderLiveControlWidget(control: LiveControlModel) {
    switch (control.kind) {
      case 'boolean':
        return this._renderToggleControl(control);
      case 'enum':
        return this._renderEnumControl(control);
      case 'color':
        return this._renderColorControl(control);
      default:
        return this._renderSliderControl(control);
    }
  }

  private _renderSliderControl(control: LiveControlModel) {
    const range = control.max - control.min || 1;
    const fillPct = ((control.value - control.min) / range) * 100;
    const sliderStyle = {
      '--slider-percentage': `${Math.max(0, Math.min(100, fillPct))}%`,
      '--slider-color': this.state.accentColor,
    };
    return html`
      <div class="live-control-slider" style=${styleMap(sliderStyle)}>
        <input
          type="range"
          min="${control.min}"
          max="${control.max}"
          step="${control.step}"
          .value=${control.value.toString()}
          ?disabled=${!control.available}
          @change=${(e: Event) =>
            this._handleLiveControlChange(control.id, (e.target as HTMLInputElement).value)}
          @input=${(e: Event) =>
            this._handleLiveControlInput(control.id, (e.target as HTMLInputElement).value)}
          aria-label="${control.label}"
        />
        <div class="live-control-value">${formatLiveControlValue(control)}</div>
      </div>
    `;
  }

  private _renderToggleControl(control: LiveControlModel) {
    return html`
      <div class="live-control-widget">
        <ha-switch
          .checked=${control.value === 1}
          ?disabled=${!control.available}
          @change=${(e: Event) =>
            this.stateManager.setLiveControlImmediate(
              control.id,
              (e.target as HTMLInputElement).checked
            )}
          aria-label="${control.label}"
        ></ha-switch>
      </div>
    `;
  }

  private _renderEnumControl(control: LiveControlModel) {
    const options = control.options ?? [];
    return html`
      <div class="live-control-widget">
        <select
          class="live-control-select"
          .value=${live(control.text ?? '')}
          ?disabled=${!control.available}
          @change=${(e: Event) =>
            this.stateManager.setLiveControlImmediate(
              control.id,
              (e.target as HTMLSelectElement).value
            )}
          aria-label="${control.label}"
        >
          ${options.map(
            option =>
              html`<option value=${option} ?selected=${option === control.text}>${option}</option>`
          )}
        </select>
      </div>
    `;
  }

  private _renderColorControl(control: LiveControlModel) {
    const value = control.text || '#000000';
    return html`
      <div class="live-control-widget live-control-color-widget">
        <input
          type="color"
          class="live-control-color"
          .value=${value}
          ?disabled=${!control.available}
          @change=${(e: Event) =>
            this.stateManager.setLiveControlImmediate(
              control.id,
              (e.target as HTMLInputElement).value
            )}
          aria-label="${control.label}"
        />
        <span class="live-control-value">${value}</span>
      </div>
    `;
  }

  private _renderSceneSelect(scenes: SelectModel) {
    const hasScenes = scenes.options.length > 0;
    return html`
      <div class="scene-select-wrapper select-wrapper compact">
        <div class="select-section-title"><ha-icon icon="mdi:movie-open"></ha-icon> Scene</div>
        <div
          class="dropdown ${this.state.isSceneDropdownOpen ? 'open' : ''} ${!hasScenes
            ? 'disabled'
            : ''}"
        >
          <div
            class="dropdown-header"
            @click=${hasScenes ? this._toggleSceneDropdown : undefined}
            role="button"
            aria-disabled="${!hasScenes}"
            aria-label="Current scene: ${scenes.current}"
          >
            ${hasScenes ? scenes.current || 'No active scene' : 'No scenes available'}
          </div>
          <div class="dropdown-content" role="menu">
            ${hasScenes
              ? scenes.options.map(
                  scene => html`
                    <div
                      class="dropdown-item ${scene === scenes.current ? 'selected' : ''}"
                      @click=${() => this._selectScene(scene)}
                      role="menuitem"
                      tabindex="0"
                    >
                      ${scene}
                    </div>
                  `
                )
              : html`<div class="dropdown-item disabled">No scenes available</div>`}
          </div>
        </div>
      </div>
    `;
  }

  private _renderProfileSelect(profiles: SelectModel) {
    const hasProfiles = profiles.options.length > 0;
    return html`
      <div class="profile-select-wrapper select-wrapper compact">
        <div class="select-section-title"><ha-icon icon="mdi:account-cog"></ha-icon> Profile</div>
        <div
          class="dropdown ${this.state.isProfileDropdownOpen ? 'open' : ''} ${!hasProfiles
            ? 'disabled'
            : ''}"
        >
          <div
            class="dropdown-header"
            @click=${hasProfiles ? this._toggleProfileDropdown : undefined}
            role="button"
            aria-disabled="${!hasProfiles}"
          >
            ${hasProfiles ? profiles.current || 'No active profile' : 'No profiles available'}
          </div>
          <div class="dropdown-content" role="menu">
            ${hasProfiles
              ? profiles.options.map(
                  profile => html`
                    <div
                      class="dropdown-item ${profile === profiles.current ? 'selected' : ''}"
                      @click=${() => this._selectProfile(profile)}
                      role="menuitem"
                      tabindex="0"
                    >
                      ${profile}
                    </div>
                  `
                )
              : html`<div class="dropdown-item disabled">No profiles available</div>`}
          </div>
        </div>
      </div>
    `;
  }

  private _renderAudioControls(audioControls: AudioControlsModel) {
    const { reactive, device } = audioControls;
    const deviceOptions = device?.options ?? [];
    return html`
      <div class="audio-controls" aria-label="Audio controls">
        ${reactive
          ? html`
              <div class="audio-control-reactive">
                <ha-icon icon="mdi:music-note" aria-hidden="true"></ha-icon>
                <span class="audio-control-label">Audio reactive</span>
                <ha-switch
                  .checked=${reactive.on}
                  ?disabled=${!reactive.available}
                  @change=${(e: Event) =>
                    this._setAudioReactive((e.target as HTMLInputElement).checked)}
                  aria-label="Toggle audio reactive"
                ></ha-switch>
              </div>
            `
          : ''}
        ${device && deviceOptions.length > 0
          ? html`
              <div class="audio-control-device">
                <span class="audio-control-label">Input</span>
                <select
                  class="live-control-select"
                  .value=${live(device.current)}
                  ?disabled=${!device.available}
                  @change=${(e: Event) =>
                    this._setAudioDevice((e.target as HTMLSelectElement).value)}
                  aria-label="Audio input device"
                >
                  ${deviceOptions.map(
                    option =>
                      html`<option value=${option} ?selected=${option === device.current}>
                        ${option}
                      </option>`
                  )}
                </select>
              </div>
            `
          : ''}
      </div>
    `;
  }

  private _renderZones(zones: ZoneModel[]) {
    return html`
      <div class="zones" aria-label="Scene zones">
        <div class="zones-title"><ha-icon icon="mdi:grid"></ha-icon> Zones</div>
        ${zones.map(zone => this._renderZone(zone))}
      </div>
    `;
  }

  private _renderZone(zone: ZoneModel) {
    const sliderStyle = {
      '--slider-percentage': `${zone.brightness ?? 0}%`,
      '--slider-color': this.state.accentColor,
    };
    return html`
      <div class="zone-row ${zone.enabled ? '' : 'zone-off'}">
        <div class="zone-info">
          <div class="zone-name" title="${zone.name}">${zone.name}</div>
          ${zone.effect ? html`<div class="zone-effect">${zone.effect}</div>` : ''}
        </div>
        <div class="zone-actions">
          ${zone.brightness !== null
            ? html`
                <div class="live-control-slider zone-slider" style=${styleMap(sliderStyle)}>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    .value=${(zone.brightness ?? 0).toString()}
                    ?disabled=${!zone.enabled}
                    @change=${(e: Event) =>
                      this._setZoneBrightness(
                        zone.id,
                        Number((e.target as HTMLInputElement).value)
                      )}
                    aria-label="${zone.name} brightness"
                  />
                </div>
              `
            : ''}
          <ha-switch
            .checked=${zone.enabled}
            @change=${(e: Event) =>
              this._setZoneEnabled(zone.id, (e.target as HTMLInputElement).checked)}
            aria-label="Toggle ${zone.name}"
          ></ha-switch>
        </div>
      </div>
    `;
  }

  private async _setAudioReactive(on: boolean) {
    await this.stateManager.setAudioReactive(on);
  }

  private async _setAudioDevice(value: string) {
    await this.stateManager.setAudioDevice(value);
  }

  private async _setZoneBrightness(zoneEntityId: string, value: number) {
    await this.stateManager.setZoneBrightness(zoneEntityId, value);
  }

  private async _setZoneEnabled(zoneEntityId: string, on: boolean) {
    await this.stateManager.setZoneEnabled(zoneEntityId, on);
  }

  private _renderPerDevice(devices: DeviceModel[]) {
    return html`
      <div class="per-device" aria-label="Per-device controls">
        ${devices.map(
          device => html`
            <div class="per-device-row">
              <div class="per-device-name" title="${device.name}">${device.name}</div>
              <div class="per-device-actions">
                ${device.brightness !== null
                  ? html`<span class="per-device-brightness">${device.brightness}%</span>`
                  : ''}
                ${device.identifyEntity
                  ? html`<button
                      class="per-device-identify"
                      @click=${() => this._identifyDevice(device.identifyEntity!)}
                      aria-label="Identify ${device.name}"
                    >
                      <ha-icon icon="mdi:eye"></ha-icon>
                    </button>`
                  : ''}
              </div>
            </div>
          `
        )}
      </div>
    `;
  }

  private _renderAttributesList(effectParameters: EffectModel['parameters']) {
    if (!effectParameters || Object.keys(effectParameters).length === 0) {
      return html`<p>No effect parameters available.</p>`;
    }

    return html`
      <ul class="attribute-list">
        ${Object.entries(effectParameters).map(([key, value]) => {
          let label: string;
          let formattedValue: string | TemplateResult;

          if (typeof value === 'string') {
            label = formatAttributeKey(key);
            formattedValue = value;
          } else {
            label = value.label;
            formattedValue = formatAttributeValue(value.value, value.type);
          }

          return html`
            <li class="attribute-item">
              <span class="attribute-key">${label}:</span>
              <span class="attribute-value">${formattedValue}</span>
            </li>
          `;
        })}
      </ul>
    `;
  }

  private _renderLayoutSelect(layouts: SelectModel | null, isCompact = false) {
    if (!layouts || !this.state.showLayoutSelect) return html``;

    const hasLayouts = layouts.options.length > 0;
    const currentLayout = layouts.current;

    return html`
      <div class="layout-select-wrapper select-wrapper ${isCompact ? 'compact' : ''}">
        <div class="select-section-title">
          <ha-icon icon="mdi:view-grid-outline"></ha-icon> Layout
        </div>
        <div
          class="dropdown ${this.state.isLayoutDropdownOpen ? 'open' : ''} ${!hasLayouts
            ? 'disabled'
            : ''}"
          title="${!hasLayouts ? 'No layouts available for this effect' : ''}"
        >
          <div
            class="dropdown-header"
            @click=${hasLayouts ? this._toggleLayoutDropdown : undefined}
            aria-label="Current layout: ${currentLayout}"
            role="button"
            aria-disabled="${!hasLayouts}"
          >
            ${hasLayouts ? currentLayout : 'No layouts available'}
          </div>
          <div class="dropdown-content" role="menu">
            ${hasLayouts
              ? layouts.options.map(
                  layout => html`
                    <div
                      class="dropdown-item ${layout === currentLayout ? 'selected' : ''}"
                      @click=${() => this._selectLayout(layout)}
                      role="menuitem"
                      tabindex="0"
                    >
                      ${layout}
                    </div>
                  `
                )
              : html`<div class="dropdown-item disabled">No layouts available</div>`}
          </div>
        </div>
      </div>
    `;
  }

  private _renderPresetSelect(presets: SelectModel | null, isCompact = false) {
    if (!presets || !this.state.showPresetSelect) return html``;

    const hasPresets = presets.options.length > 0;
    const currentPreset = presets.current;

    return html`
      <div class="preset-select-wrapper select-wrapper ${isCompact ? 'compact' : ''}">
        <div class="select-section-title"><ha-icon icon="mdi:palette"></ha-icon> Preset</div>
        <div
          class="dropdown ${this.state.isPresetDropdownOpen ? 'open' : ''} ${!hasPresets
            ? 'disabled'
            : ''}"
          title="${!hasPresets ? 'No presets available for this effect' : ''}"
        >
          <div
            class="dropdown-header"
            @click=${hasPresets ? this._togglePresetDropdown : undefined}
            aria-label="Current preset: ${currentPreset}"
            role="button"
            aria-disabled="${!hasPresets}"
          >
            ${hasPresets ? currentPreset : 'No presets available'}
          </div>
          <div class="dropdown-content" role="menu">
            ${hasPresets
              ? presets.options.map(
                  preset => html`
                    <div
                      class="dropdown-item ${preset === currentPreset ? 'selected' : ''}"
                      @click=${() => this._selectPreset(preset)}
                      role="menuitem"
                      tabindex="0"
                    >
                      ${preset}
                    </div>
                  `
                )
              : html`<div class="dropdown-item disabled">No presets available</div>`}
          </div>
        </div>
      </div>
    `;
  }

  private _runAutoDiscovery() {
    if (!this.hass || !this.config || this._autoDiscovered) return;
    const ctx: BackendContext = { hass: this.hass, config: this.config };
    const patch = this.stateManager.backend.autoDiscover?.(ctx);
    if (patch && Object.keys(patch).length > 0) {
      this.config = { ...this.config, ...patch };
      this.stateManager.cleanup();
      this.stateManager = new StateManager(this.config, this.state);
      this.stateManager.hass = this.hass;
      this.stateManager.updateState();
      this.requestUpdate();
    }
    this._autoDiscovered = true;
  }

  private _scrollDropdownToSelected(wrapperSelector: string) {
    requestAnimationFrame(() => {
      const dropdownContent = this.shadowRoot?.querySelector(
        `${wrapperSelector} .dropdown-content`
      ) as HTMLElement | null;
      const selectedItem = this.shadowRoot?.querySelector(
        `${wrapperSelector} .dropdown-item.selected`
      ) as HTMLElement | null;
      if (dropdownContent && selectedItem) {
        dropdownContent.scrollTop = selectedItem.offsetTop - dropdownContent.offsetTop;
      }
    });
  }

  private async _toggleLight() {
    await this.stateManager.toggleLight();
    const effectInfo = this.shadowRoot?.querySelector('.effect-info');
    if (effectInfo) {
      if (this.state.isOn) {
        setTimeout(() => effectInfo.classList.add('visible'), 50);
      } else {
        effectInfo.classList.remove('visible');
      }
    }
  }

  private _toggleDropdown(e: Event) {
    e.stopPropagation();
    this.stateManager.toggleDropdown();
  }

  private _toggleLayoutDropdown(e: Event) {
    e.stopPropagation();
    this.stateManager.toggleLayoutDropdown();
  }

  private _togglePresetDropdown(e: Event) {
    e.stopPropagation();
    this.stateManager.togglePresetDropdown();
  }

  private _toggleSceneDropdown = (e: Event) => {
    e.stopPropagation();
    this.stateManager.toggleSceneDropdown();
  };

  private _toggleProfileDropdown = (e: Event) => {
    e.stopPropagation();
    this.stateManager.toggleProfileDropdown();
  };

  private async _selectScene(scene: string) {
    await this.stateManager.setScene(scene);
    this.requestUpdate();
  }

  private async _selectProfile(profile: string) {
    await this.stateManager.setProfile(profile);
    this.requestUpdate();
  }

  private async _identifyDevice(entityId: string) {
    if (!this.hass) return;
    await this.hass.callService('button', 'press', { entity_id: entityId });
  }

  private _handleLiveControlChange(id: string, value: string) {
    // `change` fires on release; commit the final value immediately so we
    // don't sit on a queued debounce window.
    this.stateManager.setLiveControlImmediate(id, Number(value));
  }

  private _handleLiveControlInput(id: string, value: string) {
    // `input` fires per drag tick; debounced via the StateManager.
    this.stateManager.setLiveControl(id, Number(value));
  }

  private async _selectEffect(effect: string) {
    await this.stateManager.setCurrentEffect(effect);
    this._refreshAfterEffectChange();
  }

  private async _selectLayout(layout: string) {
    await this.stateManager.setCurrentLayout(layout);
    this._refreshAfterEffectChange();
  }

  private async _selectPreset(preset: string) {
    await this.stateManager.setCurrentPreset(preset);
    this._refreshAfterEffectChange();
  }

  private async _nextEffect() {
    await this.stateManager.nextEffect();
    this._refreshAfterEffectChange();
  }

  private async _previousEffect() {
    await this.stateManager.previousEffect();
    this._refreshAfterEffectChange();
  }

  private async _randomEffect() {
    await this.stateManager.randomEffect();
    this._refreshAfterEffectChange();
  }

  private async _stopEffect() {
    await this.stateManager.stopEffect();
    this._refreshAfterEffectChange();
  }

  private _refreshAfterEffectChange() {
    setTimeout(() => {
      this.requestUpdate();
      if (this.state.isOn) {
        const effectInfo = this.shadowRoot?.querySelector('.effect-info');
        effectInfo?.classList.add('visible');
      }
    }, 350);
  }

  private _toggleAttributes() {
    this.stateManager.toggleAttributes();
    this.requestUpdate();
  }

  private _handleClickOutside(event: Event) {
    const path = event.composedPath();
    const dropdowns: Array<[boolean, string, () => void]> = [
      [
        this.state.isDropdownOpen,
        '.effect-select-wrapper .dropdown',
        () => this.stateManager.toggleDropdown(),
      ],
      [
        this.state.isLayoutDropdownOpen,
        '.layout-select-wrapper .dropdown',
        () => this.stateManager.toggleLayoutDropdown(),
      ],
      [
        this.state.isPresetDropdownOpen,
        '.preset-select-wrapper .dropdown',
        () => this.stateManager.togglePresetDropdown(),
      ],
      [
        this.state.isSceneDropdownOpen,
        '.scene-select-wrapper .dropdown',
        () => this.stateManager.toggleSceneDropdown(),
      ],
      [
        this.state.isProfileDropdownOpen,
        '.profile-select-wrapper .dropdown',
        () => this.stateManager.toggleProfileDropdown(),
      ],
    ];
    let changed = false;
    for (const [isOpen, selector, close] of dropdowns) {
      if (!isOpen) continue;
      const node = this.shadowRoot?.querySelector(selector);
      if (node && !path.includes(node)) {
        close();
        changed = true;
      }
    }
    if (changed) this.requestUpdate();
  }

  private _handleBrightnessStart() {
    this.stateManager.startBrightnessDrag();
  }

  private _handleBrightnessEnd() {
    this.stateManager.endBrightnessDrag();
  }

  private async _handleBrightnessInput(e: Event) {
    const target = e.target as HTMLInputElement;
    this.stateManager.setBrightness(Number(target.value));
  }

  private async _handleBrightnessChange(e: Event) {
    const target = e.target as HTMLInputElement;
    this.stateManager.setBrightness(Number(target.value));
    this.stateManager.endBrightnessDrag();
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._clickOutsideHandler);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._clickOutsideHandler);
    this.stateManager.cleanup();
  }

  static getConfigElement() {
    return document.createElement('hyper-light-card-editor');
  }

  static getGridOptions(): {
    rows?: number | 'auto';
    columns?: number | 'full';
    min_rows?: number;
    min_columns?: number;
  } {
    // Sections-view sizing. The card is wide and tall enough to want at
    // least half-row width on the standard 12-column grid; min_rows of 3
    // covers the collapsed case (header, effect row, brightness).
    return { rows: 'auto', columns: 12, min_rows: 3, min_columns: 6 };
  }

  static getStubConfig(hass: HomeAssistant, entities: string[]): Config {
    // Try each backend's stub generator; first match wins. Hypercolor
    // first so users with both integrations get the richer surface.
    for (const id of ['hypercolor', 'signalrgb'] as const) {
      const stub = backendById(id).stubConfig?.(hass, entities);
      if (stub) return stub;
    }
    // No supported entity found; return a minimal config tied to the first light.
    const fallback = entities.find(id => id.startsWith('light.')) ?? '';
    return {
      entity: fallback,
      name: '',
      show_effect_info: true,
      show_effect_parameters: true,
      show_brightness_control: true,
      show_layout_select: true,
      show_preset_select: true,
      show_effect_controls: true,
      background_opacity: 0.7,
      allowed_effects: [],
    };
  }
}

function formatLiveControlValue(control: LiveControlModel): string {
  if (control.step >= 1) return `${Math.round(control.value)}`;
  // Two decimals when the step is fractional.
  return control.value.toFixed(2);
}

customElements.define('hyper-light-card', HyperLightCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'hyper-light-card',
  name: 'Hyper Light Card',
  description: 'A custom card for SignalRGB and Hypercolor.',
  preview: true,
  documentationURL: 'https://github.com/hyperb1iss/hyper-light-card',
});

const version = process.env.VERSION;
console.log(
  `%c 🛸🔮 hyper-light-card v${version} launched! 🔮🛸 `,
  'background: linear-gradient(90deg, #00ffff, #ff00ff, #00ffff); color: #000; font-weight: bold; padding: 6px 12px; border-radius: 8px; text-shadow: 0 0 5px #00ffff, 0 0 10px #ff00ff, 0 0 20px #00ffff;'
);
