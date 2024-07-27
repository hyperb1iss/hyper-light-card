import { LitElement, html, css, unsafeCSS } from 'lit';
import { property } from 'lit/decorators.js';
import ColorThief from 'colorthief';
import {
  getAccessibleTextColors,
  formatAttributeKey,
  formatAttributeValue,
} from './utils';
import styles from './hyper-light-card-styles.css';

interface Hass {
  states: Record<string, any>;
  callService: (
    domain: string,
    service: string,
    serviceData?: Record<string, any>,
  ) => void;
}

interface Config {
  entity: string;
  name?: string;
  icon?: string;
  background_opacity?: number;
  show_effect_info?: boolean;
  show_effect_parameters?: boolean;
}

class HyperLightCard extends LitElement {
  @property({ type: Object }) hass?: Hass;
  @property({ type: Object }) config?: Config;
  @property({ type: Boolean, attribute: false }) _isOn = false;
  @property({ type: String, attribute: false }) _currentEffect = 'No effect';
  @property({ type: Boolean, attribute: false }) _isDropdownOpen = false;
  @property({ type: Boolean, attribute: false }) _isAttributesExpanded = false;
  @property({ type: String, attribute: false }) _backgroundColor = '';
  @property({ type: String, attribute: false }) _textColor = '';
  @property({ type: String, attribute: false }) _accentColor = '';
  @property({ type: Boolean, attribute: false }) _showEffectInfo = true;
  @property({ type: Boolean, attribute: false }) _showEffectParameters = true;

  private _colorThief = new ColorThief();
  private _clickOutsideHandler: (event: Event) => void;
  private _transitionInProgress = false;

  constructor() {
    super();
    this._clickOutsideHandler = this._handleClickOutside.bind(this);
  }

  static get styles() {
    return css`
      ${unsafeCSS(styles)}
    `;
  }

  setConfig(config: Config) {
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
      ...config,
    };
    this._showEffectInfo = this.config.show_effect_info ?? true;
    this._showEffectParameters = this.config.show_effect_parameters ?? true;
  }

  getCardSize(): number {
    return 3;
  }

  firstUpdated() {
    this._extractColors();
  }

  private _extractColors() {
    if (!this.config?.entity) {
      return;
    }
    const stateObj = this.hass?.states[this.config.entity];
    if (stateObj && stateObj.attributes.effect_image) {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = stateObj.attributes.effect_image;
      img.onload = () => {
        const palette = this._colorThief.getPalette(img, 3);
        this._applyColorTransition(palette);
      };
    }
  }

  private _applyColorTransition(palette: number[][]) {
    if (this._transitionInProgress) {
      return;
    }
    this._transitionInProgress = true;

    const newBackgroundColor = `rgb(${palette[0].join(',')})`;
    const textColors = getAccessibleTextColors(palette[0]);
    const newTextColor = `rgb(${textColors.join(',')})`;
    const newAccentColor = `rgb(${palette[1].join(',')})`;

    console.debug(
      'New colors:',
      newBackgroundColor,
      newTextColor,
      newAccentColor,
    );
    requestAnimationFrame(() => {
      this.style.setProperty('--background-color', newBackgroundColor);
      this.style.setProperty('--text-color', newTextColor);
      this.style.setProperty('--accent-color', newAccentColor);
      this.style.setProperty('--switch-checked-color', newAccentColor);
      this.style.setProperty('--switch-checked-button-color', newAccentColor);
      this.style.setProperty('--switch-checked-track-color', newAccentColor);

      this._backgroundColor = newBackgroundColor;
      this._textColor = newTextColor;
      this._accentColor = newAccentColor;

      this.requestUpdate();

      setTimeout(() => {
        this._transitionInProgress = false;
      }, 500);
    });
  }

  updated(changedProperties: Map<string | number | symbol, unknown>) {
    if (changedProperties.has('hass') || changedProperties.has('config')) {
      this._extractColors();
    }
  }

  render() {
    if (!this.hass || !this.config) {
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

    this._isOn = stateObj.state === 'on';
    this._currentEffect = stateObj.attributes.effect || 'No effect';

    return html`
      <ha-card>
        <div
          class="card"
          style="
            --background-color: ${this._backgroundColor};
            --text-color: ${this._textColor};
            --accent-color: ${this._accentColor};
          "
        >
          ${this._renderBackground(stateObj)} ${this._renderHeader(stateObj)}
          ${this._renderEffectDropdown(stateObj)}
          ${this._showEffectInfo ? this._renderEffectInfo(stateObj) : ''}
          ${this._showEffectParameters ? this._renderAttributes(stateObj) : ''}
        </div>
      </ha-card>
    `;
  }

  private _renderBackground(stateObj: any) {
    const backgroundImage = stateObj.attributes.effect_image
      ? `url(${stateObj.attributes.effect_image})`
      : 'none';
    return html`
      <div
        class="card-background"
        style="background-image: ${backgroundImage}; opacity: ${this.config!
          .background_opacity};"
      ></div>
    `;
  }

  private _renderHeader(stateObj: any) {
    const name =
      this.config!.name ||
      stateObj.attributes.friendly_name ||
      stateObj.entity_id;
    return html`
      <div class="header">
        <div class="light-icon ${this._isOn ? 'light-on' : ''}">
          ${this.config!.icon && this.config!.icon.startsWith('mdi:')
            ? html`<ha-icon icon="${this.config!.icon}"></ha-icon>`
            : html`<img src="${this.config!.icon}" alt="${name}" />`}
        </div>
        <div class="light-name" title="${name}">${name}</div>
        <ha-switch
          .checked=${this._isOn}
          @change=${this._toggleLight}
        ></ha-switch>
      </div>
    `;
  }

  private _renderEffectDropdown(stateObj: any) {
    const effectList = stateObj.attributes.effect_list || [];
    return html`
      <div class="effect-select-wrapper">
        <div class="dropdown ${this._isDropdownOpen ? 'open' : ''}">
          <div class="dropdown-header" @click=${this._toggleDropdown}>
            ${this._currentEffect}
          </div>
          <div class="dropdown-content">
            ${effectList.map(
              (effect: string) => html`
                <div
                  class="dropdown-item"
                  @click=${() => this._selectEffect(effect)}
                >
                  ${effect}
                </div>
              `,
            )}
          </div>
        </div>
      </div>
    `;
  }

  private _renderEffectInfo(stateObj: any) {
    if (!this._showEffectInfo) return html``;

    const description =
      stateObj.attributes.effect_description ||
      'No effect description available';
    const publisher =
      stateObj.attributes.effect_publisher || 'Unknown publisher';
    const usesAudio = stateObj.attributes.effect_uses_audio || false;
    const usesInput = stateObj.attributes.effect_uses_input || false;
    const usesVideo = stateObj.attributes.effect_uses_video || false;

    return html`
      <div class="effect-info ${this._isOn ? 'visible' : ''}">
        <div class="effect-info-text">
          <div class="effect-description">${description}</div>
          <div class="effect-publisher">Published by: ${publisher}</div>
        </div>
        <div class="effect-features">
          ${usesAudio
            ? html`<ha-icon
                icon="mdi:volume-high"
                title="Uses Audio"
              ></ha-icon>`
            : ''}
          ${usesInput
            ? html`<ha-icon
                icon="mdi:gamepad-variant"
                title="Uses Input"
              ></ha-icon>`
            : ''}
          ${usesVideo
            ? html`<ha-icon icon="mdi:video" title="Uses Video"></ha-icon>`
            : ''}
        </div>
      </div>
    `;
  }

  private _renderAttributes(stateObj: any) {
    if (!this._showEffectParameters) return html``;

    const effectParameters = stateObj.attributes.effect_parameters;
    return html`
      <div class="attributes ${this._isAttributesExpanded ? 'expanded' : ''}">
        <div class="attributes-header" @click=${this._toggleAttributes}>
          <ha-icon icon="mdi:chevron-down"></ha-icon>
        </div>
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
      return html`<p>No effect parameters available.</p>`;
    }

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
    this._isOn = !this._isOn;
    this.hass!.callService('light', this._isOn ? 'turn_on' : 'turn_off', {
      entity_id: this.config!.entity,
    });

    const effectInfo = this.shadowRoot!.querySelector('.effect-info');
    if (effectInfo) {
      if (this._isOn) {
        setTimeout(() => effectInfo.classList.add('visible'), 50);
      } else {
        effectInfo.classList.remove('visible');
      }
    }

    this.requestUpdate();
  }

  private _toggleDropdown(e: Event) {
    e.stopPropagation();
    this._isDropdownOpen = !this._isDropdownOpen;
    this.requestUpdate();
  }

  private _selectEffect(effect: string) {
    this._currentEffect = effect;
    this._isDropdownOpen = false;
    if (this._isOn) {
      this.hass!.callService('light', 'turn_on', {
        entity_id: this.config!.entity,
        effect: effect,
      });
    }
    this.requestUpdate();
  }

  private _toggleAttributes() {
    this._isAttributesExpanded = !this._isAttributesExpanded;
    this.requestUpdate();
  }

  private _handleClickOutside(event: Event) {
    const path = event.composedPath();
    if (
      this._isDropdownOpen &&
      !path.includes(this.shadowRoot!.querySelector('.dropdown')!)
    ) {
      this._isDropdownOpen = false;
      this.requestUpdate();
    }
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._clickOutsideHandler);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._clickOutsideHandler);
  }
}

customElements.define('hyper-light-card', HyperLightCard);

const version = process.env.VERSION;
console.log(
  `%c 🚀✨🌟 HyperLightCard v${version} launched! 🌠🛸🌈 `,
  'background: linear-gradient(90deg, #000033 0%, #0033cc 50%, #6600cc 100%); color: #00ffff; font-weight: bold; padding: 5px 10px; border-radius: 5px; text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px #fff, 0 0 20px #00ffff, 0 0 35px #00ffff, 0 0 40px #00ffff, 0 0 50px #00ffff, 0 0 75px #00ffff;'
);
