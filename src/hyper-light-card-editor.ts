import {
  fireEvent,
  type HomeAssistant,
  type LovelaceCardConfig,
  type LovelaceCardEditor,
} from 'custom-card-helpers';
import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { detectBackend } from './backends';
import type { Config } from './config';

interface FormSchemaEntry {
  name: string;
  selector?: unknown;
  required?: boolean;
  default?: unknown;
}

export class HyperLightCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _config: Config = {
    entity: '',
    show_effect_info: true,
    show_effect_parameters: true,
    show_brightness_control: true,
    show_layout_select: true,
    show_preset_select: true,
    show_effect_controls: true,
    show_status_chips: true,
    show_live_controls: true,
    background_opacity: 0.7,
    allowed_effects: [],
  };

  public setConfig(config: LovelaceCardConfig): void {
    // Normalize: every visibility flag the card treats as enabled-by-default
    // gets an explicit `true` here so ha-form's boolean controls reflect the
    // actual render behavior. Without this the form shows toggles as off
    // for fields the user never set, and saving would persist the wrong
    // disabled value.
    const incoming = config as unknown as Config;
    const defaults = {
      show_effect_info: true,
      show_effect_parameters: true,
      show_brightness_control: true,
      show_layout_select: true,
      show_preset_select: true,
      show_effect_controls: true,
      show_scene_select: true,
      show_profile_select: false,
      show_live_controls: true,
      show_status_chips: true,
      show_per_device: false,
      background_opacity: 0.7,
      allowed_effects: [] as string[],
    };
    this._config = { ...defaults, ...incoming };
  }

  protected render() {
    if (!this.hass) return html``;
    const backend = detectBackend(this.hass, this._config);
    const schema = buildSchema(this.hass, this._config, backend.id);

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${schema}
        .computeLabel=${computeLabel}
        .computeHelper=${computeHelper}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  private _valueChanged(ev: CustomEvent) {
    const next = ev.detail.value as Config;
    this._config = next;
    fireEvent(this, 'config-changed', { config: next });
  }

  static styles = css`
    ha-form {
      display: block;
    }
  `;
}

function buildSchema(
  hass: HomeAssistant,
  config: Config,
  backendId: 'signalrgb' | 'hypercolor'
): FormSchemaEntry[] {
  const effectList = readEffectList(hass, config);
  const isHypercolor = backendId === 'hypercolor';

  const entitySchema: FormSchemaEntry[] = [
    { name: 'entity', required: true, selector: { entity: { domain: 'light' } } },
    { name: 'name', selector: { text: {} } },
    { name: 'icon', selector: { icon: {} } },
    {
      name: 'backend',
      selector: {
        select: {
          mode: 'dropdown',
          options: [
            { value: 'signalrgb', label: 'SignalRGB' },
            { value: 'hypercolor', label: 'Hypercolor' },
          ],
        },
      },
    },
  ];

  const externalEntitySchema: FormSchemaEntry[] = isHypercolor
    ? []
    : [
        {
          name: 'layout_entity',
          selector: { entity: { domain: 'select' } },
        },
        {
          name: 'preset_entity',
          selector: { entity: { domain: 'select' } },
        },
        {
          name: 'next_effect_entity',
          selector: { entity: { domain: 'button' } },
        },
        {
          name: 'previous_effect_entity',
          selector: { entity: { domain: 'button' } },
        },
        {
          name: 'random_effect_entity',
          selector: { entity: { domain: 'button' } },
        },
      ];

  const visibilitySchema: FormSchemaEntry[] = [
    { name: 'show_effect_info', selector: { boolean: {} } },
    { name: 'show_effect_parameters', selector: { boolean: {} } },
    { name: 'show_brightness_control', selector: { boolean: {} } },
    { name: 'show_layout_select', selector: { boolean: {} } },
    { name: 'show_preset_select', selector: { boolean: {} } },
    { name: 'show_effect_controls', selector: { boolean: {} } },
  ];

  const hypercolorVisibilitySchema: FormSchemaEntry[] = isHypercolor
    ? [
        { name: 'show_scene_select', selector: { boolean: {} } },
        { name: 'show_profile_select', selector: { boolean: {} } },
        { name: 'show_live_controls', selector: { boolean: {} } },
        { name: 'show_status_chips', selector: { boolean: {} } },
        { name: 'show_per_device', selector: { boolean: {} } },
      ]
    : [];

  const opacitySchema: FormSchemaEntry[] = [
    {
      name: 'background_opacity',
      selector: { number: { min: 0, max: 1, step: 0.05, mode: 'slider' } },
    },
  ];

  const allowedEffectsSchema: FormSchemaEntry[] =
    effectList.length > 0
      ? [
          {
            name: 'allowed_effects',
            selector: {
              select: {
                multiple: true,
                mode: 'list',
                options: effectList.map(effect => ({ value: effect, label: effect })),
              },
            },
          },
        ]
      : [];

  return [
    ...entitySchema,
    ...externalEntitySchema,
    ...opacitySchema,
    ...visibilitySchema,
    ...hypercolorVisibilitySchema,
    ...allowedEffectsSchema,
  ];
}

function readEffectList(hass: HomeAssistant, config: Config): string[] {
  if (!config.entity) return [];
  const stateObj = hass.states[config.entity];
  if (!stateObj) return [];
  return Array.isArray(stateObj.attributes.effect_list)
    ? (stateObj.attributes.effect_list as string[])
    : [];
}

const LABELS: Record<string, string> = {
  entity: 'Light entity',
  name: 'Card name (optional)',
  icon: 'Icon (optional)',
  backend: 'Backend (auto-detected)',
  layout_entity: 'Layout select entity',
  preset_entity: 'Preset select entity',
  next_effect_entity: 'Next-effect button',
  previous_effect_entity: 'Previous-effect button',
  random_effect_entity: 'Random-effect button',
  show_effect_info: 'Show effect info',
  show_effect_parameters: 'Show effect parameters',
  show_brightness_control: 'Show brightness control',
  show_layout_select: 'Show layout selector',
  show_preset_select: 'Show preset selector',
  show_effect_controls: 'Show effect navigation',
  show_scene_select: 'Show scene selector',
  show_profile_select: 'Show profile selector',
  show_live_controls: 'Show live control sliders',
  show_status_chips: 'Show status chips (FPS, audio, connectivity)',
  show_per_device: 'Show per-device drilldown',
  background_opacity: 'Background opacity',
  allowed_effects: 'Allowed effects',
};

function computeLabel(schema: FormSchemaEntry): string {
  return LABELS[schema.name] ?? schema.name;
}

const HELPERS: Record<string, string> = {
  backend: 'Override backend detection. Leave on the auto value unless something is off.',
  show_per_device: 'Adds an expandable list of child lights below the main card. Off by default.',
  allowed_effects: 'Limit the effect dropdown. Empty means all available effects.',
};

function computeHelper(schema: FormSchemaEntry): string | undefined {
  return HELPERS[schema.name];
}
