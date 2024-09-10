import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant, fireEvent } from 'custom-card-helpers';
import { Config } from './hyper-light-card';

interface ExtendedHTMLInputElement extends HTMLInputElement {
  configValue?: keyof Config;
}

@customElement('hyper-light-card-editor')
export class HyperLightCardEditor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property() private _config!: Config;
  @property() private _helpers: unknown;
  @state() private _effects: string[] = [];
  @state() private _isDropdownOpen = false;

  public setConfig(config: Config): void {
    this._config = {
      ...config,
      allowed_effects: config.allowed_effects || [],
    };
  }

  private _toggleDropdown() {
    this._isDropdownOpen = !this._isDropdownOpen;
  }

  private _effectCheckboxChanged(e: Event) {
    const target = e.target as HTMLInputElement;
    const effect = target.value;
    const isChecked = target.checked;

    let newAllowedEffects = [...(this._config.allowed_effects || [])];

    if (isChecked && !newAllowedEffects.includes(effect)) {
      newAllowedEffects.push(effect);
    } else if (!isChecked) {
      newAllowedEffects = newAllowedEffects.filter(e => e !== effect);
    }

    // Sort the allowed effects alphabetically
    newAllowedEffects.sort((a, b) => a.localeCompare(b));

    this._config = {
      ...this._config,
      allowed_effects:
        newAllowedEffects.length > 0 ? newAllowedEffects : undefined,
    };

    fireEvent(this, 'config-changed', { config: this._config });
  }

  protected firstUpdated(): void {
    this._fetchEffectList();
  }

  private async _fetchEffectList(): Promise<void> {
    if (this._config.entity) {
      const stateObj = this.hass.states[this._config.entity];
      if (stateObj && stateObj.attributes.effect_list) {
        this._effects = stateObj.attributes.effect_list;
      }
    }
  }

  protected render() {
    if (!this.hass || !this._config) {
      return html``;
    }

    return html`
      <div class="card-config">
        <ha-entity-picker
          .label="${this.hass.localize(
            'ui.panel.lovelace.editor.card.generic.entity',
          )} (${this.hass.localize(
            'ui.panel.lovelace.editor.card.config.required',
          )})"
          .hass=${this.hass}
          .value=${this._config.entity}
          .configValue=${'entity'}
          .includeDomains=${['light']}
          @change=${this._valueChanged}
          allow-custom-entity
        ></ha-entity-picker>

        <ha-textfield
          label="Name (optional)"
          .value=${this._config.name || ''}
          .configValue=${'name'}
          @input=${this._valueChanged}
        ></ha-textfield>

        <ha-icon-picker
          label="Icon (optional)"
          .value=${this._config.icon || ''}
          .configValue=${'icon'}
          @value-changed=${this._valueChanged}
        ></ha-icon-picker>

        <div class="switch-container">
          <ha-switch
            .checked=${this._config.show_effect_info !== false}
            .configValue=${'show_effect_info'}
            @change=${this._valueChanged}
          ></ha-switch>
          <span>Show Effect Info</span>
        </div>

        <div class="switch-container">
          <ha-switch
            .checked=${this._config.show_effect_parameters !== false}
            .configValue=${'show_effect_parameters'}
            @change=${this._valueChanged}
          ></ha-switch>
          <span>Show Effect Parameters</span>
        </div>

        <div class="switch-container">
          <ha-switch
            .checked=${this._config.show_brightness_control !== false}
            .configValue=${'show_brightness_control'}
            @change=${this._valueChanged}
          ></ha-switch>
          <span>Show Brightness Control</span>
        </div>

        <ha-textfield
          label="Background Opacity"
          type="number"
          min="0"
          max="1"
          step="0.1"
          .value=${this._config.background_opacity?.toString() || '0.7'}
          .configValue=${'background_opacity'}
          @input=${this._valueChanged}
        ></ha-textfield>

        <div class="allowed-effects">
          <label>Allowed Effects</label>
          <div class="dropdown">
            <div class="dropdown-header" @click=${this._toggleDropdown}>
              ${this._config.allowed_effects?.length
                ? [...this._config.allowed_effects]
                    .sort((a, b) => a.localeCompare(b))
                    .join(', ')
                : 'Select effects'}
            </div>
            <div class="dropdown-content ${this._isDropdownOpen ? 'open' : ''}">
              ${[...this._effects]
                .sort((a, b) => a.localeCompare(b))
                .map(
                  effect => html`
                    <label class="dropdown-item">
                      <input
                        type="checkbox"
                        .checked=${(
                          this._config.allowed_effects || []
                        ).includes(effect)}
                        .value=${effect}
                        @change=${this._effectCheckboxChanged}
                      />
                      ${effect}
                    </label>
                  `,
                )}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private _valueChanged(ev: CustomEvent): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target as ExtendedHTMLInputElement;
    if (target.configValue) {
      if (target.value === '' && target.configValue !== 'name') {
        delete this._config[target.configValue];
      } else {
        this._config = {
          ...this._config,
          [target.configValue]:
            target.checked !== undefined ? target.checked : target.value,
        };
      }
    }
    fireEvent(this, 'config-changed', { config: this._config });
  }

  static styles = css`
    .card-config {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .switch-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .allowed-effects {
      position: relative;
    }
    .dropdown {
      position: relative;
      z-index: 99;
    }
    .dropdown-header {
      padding: 8px;
      border: 1px solid var(--primary-text-color);
      border-radius: 4px;
      cursor: pointer;
    }
    .dropdown-content {
      display: none;
      position: absolute;
      background-color: var(--card-background-color);
      min-width: 160px;
      box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
      z-index: 100;
      max-height: 200px;
      overflow-y: auto;
    }
    .dropdown-content.open {
      display: block;
    }
    .dropdown-item {
      padding: 8px;
      display: flex;
      align-items: center;
      cursor: pointer;
    }
    .dropdown-item:hover {
      background-color: var(--secondary-background-color);
    }
    .dropdown-item input {
      margin-right: 8px;
    }
  `;
}
