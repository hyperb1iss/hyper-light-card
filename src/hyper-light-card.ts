import { LitElement, html, css, unsafeCSS } from 'lit';
import { property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import ColorThief from 'colorthief';
import {
  getAccessibleTextColors,
  formatAttributeKey,
  formatAttributeValue,
  memoize,
} from './utils';
import styles from './hyper-light-card-styles.css';

interface Hass {
  states: Record<string, HassEntity>;
  callService: (
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>,
  ) => void;
}

interface HassEntity {
  state: string;
  attributes: Record<string, string>;
  entity_id: string;
}

interface Config {
  entity: string;
  name?: string;
  icon?: string;
  background_opacity?: number;
  show_effect_info?: boolean;
  show_effect_parameters?: boolean;
  show_brightness_control?: boolean;
  allowed_effects?: string[];
}

class HyperLightCard extends LitElement {
  @property({ type: Object }) hass?: Hass;
  @property({ type: Object }) config?: Config;
  @state() private _isOn = false;
  @state() private _currentEffect = 'No effect';
  @state() private _isDropdownOpen = false;
  @state() private _isAttributesExpanded = false;
  @state() private _backgroundColor = '';
  @state() private _textColor = '';
  @state() private _accentColor = '';
  @state() private _showEffectInfo = true;
  @state() private _showEffectParameters = true;
  @state() private _showBrightnessControl = true;
  @state() private _brightness: number = 100;
  @state() private _allowedEffects?: string[];
  private _colorThief = new ColorThief();
  private _clickOutsideHandler: (event: Event) => void;
  private _transitionInProgress = false;
  private _updateCount = 0;
  private _lastEffectImage: string | null = null;

  constructor() {
    super();
    this._clickOutsideHandler = this._handleClickOutside.bind(this);
    console.debug('HyperLightCard: Constructor called');
  }

  static get styles() {
    return css`
      ${unsafeCSS(styles)}
    `;
  }

  setConfig(config: Config) {
    console.debug('HyperLightCard: setConfig called', config);
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
    this._showEffectInfo = this.config.show_effect_info ?? true;
    this._showEffectParameters = this.config.show_effect_parameters ?? true;
    this._showBrightnessControl = this.config.show_brightness_control ?? true;
    this._allowedEffects = this.config.allowed_effects;
    console.debug('HyperLightCard: Config set', this.config);
  }

  getCardSize(): number {
    return 3;
  }

  firstUpdated() {
    console.debug('HyperLightCard: firstUpdated called');
    this._debouncedExtractColors();
  }

  private _extractColors() {
    console.debug('HyperLightCard: _extractColors called');
    if (!this.config?.entity || !this.hass) {
      console.debug(
        'HyperLightCard: No entity configured or hass not available',
      );
      return;
    }
    const stateObj = this.hass.states[this.config.entity];
    if (!stateObj || !stateObj.attributes.effect_image) {
      console.debug('HyperLightCard: No effect image found');
      return;
    }

    console.debug('HyperLightCard: Extracting colors from effect image');
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = stateObj.attributes.effect_image;
    img.alt = `${stateObj.entity_id} effect image`;
    img.onload = () => {
      const palette = this._colorThief.getPalette(img, 3);
      console.debug('HyperLightCard: Color palette extracted', palette);
      if (palette && palette.length >= 2) {
        this._applyColorTransition(palette);
      } else {
        console.warn('HyperLightCard: Insufficient colors in palette', palette);
      }
    };
  }

  private async _applyColorTransition(palette: number[][]) {
    console.debug('HyperLightCard: _applyColorTransition called', palette);
    if (this._transitionInProgress) {
      console.debug('HyperLightCard: Color transition already in progress');
      return;
    }
    this._transitionInProgress = true;

    const newBackgroundColor = `rgb(${palette[0].join(',')})`;
    const textColors = getAccessibleTextColors(palette[0]);
    const newTextColor = `rgb(${textColors.join(',')})`;
    const newAccentColor = `rgb(${palette[1].join(',')})`;

    console.debug(
      'HyperLightCard: New colors:',
      newBackgroundColor,
      newTextColor,
      newAccentColor,
    );

    await new Promise(resolve => {
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

        resolve(null);
      });
    });

    this._transitionInProgress = false;
    this.requestUpdate();
  }

  private _debouncedUpdate = this._debounce(() => {
    this._extractColors();
    this.requestUpdate();
    console.debug(
      `HyperLightCard: Debounced update called (${++this._updateCount})`,
    );
  }, 250);

  private _debouncedExtractColors = this._debounce(() => {
    this._extractColors();
  }, 250);

  updated(changedProperties: Map<string | number | symbol, unknown>) {
    super.updated(changedProperties);

    console.debug('HyperLightCard: updated called', changedProperties);
    console.debug(
      'HyperLightCard: current hass state:',
      this.hass?.states[this.config?.entity ?? ''],
    );

    if (this.hass && this.config) {
      const stateObj = this.hass.states[this.config.entity];
      if (stateObj) {
        const newEffect = stateObj.attributes.effect || 'No effect';
        const newIsOn = stateObj.state === 'on';
        const newBrightness = Math.round(
          ((Number(stateObj.attributes.brightness) - 3) / 252) * 100,
        );

        console.debug('HyperLightCard: Potential new state:', {
          effect: newEffect,
          isOn: newIsOn,
          brightness: newBrightness,
        });

        // Always update if there's a new effect image
        if (stateObj.attributes.effect_image !== this._lastEffectImage) {
          this._lastEffectImage = stateObj.attributes.effect_image;
          this._debouncedExtractColors();
        }

        // Update state and trigger color extraction if anything has changed
        if (
          this._currentEffect !== newEffect ||
          this._isOn !== newIsOn ||
          this._brightness !== newBrightness
        ) {
          console.debug('HyperLightCard: State changed, updating');
          this._currentEffect = newEffect;
          this._isOn = newIsOn;
          this._brightness = newBrightness;
          this._debouncedExtractColors();
        }
      }
    }

    // If the dropdown is open, scroll to the current effect
    if (this._isDropdownOpen) {
      this._scrollToCurrentEffect();
    }
  }

  render() {
    console.debug('HyperLightCard: render called with state:', {
      isOn: this._isOn,
      currentEffect: this._currentEffect,
      brightness: this._brightness,
      isDropdownOpen: this._isDropdownOpen,
    });
    if (!this.hass || !this.config) {
      console.debug('HyperLightCard: hass or config not available');
      return html``;
    }

    const stateObj = this.hass.states[this.config.entity];
    if (!stateObj) {
      console.debug('HyperLightCard: Entity not found', this.config.entity);
      return html`
        <ha-card>
          <div class="card">Entity not found: ${this.config.entity}</div>
        </ha-card>
      `;
    }

    console.debug('HyperLightCard: Rendering with state', {
      isOn: this._isOn,
      currentEffect: this._currentEffect,
      brightness: this._brightness,
    });

    const sliderStyle = {
      '--slider-color': this._accentColor,
    };

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
          <div class="controls-row">
            ${this._showBrightnessControl
              ? this._renderBrightnessSlider(sliderStyle)
              : ''}
            ${this._showEffectParameters ? this._renderAttributesToggle() : ''}
          </div>
          ${this._showEffectParameters ? this._renderAttributes(stateObj) : ''}
        </div>
      </ha-card>
    `;
  }

  private _renderBackground(stateObj: HassEntity) {
    const backgroundImage = stateObj.attributes.effect_image
      ? `url(${stateObj.attributes.effect_image})`
      : 'none';
    console.debug('HyperLightCard: Rendering background', backgroundImage);
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
    console.debug('HyperLightCard: Rendering header', name);
    return html`
      <div class="header" aria-label="${name}">
        <div class="light-icon ${this._isOn ? 'light-on' : ''}">
          ${this.config!.icon && this.config!.icon.startsWith('mdi:')
            ? html`<ha-icon
                icon="${this.config!.icon}"
                aria-hidden="true"
              ></ha-icon>`
            : html`<img src="${this.config!.icon}" alt="${name}" />`}
        </div>
        <div class="light-name" title="${name}">${name}</div>
        <ha-switch
          .checked=${this._isOn}
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

    if (this._allowedEffects) {
      effectList = effectList.filter(effect =>
        this._allowedEffects!.includes(effect),
      );
    }

    console.debug('HyperLightCard: Rendering effect dropdown', effectList);
    return html`
      <div class="effect-select-wrapper">
        <div class="dropdown ${this._isDropdownOpen ? 'open' : ''}">
          <div
            class="dropdown-header"
            @click=${this._toggleDropdown}
            aria-label="Current effect: ${this._currentEffect}"
            role="button"
          >
            ${this._currentEffect}
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
    if (!this._showEffectInfo) return html``;

    const description =
      stateObj.attributes.effect_description ||
      'No effect description available';
    const publisher =
      stateObj.attributes.effect_publisher || 'Unknown publisher';
    const usesAudio = stateObj.attributes.effect_uses_audio || false;
    const usesInput = stateObj.attributes.effect_uses_input || false;
    const usesVideo = stateObj.attributes.effect_uses_video || false;

    console.debug('HyperLightCard: Rendering effect info', {
      description,
      publisher,
      usesAudio,
      usesInput,
      usesVideo,
    });

    return html`
      <div class="effect-info ${this._isOn ? 'visible' : ''}">
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
      '--slider-percentage': `${this._brightness}%`,
      '--slider-color': this._accentColor,
    };

    console.debug(
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
        aria-valuenow="${this._brightness}"
      >
        <ha-icon icon="mdi:brightness-6" aria-hidden="true"></ha-icon>
        <input
          type="range"
          min="1"
          max="100"
          .value=${this._brightness.toString()}
          @change=${this._handleBrightnessChange}
          @input=${this._handleBrightnessChange}
          aria-label="Adjust brightness"
        />
      </div>
    `;
  }

  private _renderAttributesToggle() {
    console.debug('HyperLightCard: Rendering attributes toggle');
    return html`
      <div
        class="attributes-toggle"
        @click=${this._toggleAttributes}
        role="button"
        aria-expanded="${this._isAttributesExpanded}"
        aria-label="Toggle effect parameters"
      >
        <ha-icon icon="mdi:chevron-down"></ha-icon>
      </div>
    `;
  }

  private _renderAttributes(stateObj: HassEntity) {
    if (!this._showEffectParameters) return html``;

    const effectParameters = stateObj.attributes
      .effect_parameters as unknown as
      | Record<string, string | number | boolean>
      | undefined;

    if (!effectParameters || Object.keys(effectParameters).length === 0) {
      console.debug('HyperLightCard: No effect parameters to render');
      return html``;
    }

    console.debug('HyperLightCard: Rendering attributes', effectParameters);

    return html`
      <div
        class="attributes ${this._isAttributesExpanded ? 'expanded' : ''}"
        aria-hidden="${!this._isAttributesExpanded}"
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
      console.debug('HyperLightCard: No effect parameters to list');
      return html`<p>No effect parameters available.</p>`;
    }

    console.debug(
      'HyperLightCard: Rendering attributes list',
      effectParameters,
    );

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
    console.debug('HyperLightCard: _toggleLight called');
    this._isOn = !this._isOn;
    this.hass!.callService('light', this._isOn ? 'turn_on' : 'turn_off', {
      entity_id: this.config!.entity,
    });

    const effectInfo = this.shadowRoot!.querySelector('.effect-info');
    if (effectInfo) {
      if (this._isOn) {
        setTimeout(() => {
          effectInfo.classList.add('visible');
          console.debug('HyperLightCard: Effect info made visible');
        }, 50);
      } else {
        effectInfo.classList.remove('visible');
        console.debug('HyperLightCard: Effect info hidden');
      }
    }

    console.debug('HyperLightCard: Light toggled, new state:', this._isOn);
  }

  private _getCurrentEffectIndex(): number {
    const stateObj = this.hass?.states[this.config?.entity ?? ''];
    const effectList: string[] = Array.isArray(stateObj?.attributes.effect_list)
      ? stateObj?.attributes.effect_list
      : [];

    return effectList.indexOf(this._currentEffect);
  }

  private _scrollToCurrentEffect() {
    console.debug('HyperLightCard: _scrollToCurrentEffect called');
    const dropdownContent = this.shadowRoot?.querySelector(
      '.dropdown-content',
    ) as HTMLElement;
    const currentEffectItem = this.shadowRoot?.querySelector(
      `.dropdown-item[data-effect="${this._currentEffect}"]`,
    ) as HTMLElement;

    if (dropdownContent && currentEffectItem) {
      const scrollTop = currentEffectItem.offsetTop - dropdownContent.offsetTop;
      dropdownContent.scrollTop = scrollTop;
      console.debug('HyperLightCard: Scrolled to current effect', {
        effect: this._currentEffect,
        scrollTop: scrollTop,
      });
    } else {
      console.debug(
        'HyperLightCard: Could not find dropdown content or current effect item',
      );
    }
  }

  private _highlightCurrentEffect() {
    const dropdownContent = this.shadowRoot!.querySelector('.dropdown-content');
    const items = dropdownContent?.querySelectorAll('.dropdown-item') || [];

    items.forEach(item => {
      item.classList.remove('selected');
      if (item.textContent?.trim() === this._currentEffect) {
        item.classList.add('selected');
      }
    });

    console.debug('HyperLightCard: Highlighted current effect');
  }

  private _toggleDropdown(e: Event) {
    console.debug('HyperLightCard: _toggleDropdown called');
    e.stopPropagation();
    this._isDropdownOpen = !this._isDropdownOpen;
    console.debug(
      'HyperLightCard: Dropdown toggled, new state:',
      this._isDropdownOpen,
    );

    if (this._isDropdownOpen) {
      // Use requestAnimationFrame to ensure the DOM has updated
      requestAnimationFrame(() => {
        this._scrollToCurrentEffect();
      });
    }

    this.requestUpdate();
  }

  private async _selectEffect(effect: string) {
    console.debug('HyperLightCard: _selectEffect called', effect);
    this._currentEffect = effect;
    this._isDropdownOpen = false;

    if (this._isOn) {
      await this.hass!.callService('light', 'turn_on', {
        entity_id: this.config!.entity,
        effect: effect,
      });
      console.debug('HyperLightCard: Effect applied via service call');
    } else {
      console.debug('HyperLightCard: Light is off, effect not applied');
    }
  }

  private _toggleAttributes() {
    console.debug('HyperLightCard: _toggleAttributes called');
    this._isAttributesExpanded = !this._isAttributesExpanded;
    console.debug(
      'HyperLightCard: Attributes expanded:',
      this._isAttributesExpanded,
    );
    this.requestUpdate();
  }

  private _handleClickOutside(event: Event) {
    console.debug('HyperLightCard: _handleClickOutside called');
    const path = event.composedPath();
    if (
      this._isDropdownOpen &&
      !path.includes(this.shadowRoot!.querySelector('.dropdown')!)
    ) {
      this._isDropdownOpen = false;
      console.debug('HyperLightCard: Dropdown closed due to outside click');
      this.requestUpdate();
    }
  }

  private async _handleBrightnessChange(e: Event) {
    console.debug('HyperLightCard: _handleBrightnessChange called');
    const target = e.target as HTMLInputElement;
    const brightness = Number(target.value);
    this._brightness = brightness;

    if (this.hass && this.config) {
      // Convert 1-100 range to 3-255 range for Home Assistant
      const haBrightness = Math.round((brightness / 100) * 252) + 3;

      await this.hass.callService('light', 'turn_on', {
        entity_id: this.config.entity,
        brightness: haBrightness,
      });
      console.debug('HyperLightCard: Brightness updated', {
        brightness: brightness,
        haBrightness: haBrightness,
      });
    }
  }

  private _debounce<T extends (...args: unknown[]) => void>(
    func: T,
    delay: number,
  ): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._clickOutsideHandler);
    console.debug(
      'HyperLightCard: connectedCallback called, click listener added',
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._clickOutsideHandler);
    console.debug(
      'HyperLightCard: disconnectedCallback called, click listener removed',
    );
  }
}

customElements.define('hyper-light-card', HyperLightCard);

const version = process.env.VERSION;
console.log(
  `%c 🚀✨🌟 hyper-light-card v${version} launched! 🌠🛸🌈 `,
  'background: linear-gradient(90deg, #000033 0%, #0033cc 50%, #6600cc 100%); color: #00ffff; font-weight: bold; padding: 5px 10px; border-radius: 5px; text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px #fff, 0 0 20px #00ffff, 0 0 35px #00ffff, 0 0 40px #00ffff, 0 0 50px #00ffff, 0 0 75px #00ffff;',
);
