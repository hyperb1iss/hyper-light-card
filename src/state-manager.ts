// src/state-manager.ts
import { State } from './state';
import { ColorManager } from './color-manager';
import { log } from './utils';
import { HomeAssistant } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { Config } from './config';

export class StateManager {
  private _hass?: HomeAssistant;
  private _config: Config;
  private _state: State;
  private _colorManager: ColorManager;

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
      const stateObj = this._hass.states[this._config.entity] as
        | HassEntity
        | undefined;
      if (stateObj) {
        log.debug('StateManager: State object:', stateObj);
        const newEffect = stateObj.attributes.effect || 'No effect';
        const newIsOn = stateObj.state === 'on';
        const newBrightness = Math.round(
          ((Number(stateObj.attributes.brightness) - 3) / 252) * 100,
        );

        log.debug('StateManager: Potential new state:', {
          effect: newEffect,
          isOn: newIsOn,
          brightness: newBrightness,
        });

        if (stateObj.attributes.effect_image !== this._state.lastEffectImage) {
          this._state.lastEffectImage = stateObj.attributes.effect_image;
          const colors = await this._colorManager.extractColors(
            stateObj.attributes.effect_image,
          );
          this._state.backgroundColor = colors.backgroundColor;
          this._state.textColor = colors.textColor;
          this._state.accentColor = colors.accentColor;
          log.debug(
            'StateManager: New effect image detected and colors extracted',
          );
        }

        if (
          this._state.currentEffect !== newEffect ||
          this._state.isOn !== newIsOn ||
          this._state.brightness !== newBrightness
        ) {
          this._state.currentEffect = newEffect;
          this._state.isOn = newIsOn;
          this._state.brightness = newBrightness;
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
    log.debug(
      'StateManager: Dropdown toggled, new state:',
      this._state.isDropdownOpen,
    );
  }

  toggleAttributes() {
    this._state.isAttributesExpanded = !this._state.isAttributesExpanded;
    log.debug(
      'StateManager: Attributes expanded:',
      this._state.isAttributesExpanded,
    );
  }

  toggleLight() {
    this._state.isOn = !this._state.isOn;
    log.debug('StateManager: Light toggled, new state:', this._state.isOn);
  }

  setBrightness(brightness: number) {
    this._state.brightness = brightness;
    log.debug('StateManager: Brightness updated:', this._state.brightness);
  }

  setCurrentEffect(effect: string) {
    this._state.currentEffect = effect;
    log.debug(
      'StateManager: Current effect set to:',
      this._state.currentEffect,
    );
  }
}
