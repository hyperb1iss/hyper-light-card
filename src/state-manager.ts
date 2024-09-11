// src/state-manager.ts
import { HomeAssistant } from 'custom-card-helpers';
import { log } from './utils';
import { HassEntity } from 'home-assistant-js-websocket';
import { Config } from './hyper-light-card';
import { ColorManager } from './color-manager';

export class StateManager {
  private _hass?: HomeAssistant;
  private _config: Config;
  private _isOn = false;
  private _currentEffect = 'No effect';
  private _isDropdownOpen = false;
  private _isAttributesExpanded = false;
  private _backgroundColor = '';
  private _textColor = '';
  private _accentColor = '';
  private _showEffectInfo = true;
  private _showEffectParameters = true;
  private _showBrightnessControl = true;
  private _brightness: number = 100;
  private _allowedEffects?: string[];
  private _lastEffectImage: string | null = null;
  private _colorManager: ColorManager;

  constructor(config: Config) {
    this._config = config;
    this._showEffectInfo = config.show_effect_info ?? true;
    this._showEffectParameters = config.show_effect_parameters ?? true;
    this._showBrightnessControl = config.show_brightness_control ?? true;
    this._allowedEffects = config.allowed_effects;
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

  get isOn() {
    return this._isOn;
  }

  get currentEffect() {
    return this._currentEffect;
  }

  get isDropdownOpen() {
    return this._isDropdownOpen;
  }

  get isAttributesExpanded() {
    return this._isAttributesExpanded;
  }

  get backgroundColor() {
    return this._backgroundColor;
  }

  get textColor() {
    return this._textColor;
  }

  get accentColor() {
    return this._accentColor;
  }

  get showEffectInfo() {
    return this._showEffectInfo;
  }

  get showEffectParameters() {
    return this._showEffectParameters;
  }

  get showBrightnessControl() {
    return this._showBrightnessControl;
  }

  get brightness() {
    return this._brightness;
  }

  get allowedEffects() {
    return this._allowedEffects;
  }

  get lastEffectImage() {
    return this._lastEffectImage;
  }

  setBackgroundColor(color: string) {
    this._backgroundColor = color;
  }

  setTextColor(color: string) {
    this._textColor = color;
  }

  setIsOn(value: boolean) {
    this._isOn = value;
  }

  setAccentColor(color: string) {
    this._accentColor = color;
  }

  toggleDropdown() {
    this._isDropdownOpen = !this._isDropdownOpen;
    log.debug(
      'StateManager: Dropdown toggled, new state:',
      this._isDropdownOpen,
    );
  }

  toggleAttributes() {
    this._isAttributesExpanded = !this._isAttributesExpanded;
    log.debug('StateManager: Attributes expanded:', this._isAttributesExpanded);
  }

  toggleLight() {
    this._isOn = !this._isOn;
    log.debug('StateManager: Light toggled, new state:', this._isOn);
  }

  setBrightness(brightness: number) {
    this._brightness = brightness;
    log.debug('StateManager: Brightness updated:', this._brightness);
  }

  setCurrentEffect(effect: string) {
    this._currentEffect = effect;
    log.debug('StateManager: Current effect set to:', this._currentEffect);
  }

  updateState() {
    if (this._hass && this._config) {
      const stateObj = this._hass.states[this._config.entity] as
        | HassEntity
        | undefined;
      if (stateObj) {
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

        if (stateObj.attributes.effect_image !== this._lastEffectImage) {
          this._lastEffectImage = stateObj.attributes.effect_image;
          this._colorManager.extractColors(stateObj.attributes.effect_image);
          log.debug('StateManager: New effect image detected');
        }

        if (
          this._currentEffect !== newEffect ||
          this._isOn !== newIsOn ||
          this._brightness !== newBrightness
        ) {
          this._currentEffect = newEffect;
          this._isOn = newIsOn;
          this._brightness = newBrightness;
          log.debug('StateManager: State updated', {
            effect: this._currentEffect,
            isOn: this._isOn,
            brightness: this._brightness,
          });
        }
      }
    }
  }
}