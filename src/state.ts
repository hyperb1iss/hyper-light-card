import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { Palette } from './color-manager';

export class State implements ReactiveController {
  private _host: ReactiveControllerHost;
  private _palette: Palette | null = null;
  private _isOn = false;
  private _currentEffect = 'No effect';
  private _isDropdownOpen = false;
  private _isAttributesExpanded = false;
  private _showEffectInfo = true;
  private _showEffectParameters = true;
  private _showBrightnessControl = true;
  private _brightness = 100;
  private _lastEffectImage: string | null = null;

  private _isLayoutDropdownOpen = false;
  private _showLayoutSelect = true;

  private _isPresetDropdownOpen = false;
  private _showPresetSelect = true;

  private _isSceneDropdownOpen = false;
  private _isProfileDropdownOpen = false;

  // Effect navigation controls
  private _showEffectControls = true;

  constructor(host: ReactiveControllerHost) {
    this._host = host;
    host.addController(this);
  }

  hostConnected() {
    this._host.requestUpdate();
  }

  /**
   * Colors derived from the active effect's cover art, or `null` when the
   * image could not be read. `null` means "use the Home Assistant theme": the
   * card omits the color custom properties entirely so the stylesheet
   * fallbacks take over.
   */
  get palette(): Palette | null {
    return this._palette;
  }

  set palette(value: Palette | null) {
    this._palette = value;
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

  get lastEffectImage() {
    return this._lastEffectImage;
  }

  set lastEffectImage(value: string | null) {
    this._lastEffectImage = value;
    this._host.requestUpdate();
  }

  get isLayoutDropdownOpen() {
    return this._isLayoutDropdownOpen;
  }

  set isLayoutDropdownOpen(value: boolean) {
    this._isLayoutDropdownOpen = value;
    this._host.requestUpdate();
  }

  get showLayoutSelect() {
    return this._showLayoutSelect;
  }

  set showLayoutSelect(value: boolean) {
    this._showLayoutSelect = value;
    this._host.requestUpdate();
  }

  get isPresetDropdownOpen() {
    return this._isPresetDropdownOpen;
  }

  set isPresetDropdownOpen(value: boolean) {
    this._isPresetDropdownOpen = value;
    this._host.requestUpdate();
  }

  get showPresetSelect() {
    return this._showPresetSelect;
  }

  set showPresetSelect(value: boolean) {
    this._showPresetSelect = value;
    this._host.requestUpdate();
  }

  // Effect controls getter and setter
  get showEffectControls() {
    return this._showEffectControls;
  }

  set showEffectControls(value: boolean) {
    this._showEffectControls = value;
    this._host.requestUpdate();
  }

  get isSceneDropdownOpen() {
    return this._isSceneDropdownOpen;
  }

  set isSceneDropdownOpen(value: boolean) {
    this._isSceneDropdownOpen = value;
    this._host.requestUpdate();
  }

  get isProfileDropdownOpen() {
    return this._isProfileDropdownOpen;
  }

  set isProfileDropdownOpen(value: boolean) {
    this._isProfileDropdownOpen = value;
    this._host.requestUpdate();
  }
}
