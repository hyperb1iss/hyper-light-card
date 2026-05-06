// src/hyper-light-card.ts

import type { HomeAssistant } from 'custom-card-helpers/dist/types';
import type { HassEntity } from 'home-assistant-js-websocket';
import { css, html, LitElement, type TemplateResult, unsafeCSS } from 'lit';
import { property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import type { Config } from './config';
import { HyperLightCardEditor } from './hyper-light-card-editor';
// Import CSS as string for Lit CSS
import styleText from './hyper-light-card-styles.css?inline';
import { State } from './state';
import { StateManager } from './state-manager';
import { formatAttributeKey, formatAttributeValue, log, memoize } from './utils';

// Register the editor component
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

  // Auto-discover related SignalRGB entities if they're not configured
  private autoDiscoverEntities() {
    if (!this.hass || !this.config || this._autoDiscovered) return;

    log.debug('HyperLightCard: Running auto-discovery for related entities');

    // Extract device ID from main entity
    const mainEntity = this.config.entity;
    if (!mainEntity?.startsWith('light.signalrgb_')) {
      return; // Not a SignalRGB entity or no entity set
    }

    // Get all entities in hass
    const entities = Object.keys(this.hass.states);

    // First try exact device ID matching
    const deviceIdMatch = mainEntity.match(/^light\.signalrgb_(.+)$/);
    const deviceId = deviceIdMatch ? deviceIdMatch[1] : '';

    if (!deviceId) {
      log.debug('HyperLightCard: Could not extract device ID from entity', mainEntity);
      return;
    }

    log.debug('HyperLightCard: Auto-discovering entities for device ID', deviceId);

    // Try to find entities with the exact device ID first
    const exactMatches = {
      layout: entities.find(id => id === `select.signalrgb_layout_${deviceId}`),
      preset: entities.find(id => id === `select.signalrgb_preset_${deviceId}`),
      nextEffect: entities.find(id => id === `button.signalrgb_next_effect_${deviceId}`),
      prevEffect: entities.find(id => id === `button.signalrgb_previous_effect_${deviceId}`),
      randomEffect: entities.find(id => id === `button.signalrgb_random_effect_${deviceId}`),
    };

    // If exact matches don't work, try pattern matching
    const patternMatches = {
      layout: !exactMatches.layout
        ? entities.find(id => id.startsWith('select.signalrgb_layout_') && id.includes(deviceId))
        : null,
      preset: !exactMatches.preset
        ? entities.find(id => id.startsWith('select.signalrgb_preset_') && id.includes(deviceId))
        : null,
      nextEffect: !exactMatches.nextEffect
        ? entities.find(
            id => id.startsWith('button.signalrgb_next_effect_') && id.includes(deviceId)
          )
        : null,
      prevEffect: !exactMatches.prevEffect
        ? entities.find(
            id => id.startsWith('button.signalrgb_previous_effect_') && id.includes(deviceId)
          )
        : null,
      randomEffect: !exactMatches.randomEffect
        ? entities.find(
            id => id.startsWith('button.signalrgb_random_effect_') && id.includes(deviceId)
          )
        : null,
    };

    // Combine results, preferring exact matches
    const foundEntities = {
      layout: exactMatches.layout || patternMatches.layout,
      preset: exactMatches.preset || patternMatches.preset,
      nextEffect: exactMatches.nextEffect || patternMatches.nextEffect,
      prevEffect: exactMatches.prevEffect || patternMatches.prevEffect,
      randomEffect: exactMatches.randomEffect || patternMatches.randomEffect,
    };

    // If we couldn't find anything with the device ID, try finding any SignalRGB entities
    // This is a fallback for cases where naming patterns differ
    if (
      !foundEntities.layout &&
      !foundEntities.preset &&
      !foundEntities.nextEffect &&
      !foundEntities.prevEffect &&
      !foundEntities.randomEffect
    ) {
      log.debug('HyperLightCard: No matches found with device ID, trying generic patterns');

      // Find any SignalRGB entities
      foundEntities.layout = entities.find(id => id.startsWith('select.signalrgb_layout_'));
      foundEntities.preset = entities.find(id => id.startsWith('select.signalrgb_preset_'));
      foundEntities.nextEffect = entities.find(id =>
        id.startsWith('button.signalrgb_next_effect_')
      );
      foundEntities.prevEffect = entities.find(id =>
        id.startsWith('button.signalrgb_previous_effect_')
      );
      foundEntities.randomEffect = entities.find(id =>
        id.startsWith('button.signalrgb_random_effect_')
      );
    }

    // Update config with found entities if they're not already set
    let configUpdated = false;

    if (!this.config.layout_entity && foundEntities.layout) {
      this.config.layout_entity = foundEntities.layout;
      configUpdated = true;
      log.debug('HyperLightCard: Auto-discovered layout entity', foundEntities.layout);
    }

    if (!this.config.preset_entity && foundEntities.preset) {
      this.config.preset_entity = foundEntities.preset;
      configUpdated = true;
      log.debug('HyperLightCard: Auto-discovered preset entity', foundEntities.preset);
    }

    if (!this.config.next_effect_entity && foundEntities.nextEffect) {
      this.config.next_effect_entity = foundEntities.nextEffect;
      configUpdated = true;
      log.debug('HyperLightCard: Auto-discovered next effect entity', foundEntities.nextEffect);
    }

    if (!this.config.previous_effect_entity && foundEntities.prevEffect) {
      this.config.previous_effect_entity = foundEntities.prevEffect;
      configUpdated = true;
      log.debug('HyperLightCard: Auto-discovered previous effect entity', foundEntities.prevEffect);
    }

    if (!this.config.random_effect_entity && foundEntities.randomEffect) {
      this.config.random_effect_entity = foundEntities.randomEffect;
      configUpdated = true;
      log.debug('HyperLightCard: Auto-discovered random effect entity', foundEntities.randomEffect);
    }

    // If config was updated, update the state manager with the new config
    if (configUpdated) {
      log.debug('HyperLightCard: Updated config with auto-discovered entities', this.config);
      this.stateManager = new StateManager(this.config, this.state);
      this.stateManager.hass = this.hass;
      this.stateManager.updateState();
      this.requestUpdate();
    }

    // Mark as auto-discovered so we don't keep doing this
    this._autoDiscovered = true;
  }

  constructor() {
    super();
    this.state = new State(this);
    this.stateManager = new StateManager(this.config!, this.state);
    this._clickOutsideHandler = this._handleClickOutside.bind(this);
    log.debug('HyperLightCard: Constructor called');
  }

  static get styles() {
    return css`
      ${unsafeCSS(styleText)}
    `;
  }

  setConfig(config: Config) {
    log.debug('HyperLightCard: setConfig called', config);
    if (!config.entity) {
      throw new Error('You need to define an entity');
    }

    // Reset auto-discovery flag when config changes
    this._autoDiscovered = false;

    this.config = {
      name: config.name,
      icon: config.icon || 'https://brands.home-assistant.io/_/signalrgb/icon.png',
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
    log.debug('HyperLightCard: Config set', this.config);
  }

  getCardSize(): number {
    return 4;
  }

  firstUpdated() {
    log.debug('HyperLightCard: firstUpdated called');
    if (this.hass && this.config) {
      this.stateManager.hass = this.hass;
    }
    this.stateManager.updateState();
    this.autoDiscoverEntities();
  }

  updated(changedProperties: Map<string | number | symbol, unknown>) {
    super.updated(changedProperties);

    log.debug('HyperLightCard: updated called', changedProperties);

    // Only update state from hass if hass has changed
    if (changedProperties.has('hass') && this.hass && this.config) {
      log.debug('HyperLightCard: current hass state:', this.hass.states[this.config.entity]);
      this.stateManager.hass = this.hass;

      // Try auto-discovery again if we get new hass data
      if (!this._autoDiscovered) {
        this.autoDiscoverEntities();
      }
    }

    // Only scroll if a dropdown is open and we haven't scrolled yet
    if (this.state.isDropdownOpen && !this._hasScrolledToEffect) {
      this._hasScrolledToEffect = true;
      this._scrollToCurrentEffect();
    } else if (!this.state.isDropdownOpen) {
      this._hasScrolledToEffect = false;
    }

    if (this.state.isLayoutDropdownOpen && !this._hasScrolledToLayout) {
      this._hasScrolledToLayout = true;
      this._scrollToCurrentLayout();
    } else if (!this.state.isLayoutDropdownOpen) {
      this._hasScrolledToLayout = false;
    }

    if (this.state.isPresetDropdownOpen && !this._hasScrolledToPreset) {
      this._hasScrolledToPreset = true;
      this._scrollToCurrentPreset();
    } else if (!this.state.isPresetDropdownOpen) {
      this._hasScrolledToPreset = false;
    }
  }

  render() {
    if (!this.hass || !this.config || !this.hass.states) {
      log.debug('HyperLightCard: hass or config not available');
      return html``;
    }

    const stateObj = this.hass.states[this.config.entity];
    if (!stateObj) {
      log.debug('HyperLightCard: Entity not found', this.config.entity);
      return html`
        <ha-card>
          <div class="card">Entity not found: ${this.config.entity}</div>
        </ha-card>
      `;
    }

    // Diagnostic information for debugging entity connections
    const hasLayoutEntity = Boolean(
      this.config.layout_entity && this.hass.states[this.config.layout_entity]
    );
    const hasPresetEntity = Boolean(
      this.config.preset_entity && this.hass.states[this.config.preset_entity]
    );
    const hasNextEffectEntity = Boolean(
      this.config.next_effect_entity && this.hass.states[this.config.next_effect_entity]
    );
    const hasPreviousEffectEntity = Boolean(
      this.config.previous_effect_entity && this.hass.states[this.config.previous_effect_entity]
    );
    const hasRandomEffectEntity = Boolean(
      this.config.random_effect_entity && this.hass.states[this.config.random_effect_entity]
    );

    const layoutOptions = hasLayoutEntity
      ? this.hass.states[this.config.layout_entity!].attributes.options || []
      : [];

    const presetOptions = hasPresetEntity
      ? this.hass.states[this.config.preset_entity!].attributes.options || []
      : [];

    log.debug('HyperLightCard: Entity connections', {
      layout: {
        entity: this.config.layout_entity,
        found: hasLayoutEntity,
        options: layoutOptions,
        optionsCount: layoutOptions.length,
        showLayoutSelect: this.state.showLayoutSelect,
      },
      preset: {
        entity: this.config.preset_entity,
        found: hasPresetEntity,
        options: presetOptions,
        optionsCount: presetOptions.length,
        showPresetSelect: this.state.showPresetSelect,
      },
      effectButtons: {
        next: {
          entity: this.config.next_effect_entity,
          found: hasNextEffectEntity,
        },
        previous: {
          entity: this.config.previous_effect_entity,
          found: hasPreviousEffectEntity,
        },
        random: {
          entity: this.config.random_effect_entity,
          found: hasRandomEffectEntity,
        },
        showEffectControls: this.state.showEffectControls,
      },
    });

    log.debug('HyperLightCard: Rendering with state', {
      isOn: this.state.isOn,
      currentEffect: this.state.currentEffect,
      brightness: this.state.brightness,
    });

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
          ${this._renderBackground(stateObj)} ${this._renderHeader(stateObj)}
          <div class="effect-row">
            ${this._renderEffectDropdown(stateObj)}
            ${this.state.showEffectControls ? this._renderEffectControls() : ''}
          </div>
          ${this.state.showEffectInfo ? this._renderEffectInfo(stateObj) : ''}
          <div class="controls-row">
            ${this.state.showBrightnessControl ? this._renderBrightnessSlider(sliderStyle) : ''}
            ${this.state.showEffectParameters ? this._renderAttributesToggle() : ''}
          </div>
          ${this.state.showEffectParameters ? this._renderAttributes(stateObj) : ''}
        </div>
      </ha-card>
    `;
  }

  private _renderBackground(stateObj: HassEntity) {
    const backgroundImage = stateObj.attributes.effect_image
      ? `url(${stateObj.attributes.effect_image})`
      : 'none';
    log.debug('HyperLightCard: Rendering background', backgroundImage);
    return html`
      <div
        class="card-background"
        style="background-image: ${backgroundImage}; opacity: ${this.config!.background_opacity};"
        aria-hidden="true"
      ></div>
    `;
  }

  private _renderHeader(stateObj: HassEntity) {
    const name = this.config!.name || stateObj.attributes.friendly_name || stateObj.entity_id;
    log.debug('HyperLightCard: Rendering header', name);
    return html`
      <div class="header" aria-label="${name}">
        <div class="light-icon ${this.state.isOn ? 'light-on' : ''}">
          ${this.config!.icon?.startsWith('mdi:')
            ? html`<ha-icon icon="${this.config!.icon}" aria-hidden="true"></ha-icon>`
            : html`<img src="${this.config!.icon}" alt="${name}" />`}
        </div>
        <div class="light-name" title="${name}">${name}</div>
        <ha-switch
          .checked=${this.state.isOn}
          @change=${this._toggleLight}
          aria-label="Toggle light"
        ></ha-switch>
      </div>
    `;
  }

  private _renderEffectDropdown(stateObj: HassEntity) {
    let effectList: string[] = Array.isArray(stateObj.attributes.effect_list)
      ? stateObj.attributes.effect_list
      : [];

    if (this.state.allowedEffects) {
      effectList = effectList.filter(effect => this.state.allowedEffects!.includes(effect));
    }

    log.debug('HyperLightCard: Rendering effect dropdown', effectList);
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
          <div class="dropdown-content" role="menu">${this._memoizedEffectList(effectList)}</div>
        </div>
      </div>
    `;
  }

  private _renderEffectControls() {
    if (!this.state.showEffectControls) {
      log.debug('HyperLightCard: Not rendering effect controls - disabled in state');
      return html``;
    }

    const hasNextButton = Boolean(
      this.config?.next_effect_entity && this.hass?.states[this.config.next_effect_entity]
    );

    const hasPrevButton = Boolean(
      this.config?.previous_effect_entity && this.hass?.states[this.config.previous_effect_entity]
    );

    const hasRandomButton = Boolean(
      this.config?.random_effect_entity && this.hass?.states[this.config.random_effect_entity]
    );

    if (!hasNextButton && !hasPrevButton && !hasRandomButton) {
      log.debug('HyperLightCard: Not rendering effect controls - no entities available');
      return html``;
    }

    log.debug('HyperLightCard: Rendering effect controls', {
      hasNextButton,
      hasPrevButton,
      hasRandomButton,
    });

    return html`
      <div class="effect-controls fade-in">
        ${hasPrevButton
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
        ${hasRandomButton
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
        ${hasNextButton
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

  private _renderEffectInfo(stateObj: HassEntity) {
    if (!this.state.showEffectInfo) return html``;

    const description = stateObj.attributes.effect_description || 'No effect description available';
    const publisher = stateObj.attributes.effect_publisher || 'Unknown publisher';
    const usesAudio = stateObj.attributes.effect_uses_audio || false;
    const usesInput = stateObj.attributes.effect_uses_input || false;
    const usesVideo = stateObj.attributes.effect_uses_video || false;

    log.debug('HyperLightCard: Rendering effect info', {
      description,
      publisher,
      usesAudio,
      usesInput,
      usesVideo,
    });

    return html`
      <div class="effect-info ${this.state.isOn ? 'visible' : ''}">
        <div class="effect-info-text">
          <div class="effect-description">${description}</div>
          <div class="effect-publisher">Published by: ${publisher}</div>
        </div>
        <div class="effect-features" aria-label="Effect features">
          ${usesAudio
            ? html`<ha-icon
                icon="mdi:volume-high"
                title="Uses Audio"
                aria-label="Uses Audio"
              ></ha-icon>`
            : ''}
          ${usesInput
            ? html`<ha-icon
                icon="mdi:gamepad-variant"
                title="Uses Input"
                aria-label="Uses Input"
              ></ha-icon>`
            : ''}
          ${usesVideo
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

    log.debug('HyperLightCard: Rendering brightness slider', updatedSliderStyle);

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
    log.debug('HyperLightCard: Rendering attributes toggle');
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

  private _renderAttributes(stateObj: HassEntity) {
    if (!this.state.showEffectParameters) return html``;

    // Ensure effectParameters is correctly typed
    const effectParameters = stateObj.attributes.effect_parameters as
      | Record<string, { label: string; type: string; value: string | number | boolean }>
      | undefined;

    if (!effectParameters || Object.keys(effectParameters).length === 0) {
      log.debug('HyperLightCard: No effect parameters to render');
      return html``;
    }

    log.debug('HyperLightCard: Rendering attributes', effectParameters);

    return html`
      <div
        class="attributes ${this.state.isAttributesExpanded ? 'expanded' : ''}"
        aria-hidden="${!this.state.isAttributesExpanded}"
      >
        <div class="attributes-content">
          <!-- Layout and Preset Selectors inside expanded attributes -->
          <div class="attributes-selectors">
            ${this._renderLayoutSelect(true)} ${this._renderPresetSelect(true)}
          </div>

          <!-- Effect Parameters -->
          ${this._renderAttributesList(effectParameters)}
        </div>
      </div>
    `;
  }

  private _renderAttributesList(
    effectParameters: Record<
      string,
      string | { label: string; type: string; value: string | number | boolean }
    >
  ) {
    if (!effectParameters || Object.keys(effectParameters).length === 0) {
      log.debug('HyperLightCard: No effect parameters to list');
      return html`<p>No effect parameters available.</p>`;
    }

    log.debug('HyperLightCard: Rendering attributes list', effectParameters);

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

  private _renderLayoutSelect(isCompact: boolean = false) {
    if (
      !this.config?.layout_entity ||
      !this.state.showLayoutSelect ||
      !this.hass?.states[this.config.layout_entity]
    ) {
      return html``;
    }

    const layoutEntity = this.hass.states[this.config.layout_entity];
    const currentLayout = layoutEntity.state || '';
    const availableLayouts = layoutEntity.attributes.options || [];

    // Update state with current layout
    if (this.state.currentLayout !== currentLayout) {
      this.state.currentLayout = currentLayout;
    }

    const hasLayouts = availableLayouts.length > 0;
    this.state.availableLayouts = availableLayouts;

    log.debug('HyperLightCard: Rendering layout select', {
      currentLayout,
      availableLayouts,
      dropdownOpen: this.state.isLayoutDropdownOpen,
      isCompact,
      hasLayouts,
    });

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
              ? availableLayouts.map(
                  (layout: string) => html`
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

  private _renderPresetSelect(isCompact: boolean = false) {
    if (
      !this.config?.preset_entity ||
      !this.state.showPresetSelect ||
      !this.hass?.states[this.config.preset_entity]
    ) {
      return html``;
    }

    const presetEntity = this.hass.states[this.config.preset_entity];
    const currentPreset = presetEntity.state || '';
    const availablePresets = presetEntity.attributes.options || [];

    // Update state with current preset
    if (this.state.currentPreset !== currentPreset) {
      this.state.currentPreset = currentPreset;
    }

    const hasPresets = availablePresets.length > 0;
    this.state.availablePresets = availablePresets;

    log.debug('HyperLightCard: Rendering preset select', {
      currentPreset,
      availablePresets,
      dropdownOpen: this.state.isPresetDropdownOpen,
      isCompact,
      hasPresets,
    });

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
              ? availablePresets.map(
                  (preset: string) => html`
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

  private async _toggleLight() {
    log.debug('HyperLightCard: _toggleLight called');
    await this.stateManager.toggleLight();

    const effectInfo = this.shadowRoot!.querySelector('.effect-info');
    if (effectInfo) {
      if (this.state.isOn) {
        setTimeout(() => {
          effectInfo.classList.add('visible');
          log.debug('HyperLightCard: Effect info made visible');
        }, 50);
      } else {
        effectInfo.classList.remove('visible');
        log.debug('HyperLightCard: Effect info hidden');
      }
    }

    log.debug('HyperLightCard: Light toggled, new state:', this.state.isOn);
  }

  private _scrollToCurrentEffect() {
    log.debug('HyperLightCard: _scrollToCurrentEffect called');
    // Use requestAnimationFrame to ensure DOM is updated before scrolling
    requestAnimationFrame(() => {
      const dropdownContent = this.shadowRoot?.querySelector(
        '.effect-select-wrapper .dropdown-content'
      ) as HTMLElement;
      const currentEffectItem = this.shadowRoot?.querySelector(
        `.effect-select-wrapper .dropdown-item.selected`
      ) as HTMLElement;

      if (dropdownContent && currentEffectItem) {
        dropdownContent.scrollTop = currentEffectItem.offsetTop - dropdownContent.offsetTop;
        log.debug('HyperLightCard: Scrolled to current effect');
      }
    });
  }

  private _scrollToCurrentLayout() {
    log.debug('HyperLightCard: _scrollToCurrentLayout called');
    requestAnimationFrame(() => {
      const dropdownContent = this.shadowRoot?.querySelector(
        '.layout-select-wrapper .dropdown-content'
      ) as HTMLElement;
      const currentLayoutItem = this.shadowRoot?.querySelector(
        `.layout-select-wrapper .dropdown-item.selected`
      ) as HTMLElement;

      if (dropdownContent && currentLayoutItem) {
        dropdownContent.scrollTop = currentLayoutItem.offsetTop - dropdownContent.offsetTop;
        log.debug('HyperLightCard: Scrolled to current layout');
      }
    });
  }

  private _scrollToCurrentPreset() {
    log.debug('HyperLightCard: _scrollToCurrentPreset called');
    requestAnimationFrame(() => {
      const dropdownContent = this.shadowRoot?.querySelector(
        '.preset-select-wrapper .dropdown-content'
      ) as HTMLElement;
      const currentPresetItem = this.shadowRoot?.querySelector(
        `.preset-select-wrapper .dropdown-item.selected`
      ) as HTMLElement;

      if (dropdownContent && currentPresetItem) {
        dropdownContent.scrollTop = currentPresetItem.offsetTop - dropdownContent.offsetTop;
        log.debug('HyperLightCard: Scrolled to current preset');
      }
    });
  }

  private _toggleDropdown(e: Event) {
    log.debug('HyperLightCard: _toggleDropdown called');
    e.stopPropagation();
    this.stateManager.toggleDropdown();
    log.debug('HyperLightCard: Dropdown toggled, new state:', this.state.isDropdownOpen);
  }

  private _toggleLayoutDropdown(e: Event) {
    log.debug('HyperLightCard: _toggleLayoutDropdown called');
    e.stopPropagation();
    this.stateManager.toggleLayoutDropdown();
  }

  private _togglePresetDropdown(e: Event) {
    log.debug('HyperLightCard: _togglePresetDropdown called');
    e.stopPropagation();
    this.stateManager.togglePresetDropdown();
  }

  private async _selectEffect(effect: string) {
    log.debug('HyperLightCard: _selectEffect called', effect);
    await this.stateManager.setCurrentEffect(effect);
    this._refreshCardAfterEffectChange();
  }

  private async _selectLayout(layout: string) {
    log.debug('HyperLightCard: _selectLayout called', layout);
    await this.stateManager.setCurrentLayout(layout);
    this._refreshCardAfterEffectChange();
  }

  private async _selectPreset(preset: string) {
    log.debug('HyperLightCard: _selectPreset called', preset);
    await this.stateManager.setCurrentPreset(preset);
    this._refreshCardAfterEffectChange();
  }

  private async _nextEffect() {
    log.debug('HyperLightCard: _nextEffect called');
    await this.stateManager.nextEffect();
    // Ensure the effect info gets updated
    this._refreshCardAfterEffectChange();
  }

  private async _previousEffect() {
    log.debug('HyperLightCard: _previousEffect called');
    await this.stateManager.previousEffect();
    // Ensure the effect info gets updated
    this._refreshCardAfterEffectChange();
  }

  private async _randomEffect() {
    log.debug('HyperLightCard: _randomEffect called');
    await this.stateManager.randomEffect();
    // Ensure the effect info gets updated
    this._refreshCardAfterEffectChange();
  }

  // Helper method to ensure the card refreshes properly after an effect change
  private _refreshCardAfterEffectChange() {
    // Force a re-render to update the effect info
    setTimeout(() => {
      this.requestUpdate();

      // Make sure effect info is visible if the light is on
      if (this.state.isOn) {
        const effectInfo = this.shadowRoot!.querySelector('.effect-info');
        if (effectInfo) {
          effectInfo.classList.add('visible');
        }
      }

      log.debug('HyperLightCard: Refreshed card after effect change');
    }, 350); // Slightly more than the state update timeout to ensure state is updated first
  }

  private _toggleAttributes() {
    log.debug('HyperLightCard: _toggleAttributes called');
    this.stateManager.toggleAttributes();
    log.debug('HyperLightCard: Attributes expanded:', this.state.isAttributesExpanded);
    this.requestUpdate();
  }

  private _handleClickOutside(event: Event) {
    log.debug('HyperLightCard: _handleClickOutside called');
    const path = event.composedPath();

    // Check dropdowns and close if clicked outside
    const effectDropdown = this.shadowRoot!.querySelector('.effect-select-wrapper .dropdown');
    const layoutDropdown = this.shadowRoot!.querySelector('.layout-select-wrapper .dropdown');
    const presetDropdown = this.shadowRoot!.querySelector('.preset-select-wrapper .dropdown');

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
    const brightness = Number(target.value);
    await this.stateManager.setBrightness(brightness);
  }

  private async _handleBrightnessChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const brightness = Number(target.value);
    await this.stateManager.setBrightness(brightness);
    this.stateManager.endBrightnessDrag();
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._clickOutsideHandler);
    log.debug('HyperLightCard: connectedCallback called, click listener added');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._clickOutsideHandler);
    this.stateManager.cleanup();
    log.debug('HyperLightCard: disconnectedCallback called, click listener removed');
  }

  static getConfigElement() {
    return document.createElement('hyper-light-card-editor');
  }

  static getStubConfig(_hass: HomeAssistant, entities: string[]): Config {
    const signalRGBEntities = entities.filter(entityId => entityId.match(/^light\.signalrgb_/));
    const layoutEntities = entities.filter(entityId =>
      entityId.match(/^select\.signalrgb_layout_/)
    );
    const presetEntities = entities.filter(entityId =>
      entityId.match(/^select\.signalrgb_preset_/)
    );
    const nextEffectEntities = entities.filter(entityId =>
      entityId.match(/^button\.signalrgb_next_effect_/)
    );
    const prevEffectEntities = entities.filter(entityId =>
      entityId.match(/^button\.signalrgb_previous_effect_/)
    );
    const randomEffectEntities = entities.filter(entityId =>
      entityId.match(/^button\.signalrgb_random_effect_/)
    );

    const defaultEntity = signalRGBEntities.length > 0 ? signalRGBEntities[0] : '';
    const defaultLayoutEntity = layoutEntities.length > 0 ? layoutEntities[0] : '';
    const defaultPresetEntity = presetEntities.length > 0 ? presetEntities[0] : '';
    const defaultNextEffectEntity = nextEffectEntities.length > 0 ? nextEffectEntities[0] : '';
    const defaultPrevEffectEntity = prevEffectEntities.length > 0 ? prevEffectEntities[0] : '';
    const defaultRandomEffectEntity =
      randomEffectEntities.length > 0 ? randomEffectEntities[0] : '';

    return {
      entity: defaultEntity,
      name: '',
      show_effect_info: true,
      show_effect_parameters: true,
      show_brightness_control: true,
      show_layout_select: true,
      show_preset_select: true,
      show_effect_controls: true,
      background_opacity: 0.7,
      allowed_effects: [],
      layout_entity: defaultLayoutEntity,
      preset_entity: defaultPresetEntity,
      next_effect_entity: defaultNextEffectEntity,
      previous_effect_entity: defaultPrevEffectEntity,
      random_effect_entity: defaultRandomEffectEntity,
    };
  }
}

customElements.define('hyper-light-card', HyperLightCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'hyper-light-card',
  name: 'Hyper Light Card',
  description: 'A custom card for controlling SignalRGB.',
  preview: true,
  documentationURL: 'https://github.com/hyperb1iss/hyper-light-card',
});

const version = process.env.VERSION;
console.log(
  `%c 🛸🔮 hyper-light-card v${version} launched! 🔮🛸 `,
  'background: linear-gradient(90deg, #00ffff, #ff00ff, #00ffff); color: #000; font-weight: bold; padding: 6px 12px; border-radius: 8px; text-shadow: 0 0 5px #00ffff, 0 0 10px #ff00ff, 0 0 20px #00ffff;'
);
