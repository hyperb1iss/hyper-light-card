// src/state.ts
import { ReactiveController, ReactiveControllerHost } from 'lit';

export class State implements ReactiveController {
  private _host: ReactiveControllerHost;
  private _backgroundColor = '';
  private _textColor = '';
  private _accentColor = '';
  private _isOn = false;
  private _currentEffect = 'No effect';
  private _isDropdownOpen = false;
  private _isAttributesExpanded = false;
  private _showEffectInfo = true;
  private _showEffectParameters = true;
  private _showBrightnessControl = true;
  private _brightness = 100;
  private _allowedEffects?: string[];
  private _lastEffectImage: string | null = null;

  constructor(host: ReactiveControllerHost) {
    (this._host = host).addController(this);
  }

  hostConnected() {
    this._host.requestUpdate();
  }

  get backgroundColor() {
    return this._backgroundColor;
  }

  set backgroundColor(value: string) {
    this._backgroundColor = value;
    this._host.requestUpdate();
  }

  get textColor() {
    return this._textColor;
  }

  set textColor(value: string) {
    this._textColor = value;
    this._host.requestUpdate();
  }

  get accentColor() {
    return this._accentColor;
  }

  set accentColor(value: string) {
    this._accentColor = value;
    this._host.requestUpdate();
  }

  get isOn() {
    return this._isOn;
  }

  set isOn(value: boolean) {
    this._isOn = value;
    this._host.requestUpdate();
  }

  get currentEffect() {
    return this._currentEffect;
  }

  set currentEffect(value: string) {
    this._currentEffect = value;
    this._host.requestUpdate();
  }

  get isDropdownOpen() {
    return this._isDropdownOpen;
  }

  set isDropdownOpen(value: boolean) {
    this._isDropdownOpen = value;
    this._host.requestUpdate();
  }

  get isAttributesExpanded() {
    return this._isAttributesExpanded;
  }

  set isAttributesExpanded(value: boolean) {
    this._isAttributesExpanded = value;
    this._host.requestUpdate();
  }

  get showEffectInfo() {
    return this._showEffectInfo;
  }

  set showEffectInfo(value: boolean) {
    this._showEffectInfo = value;
    this._host.requestUpdate();
  }

  get showEffectParameters() {
    return this._showEffectParameters;
  }

  set showEffectParameters(value: boolean) {
    this._showEffectParameters = value;
    this._host.requestUpdate();
  }

  get showBrightnessControl() {
    return this._showBrightnessControl;
  }

  set showBrightnessControl(value: boolean) {
    this._showBrightnessControl = value;
    this._host.requestUpdate();
  }

  get brightness() {
    return this._brightness;
  }

  set brightness(value: number) {
    this._brightness = value;
    this._host.requestUpdate();
  }

  get allowedEffects() {
    return this._allowedEffects;
  }

  set allowedEffects(value: string[] | undefined) {
    this._allowedEffects = value;
    this._host.requestUpdate();
  }

  get lastEffectImage() {
    return this._lastEffectImage;
  }

  set lastEffectImage(value: string | null) {
    this._lastEffectImage = value;
    this._host.requestUpdate();
  }
}
