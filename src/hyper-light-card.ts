// src/hyper-light-card.ts

import type { HomeAssistant } from 'custom-card-helpers/dist/types';
import { css, html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { backendById } from './backends';
import type {
  BackendContext,
  CardModel,
  EffectListModel,
  EffectModel,
  NavigationModel,
  SelectModel,
} from './backends/types';
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
    const navigation = backend.navigation(ctx);

    const sliderStyle = { '--slider-color': this.state.accentColor };

    return html`
      <ha-card>
        <div
          class="card"
          style="
            --background-color: ${this.state.backgroundColor};
            --text-color: ${this.state.textColor};
            --accent-color: ${this.state.accentColor};
          "
        >
          ${this._renderBackground(card)} ${this._renderHeader(card)}
          <div class="effect-row">
            ${this._renderEffectDropdown(effectList)}
            ${this.state.showEffectControls ? this._renderEffectControls(navigation) : ''}
          </div>
          ${this.state.showEffectInfo ? this._renderEffectInfo(effect) : ''}
          <div class="controls-row">
            ${this.state.showBrightnessControl ? this._renderBrightnessSlider(sliderStyle) : ''}
            ${this.state.showEffectParameters ? this._renderAttributesToggle() : ''}
          </div>
          ${this.state.showEffectParameters ? this._renderAttributes(effect, layouts, presets) : ''}
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

  private _renderHeader(card: CardModel) {
    return html`
      <div class="header" aria-label="${card.name}">
        <div class="light-icon ${this.state.isOn ? 'light-on' : ''}">
          ${card.icon.startsWith('mdi:')
            ? html`<ha-icon icon="${card.icon}" aria-hidden="true"></ha-icon>`
            : html`<img src="${card.icon}" alt="${card.name}" />`}
        </div>
        <div class="light-name" title="${card.name}">${card.name}</div>
        <ha-switch
          .checked=${this.state.isOn}
          @change=${this._toggleLight}
          aria-label="Toggle light"
        ></ha-switch>
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
    if (!navigation.hasNext && !navigation.hasPrevious && !navigation.hasRandom) {
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
          <div class="effect-publisher">Published by: ${publisher}</div>
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
    presets: SelectModel | null
  ) {
    const hasParameters = Object.keys(effect.parameters).length > 0;
    const hasLayouts = layouts && layouts.options.length > 0 && this.state.showLayoutSelect;
    const hasPresets = presets && presets.options.length > 0 && this.state.showPresetSelect;
    if (!hasParameters && !hasLayouts && !hasPresets) {
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
          </div>
          ${this._renderAttributesList(effect.parameters)}
        </div>
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
    const effectDropdown = this.shadowRoot?.querySelector('.effect-select-wrapper .dropdown');
    const layoutDropdown = this.shadowRoot?.querySelector('.layout-select-wrapper .dropdown');
    const presetDropdown = this.shadowRoot?.querySelector('.preset-select-wrapper .dropdown');

    if (this.state.isDropdownOpen && effectDropdown && !path.includes(effectDropdown)) {
      this.stateManager.toggleDropdown();
      this.requestUpdate();
    }

    if (this.state.isLayoutDropdownOpen && layoutDropdown && !path.includes(layoutDropdown)) {
      this.stateManager.toggleLayoutDropdown();
      this.requestUpdate();
    }

    if (this.state.isPresetDropdownOpen && presetDropdown && !path.includes(presetDropdown)) {
      this.stateManager.togglePresetDropdown();
      this.requestUpdate();
    }
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
