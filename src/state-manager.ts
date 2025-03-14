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

        // Only extract colors if the effect image has changed
        if (stateObj.attributes.effect_image !== this._state.lastEffectImage) {
          this._state.lastEffectImage = stateObj.attributes.effect_image;
          if (stateObj.attributes.effect_image) {
            try {
              const colors = await this._colorManager.extractColors(
                stateObj.attributes.effect_image
              );
              this._state.backgroundColor = colors.backgroundColor;
              this._state.textColor = colors.textColor;
              this._state.accentColor = colors.accentColor;
              log.debug('StateManager: New effect image detected and colors extracted');
            } catch (error) {
              log.error('StateManager: Error extracting colors', error);
            }
          }
        }

        const shouldUpdateBrightness =
          !this._isDraggingBrightness && this._state.brightness !== newBrightness;

        // Only update state if there are actual changes
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

        // Update layout state if layout entity is provided
        if (this._config.layout_entity) {
          const layoutStateObj = this._hass.states[this._config.layout_entity];
          if (layoutStateObj) {
            const newLayout = layoutStateObj.state;
            const newLayouts = layoutStateObj.attributes.options || [];

            // Only update if values have changed
            if (
              this._state.currentLayout !== newLayout ||
              !this._arraysEqual(this._state.availableLayouts, newLayouts)
            ) {
              this._state.currentLayout = newLayout;
              this._state.availableLayouts = [...newLayouts];
              log.debug('StateManager: Layout state updated', {
                currentLayout: this._state.currentLayout,
                availableLayouts: this._state.availableLayouts,
              });
            }
          }
        }

        // Update preset state if preset entity is provided
        if (this._config.preset_entity) {
          const presetStateObj = this._hass.states[this._config.preset_entity];
          if (presetStateObj) {
            const newPreset = presetStateObj.state;
            const newPresets = presetStateObj.attributes.options || [];

            // Only update if values have changed
            if (
              this._state.currentPreset !== newPreset ||
              !this._arraysEqual(this._state.availablePresets, newPresets)
            ) {
              this._state.currentPreset = newPreset;
              this._state.availablePresets = [...newPresets];
              log.debug('StateManager: Preset state updated', {
                currentPreset: this._state.currentPreset,
                availablePresets: this._state.availablePresets,
              });
            }
          }
        }

        // Update visibility settings from config only once
        const configChanged =
          this._state.showLayoutSelect !== (this._config.show_layout_select !== false) ||
          this._state.showPresetSelect !== (this._config.show_preset_select !== false) ||
          this._state.showEffectControls !== (this._config.show_effect_controls !== false);

        if (configChanged) {
          this._state.showLayoutSelect = this._config.show_layout_select !== false;
          this._state.showPresetSelect = this._config.show_preset_select !== false;
          this._state.showEffectControls = this._config.show_effect_controls !== false;
          log.debug('StateManager: Updated visibility settings from config');
        }
      }
    }
  }

  toggleDropdown() {
    this._state.isDropdownOpen = !this._state.isDropdownOpen;

    // Close other dropdowns when opening this one
    if (this._state.isDropdownOpen) {
      this._state.isLayoutDropdownOpen = false;
      this._state.isPresetDropdownOpen = false;
    }

    log.debug('StateManager: Dropdown toggled, new state:', this._state.isDropdownOpen);
  }

  toggleLayoutDropdown() {
    this._state.isLayoutDropdownOpen = !this._state.isLayoutDropdownOpen;

    // Close other dropdowns when opening this one
    if (this._state.isLayoutDropdownOpen) {
      this._state.isDropdownOpen = false;
      this._state.isPresetDropdownOpen = false;
    }

    log.debug(
      'StateManager: Layout dropdown toggled, new state:',
      this._state.isLayoutDropdownOpen
    );
  }

  togglePresetDropdown() {
    this._state.isPresetDropdownOpen = !this._state.isPresetDropdownOpen;

    // Close other dropdowns when opening this one
    if (this._state.isPresetDropdownOpen) {
      this._state.isDropdownOpen = false;
      this._state.isLayoutDropdownOpen = false;
    }

    log.debug(
      'StateManager: Preset dropdown toggled, new state:',
      this._state.isPresetDropdownOpen
    );
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

  async setCurrentLayout(layout: string) {
    if (!this._config.layout_entity || !this._hass) return;

    log.debug('StateManager: Setting layout to:', layout);
    await this._hass.callService('select', 'select_option', {
      entity_id: this._config.layout_entity,
      option: layout,
    });

    // Close dropdown after selection
    this._state.isLayoutDropdownOpen = false;
  }

  async setCurrentPreset(preset: string) {
    if (!this._config.preset_entity || !this._hass) return;

    log.debug('StateManager: Setting preset to:', preset);
    await this._hass.callService('select', 'select_option', {
      entity_id: this._config.preset_entity,
      option: preset,
    });

    // Close dropdown after selection
    this._state.isPresetDropdownOpen = false;
  }

  async nextEffect() {
    if (!this._config.next_effect_entity || !this._hass) return;

    log.debug('StateManager: Going to next effect');
    await this._hass.callService('button', 'press', {
      entity_id: this._config.next_effect_entity,
    });

    // Force a state update after effect change
    setTimeout(() => this.updateState(), 300);
  }

  async previousEffect() {
    if (!this._config.previous_effect_entity || !this._hass) return;

    log.debug('StateManager: Going to previous effect');
    await this._hass.callService('button', 'press', {
      entity_id: this._config.previous_effect_entity,
    });

    // Force a state update after effect change
    setTimeout(() => this.updateState(), 300);
  }

  async randomEffect() {
    if (!this._config.random_effect_entity || !this._hass) return;

    log.debug('StateManager: Setting random effect');
    await this._hass.callService('button', 'press', {
      entity_id: this._config.random_effect_entity,
    });

    // Force a state update after effect change
    setTimeout(() => this.updateState(), 300);
  }

  // Cleanup any pending timers
  cleanup() {
    if (this._brightnessDebounceTimer) {
      window.clearTimeout(this._brightnessDebounceTimer);
      this._brightnessDebounceTimer = undefined;
    }
  }

  // Helper method to check if two arrays have the same content
  private _arraysEqual<T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}
