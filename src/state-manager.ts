import { State } from './state';
import { ColorManager } from './color-manager';
import { convertCardBrightnessToHA, convertHABrightnessToCard, log } from './utils';
import { HomeAssistant } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { Config } from './config';

export class StateManager {
  private _hass?: HomeAssistant;
  private _config: Config;
  private _state: State;
  private _colorManager: ColorManager;
  private _brightnessDebounceTimer?: number;
  private _isDraggingBrightness = false; // Track active dragging

  constructor(config: Config, state: State) {
    this._config = config;
    this._state = state;
    this._colorManager = new ColorManager();
    log.debug('StateManager: Initialized with config', config);
  }

  get hass() {
    return this._hass;
  }

  set hass(hass: HomeAssistant | undefined) {
    this._hass = hass;
    this.updateState();
  }

  async updateState() {
    log.debug('StateManager: Updating state');
    if (this._hass && this._config) {
      const stateObj = this._hass.states[this._config.entity] as HassEntity | undefined;
      if (stateObj) {
        log.debug('StateManager: State object:', stateObj);
        const newEffect = stateObj.attributes.effect || 'No effect';
        const newIsOn = stateObj.state === 'on';
        const newBrightness = convertHABrightnessToCard(stateObj.attributes.brightness);

        log.debug('StateManager: Potential new state:', {
          effect: newEffect,
          isOn: newIsOn,
          brightness: newBrightness,
        });

        if (stateObj.attributes.effect_image !== this._state.lastEffectImage) {
          this._state.lastEffectImage = stateObj.attributes.effect_image;
          const colors = await this._colorManager.extractColors(stateObj.attributes.effect_image);
          this._state.backgroundColor = colors.backgroundColor;
          this._state.textColor = colors.textColor;
          this._state.accentColor = colors.accentColor;
          log.debug('StateManager: New effect image detected and colors extracted');
        }

        const shouldUpdateBrightness =
          !this._isDraggingBrightness && this._state.brightness !== newBrightness;

        if (
          this._state.currentEffect !== newEffect ||
          this._state.isOn !== newIsOn ||
          shouldUpdateBrightness
        ) {
          this._state.currentEffect = newEffect;
          this._state.isOn = newIsOn;

          // Only update brightness if we're not dragging
          if (shouldUpdateBrightness) {
            this._state.brightness = newBrightness;
          }

          log.debug('StateManager: State updated', {
            effect: this._state.currentEffect,
            isOn: this._state.isOn,
            brightness: this._state.brightness,
          });
        }
      }
    }
  }

  toggleDropdown() {
    this._state.isDropdownOpen = !this._state.isDropdownOpen;
    log.debug('StateManager: Dropdown toggled, new state:', this._state.isDropdownOpen);
  }

  toggleAttributes() {
    this._state.isAttributesExpanded = !this._state.isAttributesExpanded;
    log.debug('StateManager: Attributes expanded:', this._state.isAttributesExpanded);
  }

  async toggleLight() {
    this._state.isOn = !this._state.isOn;
    log.debug('StateManager: Light toggled, new state:', this._state.isOn);

    if (this._hass && this._config) {
      log.debug('StateManager: Calling service', this._state.isOn);
      await this._hass.callService('light', this._state.isOn ? 'turn_on' : 'turn_off', {
        entity_id: this._config.entity,
      });
    }
  }

  startBrightnessDrag() {
    this._isDraggingBrightness = true;
  }

  endBrightnessDrag() {
    this._isDraggingBrightness = false;
  }

  setBrightness(brightness: number) {
    // Ensure brightness is a valid number and rounded to an integer
    const validBrightness = Math.min(100, Math.max(1, Math.round(brightness)));

    // Update UI state immediately
    this._state.brightness = validBrightness;

    // Clear any existing timer
    if (this._brightnessDebounceTimer) {
      window.clearTimeout(this._brightnessDebounceTimer);
    }

    // Send to HA with minimal debounce
    this._brightnessDebounceTimer = window.setTimeout(() => {
      if (this._hass && this._config) {
        const haBrightness = convertCardBrightnessToHA(validBrightness);
        this._hass.callService('light', 'turn_on', {
          entity_id: this._config.entity,
          brightness: haBrightness,
        });
      }
    }, 10);
  }

  async setCurrentEffect(effect: string) {
    this._state.currentEffect = effect;
    log.debug('StateManager: Current effect set to:', this._state.currentEffect);

    if (this._hass && this._config) {
      await this._hass.callService('light', 'turn_on', {
        entity_id: this._config.entity,
        effect: effect,
      });
    }
  }

  // Cleanup any pending timers
  cleanup() {
    if (this._brightnessDebounceTimer) {
      window.clearTimeout(this._brightnessDebounceTimer);
      this._brightnessDebounceTimer = undefined;
    }
  }
}
