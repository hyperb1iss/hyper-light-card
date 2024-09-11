// src/hyper-light-card.ts
import { LitElement, html, css, unsafeCSS } from 'lit';
import { property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import {
  formatAttributeKey,
  formatAttributeValue,
  memoize,
  log,
} from './utils';
import styles from './hyper-light-card-styles.css';
import { State } from './state';
import { StateManager } from './state-manager';
import { Config } from './config';
import { HomeAssistant } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';

export class HyperLightCard extends LitElement {
  @property({ type: Object }) hass?: HomeAssistant;
  @property({ type: Object }) config?: Config;
  @state() private state: State;
  private stateManager: StateManager;
  private _clickOutsideHandler: (event: Event) => void;

  constructor() {
    super();
    this.state = new State(this);
    this.stateManager = new StateManager(this.config!, this.state);
    this._clickOutsideHandler = this._handleClickOutside.bind(this);
    log.debug('HyperLightCard: Constructor called');
  }

  static get styles() {
    return css`
      ${unsafeCSS(styles)}
    `;
  }

  setConfig(config: Config) {
    log.debug('HyperLightCard: setConfig called', config);
    if (!config.entity) {
      throw new Error('You need to define an entity');
    }
    this.config = {
      name: config.name,
      icon:
        config.icon || 'https://brands.home-assistant.io/_/signalrgb/icon.png',
      background_opacity: config.background_opacity || 0.7,
      show_effect_info: config.show_effect_info !== false,
      show_effect_parameters: config.show_effect_parameters !== false,
      show_brightness_control: config.show_brightness_control ?? true,
      allowed_effects: config.allowed_effects,
      ...config,
    };
    this.stateManager = new StateManager(this.config, this.state);
    log.debug('HyperLightCard: Config set', this.config);
  }

  getCardSize(): number {
    return 3;
  }

  firstUpdated() {
    log.debug('HyperLightCard: firstUpdated called');
    if (this.hass && this.config) {
      this.stateManager.hass = this.hass;
    }
    this.stateManager.updateState();
  }

  updated(changedProperties: Map<string | number | symbol, unknown>) {
    super.updated(changedProperties);

    log.debug('HyperLightCard: updated called', changedProperties);
    log.debug(
      'HyperLightCard: current hass state:',
      this.hass?.states[this.config?.entity ?? ''],
    );

    if (this.hass && this.config) {
      this.stateManager.hass = this.hass;
    }

    // If the dropdown is open, scroll to the current effect
    if (this.state.isDropdownOpen) {
      this._scrollToCurrentEffect();
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

    log.debug('HyperLightCard: Rendering with state', {
      isOn: this.state.isOn,
      currentEffect: this.state.currentEffect,
      brightness: this.state.brightness,
    });

    const sliderStyle = {
      '--slider-color': this.state.accentColor,
    };

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
          ${this._renderEffectDropdown(stateObj)}
          ${this.state.showEffectInfo ? this._renderEffectInfo(stateObj) : ''}
          <div class="controls-row">
            ${this.state.showBrightnessControl
              ? this._renderBrightnessSlider(sliderStyle)
              : ''}
            ${this.state.showEffectParameters
              ? this._renderAttributesToggle()
              : ''}
          </div>
          ${this.state.showEffectParameters
            ? this._renderAttributes(stateObj)
            : ''}
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
        style="background-image: ${backgroundImage}; opacity: ${this.config!
          .background_opacity};"
        aria-hidden="true"
      ></div>
    `;
  }

  private _renderHeader(stateObj: HassEntity) {
    const name =
      this.config!.name ||
      stateObj.attributes.friendly_name ||
      stateObj.entity_id;
    log.debug('HyperLightCard: Rendering header', name);
    return html`
      <div class="header" aria-label="${name}">
        <div class="light-icon ${this.state.isOn ? 'light-on' : ''}">
          ${this.config!.icon && this.config!.icon.startsWith('mdi:')
            ? html`<ha-icon
                icon="${this.config!.icon}"
                aria-hidden="true"
              ></ha-icon>`
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
      effectList = effectList.filter(effect =>
        this.state.allowedEffects!.includes(effect),
      );
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
          <div class="dropdown-content" role="menu">
            ${this._memoizedEffectList(effectList)}
          </div>
        </div>
      </div>
    `;
  }

  private _memoizedEffectList = memoize((effectList: string[]) =>
    effectList.map(
      (effect: string) => html`
        <div
          class="dropdown-item"
          @click=${() => this._selectEffect(effect)}
          role="menuitem"
          tabindex="0"
        >
          ${effect}
        </div>
      `,
    ),
  );

  private _renderEffectInfo(stateObj: HassEntity) {
    if (!this.state.showEffectInfo) return html``;

    const description =
      stateObj.attributes.effect_description ||
      'No effect description available';
    const publisher =
      stateObj.attributes.effect_publisher || 'Unknown publisher';
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
            ? html`<ha-icon
                icon="mdi:video"
                title="Uses Video"
                aria-label="Uses Video"
              ></ha-icon>`
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

    log.debug(
      'HyperLightCard: Rendering brightness slider',
      updatedSliderStyle,
    );

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
          @input=${this._handleBrightnessChange}
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

    const effectParameters = stateObj.attributes
      .effect_parameters as unknown as
      | Record<string, string | number | boolean>
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
          ${this._renderAttributesList(effectParameters)}
        </div>
      </div>
    `;
  }

  private _renderAttributesList(
    effectParameters: Record<string, string | number | boolean>,
  ) {
    if (!effectParameters || Object.keys(effectParameters).length === 0) {
      log.debug('HyperLightCard: No effect parameters to list');
      return html`<p>No effect parameters available.</p>`;
    }

    log.debug('HyperLightCard: Rendering attributes list', effectParameters);

    return html`
      <ul class="attribute-list">
        ${Object.entries(effectParameters).map(
          ([key, value]) => html`
            <li class="attribute-item">
              <span class="attribute-key">${formatAttributeKey(key)}:</span>
              <span class="attribute-value"
                >${formatAttributeValue(value)}</span
              >
            </li>
          `,
        )}
      </ul>
    `;
  }

  private _toggleLight() {
    log.debug('HyperLightCard: _toggleLight called');
    const newState = !this.state.isOn;
    this.state.isOn = newState;
    this.hass!.callService('light', newState ? 'turn_on' : 'turn_off', {
      entity_id: this.config!.entity,
    });

    const effectInfo = this.shadowRoot!.querySelector('.effect-info');
    if (effectInfo) {
      if (newState) {
        setTimeout(() => {
          effectInfo.classList.add('visible');
          log.debug('HyperLightCard: Effect info made visible');
        }, 50);
      } else {
        effectInfo.classList.remove('visible');
        log.debug('HyperLightCard: Effect info hidden');
      }
    }

    log.debug('HyperLightCard: Light toggled, new state:', newState);
  }

  private _getCurrentEffectIndex(): number {
    const stateObj = this.hass?.states[this.config?.entity ?? ''];
    const effectList: string[] = Array.isArray(stateObj?.attributes.effect_list)
      ? stateObj?.attributes.effect_list
      : [];

    return effectList.indexOf(this.state.currentEffect);
  }

  private _scrollToCurrentEffect() {
    log.debug('HyperLightCard: _scrollToCurrentEffect called');
    const dropdownContent = this.shadowRoot?.querySelector(
      '.dropdown-content',
    ) as HTMLElement;
    const currentEffectItem = this.shadowRoot?.querySelector(
      `.dropdown-item[data-effect="${this.state.currentEffect}"]`,
    ) as HTMLElement;

    if (dropdownContent && currentEffectItem) {
      const scrollTop = currentEffectItem.offsetTop - dropdownContent.offsetTop;
      dropdownContent.scrollTop = scrollTop;
      log.debug('HyperLightCard: Scrolled to current effect', {
        effect: this.state.currentEffect,
        scrollTop: scrollTop,
      });
    } else {
      log.debug(
        'HyperLightCard: Could not find dropdown content or current effect item',
      );
    }
  }

  private _highlightCurrentEffect() {
    const dropdownContent = this.shadowRoot!.querySelector('.dropdown-content');
    const items = dropdownContent?.querySelectorAll('.dropdown-item') || [];

    items.forEach(item => {
      item.classList.remove('selected');
      if (item.textContent?.trim() === this.state.currentEffect) {
        item.classList.add('selected');
      }
    });

    log.debug('HyperLightCard: Highlighted current effect');
  }

  private _toggleDropdown(e: Event) {
    log.debug('HyperLightCard: _toggleDropdown called');
    e.stopPropagation();
    this.stateManager.toggleDropdown();
    log.debug(
      'HyperLightCard: Dropdown toggled, new state:',
      this.state.isDropdownOpen,
    );

    if (this.state.isDropdownOpen) {
      // Use requestAnimationFrame to ensure the DOM has updated
      requestAnimationFrame(() => {
        this._scrollToCurrentEffect();
      });
    }

    this.requestUpdate();
  }

  private async _selectEffect(effect: string) {
    log.debug('HyperLightCard: _selectEffect called', effect);
    this.stateManager.setCurrentEffect(effect);
    this.stateManager.toggleDropdown();

    if (this.state.isOn) {
      await this.hass!.callService('light', 'turn_on', {
        entity_id: this.config!.entity,
        effect: effect,
      });
      log.debug('HyperLightCard: Effect applied via service call');
    } else {
      log.debug('HyperLightCard: Light is off, effect not applied');
    }
  }

  private _toggleAttributes() {
    log.debug('HyperLightCard: _toggleAttributes called');
    this.stateManager.toggleAttributes();
    log.debug(
      'HyperLightCard: Attributes expanded:',
      this.state.isAttributesExpanded,
    );
    this.requestUpdate();
  }

  private _handleClickOutside(event: Event) {
    log.debug('HyperLightCard: _handleClickOutside called');
    const path = event.composedPath();
    if (
      this.state.isDropdownOpen &&
      !path.includes(this.shadowRoot!.querySelector('.dropdown')!)
    ) {
      this.stateManager.toggleDropdown();
      log.debug('HyperLightCard: Dropdown closed due to outside click');
      this.requestUpdate();
    }
  }

  private async _handleBrightnessChange(e: Event) {
    log.debug('HyperLightCard: _handleBrightnessChange called');
    const target = e.target as HTMLInputElement;
    const brightness = Number(target.value);
    this.stateManager.setBrightness(brightness);

    if (this.hass && this.config) {
      // Convert 1-100 range to 3-255 range for Home Assistant
      const haBrightness = Math.round((brightness / 100) * 252) + 3;

      await this.hass.callService('light', 'turn_on', {
        entity_id: this.config.entity,
        brightness: haBrightness,
      });
      log.debug('HyperLightCard: Brightness updated', {
        brightness: brightness,
        haBrightness: haBrightness,
      });
    }
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._clickOutsideHandler);
    log.debug('HyperLightCard: connectedCallback called, click listener added');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._clickOutsideHandler);
    log.debug(
      'HyperLightCard: disconnectedCallback called, click listener removed',
    );
  }

  static getConfigElement() {
    return document.createElement('hyper-light-card-editor');
  }

  static getStubConfig(hass: HomeAssistant, entities: string[]): Config {
    const signalRGBEntities = entities.filter(entityId =>
      entityId.match(/^light\.signalrgb_/),
    );

    const defaultEntity =
      signalRGBEntities.length > 0 ? signalRGBEntities[0] : '';

    return {
      entity: defaultEntity,
      name: '',
      show_effect_info: true,
      show_effect_parameters: true,
      show_brightness_control: true,
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
  description: 'A custom card for controlling SignalRGB.',
  preview: true,
  documentationURL: 'https://github.com/hyperb1iss/hyper-light-card',
});

const version = process.env.VERSION;
console.log(
  `%c 🚀✨🌟 hyper-light-card v${version} launched! 🌠🛸🌈 `,
  'background: linear-gradient(90deg, #000033 0%, #0033cc 50%, #6600cc 100%); color: #00ffff; font-weight: bold; padding: 5px 10px; border-radius: 5px; text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px #fff, 0 0 20px #00ffff, 0 0 35px #00ffff, 0 0 40px #00ffff, 0 0 50px #00ffff, 0 0 75px #00ffff;',
);
