import type { HomeAssistant } from 'custom-card-helpers';
import { HYPERCOLOR_MARK_ICON } from '../brand';
import type { Config, HypercolorConfigAddenda, HypercolorLiveControlId } from '../config';
import { convertCardBrightnessToHA, convertHABrightnessToCard } from '../utils';
import type {
  AudioControlsModel,
  AudioModel,
  BackendContext,
  CardModel,
  ConnectivityModel,
  DeviceModel,
  EffectListModel,
  EffectModel,
  LightBackend,
  LiveControlKind,
  LiveControlModel,
  NavigationModel,
  SelectModel,
  ZoneModel,
} from './types';

const DEFAULT_ICON = HYPERCOLOR_MARK_ICON;
const LIVE_CONTROL_IDS = [
  'brightness',
  'speed',
  'hue_shift',
  'intensity',
] as const satisfies readonly HypercolorLiveControlId[];

export const hypercolorBackend: LightBackend = {
  id: 'hypercolor',
  displayName: 'Hypercolor',

  describeCard(ctx) {
    const stateObj = ctx.hass.states[ctx.config.entity];
    const haBrightness = stateObj?.attributes.brightness;
    return {
      name: ctx.config.name || stateObj?.attributes.friendly_name || stateObj?.entity_id || '',
      icon: ctx.config.icon || DEFAULT_ICON,
      isOn: stateObj?.state === 'on',
      brightness: typeof haBrightness === 'number' ? convertHABrightnessToCard(haBrightness) : 100,
      paletteSource:
        typeof stateObj?.attributes.effect_image === 'string'
          ? stateObj.attributes.effect_image
          : null,
    } satisfies CardModel;
  },

  describeEffect(_ctx, stateObj) {
    const attrs = stateObj.attributes;
    return {
      name: typeof attrs.effect === 'string' ? attrs.effect : 'No effect',
      description: typeof attrs.effect_description === 'string' ? attrs.effect_description : '',
      publisher: typeof attrs.effect_publisher === 'string' ? attrs.effect_publisher : 'Hypercolor',
      usesAudio: Boolean(attrs.effect_audio_reactive ?? attrs.effect_uses_audio),
      usesInput: false,
      usesVideo: false,
      tags: Array.isArray(attrs.effect_tags) ? (attrs.effect_tags as unknown[]).map(String) : [],
      category: typeof attrs.effect_category === 'string' ? attrs.effect_category : '',
      // Interactive controls come from the `effect_controls` attribute (or the
      // `number.*` entities) via liveControls below. Static parameters stay empty.
      parameters: {},
    } satisfies EffectModel;
  },

  effectList(ctx, stateObj) {
    const all = Array.isArray(stateObj.attributes.effect_list)
      ? (stateObj.attributes.effect_list as string[])
      : [];
    const allowed = ctx.config.allowed_effects?.length
      ? all.filter(effect => ctx.config.allowed_effects!.includes(effect))
      : all;
    return {
      current: typeof stateObj.attributes.effect === 'string' ? stateObj.attributes.effect : '',
      all,
      allowed,
    } satisfies EffectListModel;
  },

  layouts(ctx) {
    return readSelectModel(ctx.hass, ctx.config.layout_entity);
  },

  presets(ctx) {
    return readSelectModel(ctx.hass, ctx.config.preset_entity);
  },

  scenes(ctx) {
    return readSelectModel(ctx.hass, addenda(ctx.config).scene_entity);
  },

  profiles(ctx) {
    return readSelectModel(ctx.hass, addenda(ctx.config).profile_entity);
  },

  navigation(ctx) {
    const extra = addenda(ctx.config);
    return {
      hasNext: hasEntity(ctx.hass, ctx.config.next_effect_entity),
      hasPrevious: hasEntity(ctx.hass, ctx.config.previous_effect_entity),
      hasRandom: hasEntity(ctx.hass, ctx.config.random_effect_entity),
      hasStop: hasEntity(ctx.hass, extra.stop_effect_entity),
    } satisfies NavigationModel;
  },

  liveControls(ctx) {
    // Prefer the master light's `effect_controls` attribute: it carries the
    // full control set for the running effect (sliders, toggles, enums,
    // colors), not just the four canonical `number.*` entities. Fall back to
    // the number entities for older integrations that don't publish it.
    const fromAttribute = liveControlsFromAttribute(ctx);
    if (fromAttribute.length > 0) return fromAttribute;
    return liveControlsFromEntities(ctx);
  },

  audioControls(ctx) {
    const extra = addenda(ctx.config);
    const reactive = readSwitchModel(ctx.hass, extra.audio_reactive_switch_entity);
    const rawDevice = readSelectModel(ctx.hass, extra.audio_device_entity);
    // A select with no options can't render a usable picker; treat it as absent
    // so the card never paints an empty audio-controls box.
    const device = rawDevice && rawDevice.options.length > 0 ? rawDevice : null;
    if (!reactive && !device) return null;
    return { reactive, device } satisfies AudioControlsModel;
  },

  zones(ctx) {
    const zoneLights = addenda(ctx.config).zone_lights ?? [];
    return zoneLights.flatMap(entityId => {
      const stateObj = ctx.hass.states[entityId];
      if (!stateObj) return [];
      const haBrightness = stateObj.attributes.brightness;
      const effect = stateObj.attributes.effect;
      return [
        {
          id: stateObj.entity_id,
          name:
            typeof stateObj.attributes.friendly_name === 'string'
              ? stateObj.attributes.friendly_name
              : stateObj.entity_id,
          role: typeof stateObj.attributes.role === 'string' ? stateObj.attributes.role : '',
          brightness:
            typeof haBrightness === 'number' ? convertHABrightnessToCard(haBrightness) : null,
          enabled: stateObj.state === 'on',
          effect: typeof effect === 'string' ? effect : '',
        } satisfies ZoneModel,
      ];
    });
  },

  connectivity(ctx) {
    const entityId = addenda(ctx.config).connected_entity;
    if (!entityId) return null;
    const stateObj = ctx.hass.states[entityId];
    if (!stateObj) return null;
    return { connected: stateObj.state === 'on' } satisfies ConnectivityModel;
  },

  fps(ctx) {
    const entityId = addenda(ctx.config).fps_entity;
    if (!entityId) return null;
    const stateObj = ctx.hass.states[entityId];
    if (!stateObj) return null;
    const value = Number.parseFloat(stateObj.state);
    return Number.isFinite(value) ? value : null;
  },

  audio(ctx) {
    const extra = addenda(ctx.config);
    if (!extra.audio_beat_entity && !extra.audio_energy_entity) return null;
    const beatState = extra.audio_beat_entity
      ? ctx.hass.states[extra.audio_beat_entity]
      : undefined;
    const energyState = extra.audio_energy_entity
      ? ctx.hass.states[extra.audio_energy_entity]
      : undefined;
    const reactiveState = extra.audio_reactive_active_entity
      ? ctx.hass.states[extra.audio_reactive_active_entity]
      : undefined;
    const energyValue = energyState ? Number.parseFloat(energyState.state) : NaN;
    return {
      beat: beatState?.state === 'on',
      energy: Number.isFinite(energyValue) ? energyValue : null,
      reactiveActive: reactiveState?.state === 'on',
    } satisfies AudioModel;
  },

  perDevice(ctx) {
    const extra = addenda(ctx.config);
    const lights = extra.per_device_lights ?? [];
    const identifyButtons = extra.per_device_identify_buttons ?? [];
    return lights.flatMap(entityId => {
      const stateObj = ctx.hass.states[entityId];
      if (!stateObj) return [];
      const haBrightness = stateObj.attributes.brightness;
      // Find an identify button under the same device_id slug pattern.
      const slug = entityId.replace(/^light\./, '');
      const identifyEntity = identifyEntityFor(slug, identifyButtons);
      return [
        {
          id: stateObj.entity_id,
          name: stateObj.attributes.friendly_name ?? stateObj.entity_id,
          brightness:
            typeof haBrightness === 'number' ? convertHABrightnessToCard(haBrightness) : null,
          enabled: stateObj.state === 'on',
          identifyEntity,
        } satisfies DeviceModel,
      ];
    });
  },

  async togglePower(ctx, on) {
    await ctx.hass.callService('light', on ? 'turn_on' : 'turn_off', {
      entity_id: ctx.config.entity,
    });
  },

  async setBrightness(ctx, value) {
    await ctx.hass.callService('light', 'turn_on', {
      entity_id: ctx.config.entity,
      brightness: convertCardBrightnessToHA(value),
    });
  },

  async setEffect(ctx, effect) {
    await ctx.hass.callService('light', 'turn_on', {
      entity_id: ctx.config.entity,
      effect,
    });
  },

  async setLayout(ctx, value) {
    if (!ctx.config.layout_entity) return;
    await ctx.hass.callService('select', 'select_option', {
      entity_id: ctx.config.layout_entity,
      option: value,
    });
  },

  async setPreset(ctx, value) {
    if (!ctx.config.preset_entity) return;
    await ctx.hass.callService('select', 'select_option', {
      entity_id: ctx.config.preset_entity,
      option: value,
    });
  },

  async setScene(ctx, value) {
    const entityId = addenda(ctx.config).scene_entity;
    if (!entityId) return;
    await ctx.hass.callService('select', 'select_option', { entity_id: entityId, option: value });
  },

  async setProfile(ctx, value) {
    const entityId = addenda(ctx.config).profile_entity;
    if (!entityId) return;
    await ctx.hass.callService('select', 'select_option', { entity_id: entityId, option: value });
  },

  async setLiveControl(ctx, id, value) {
    const entityId = addenda(ctx.config).live_control_entities?.[id as HypercolorLiveControlId];
    // The four canonical controls have smooth `number.*` entities; use them so
    // drag input debounces cleanly. Everything else goes through the daemon's
    // `set_control` service, which accepts arbitrary control ids and values.
    if (entityId && typeof value === 'number') {
      await ctx.hass.callService('number', 'set_value', { entity_id: entityId, value });
      return;
    }
    const configEntry = configEntryId(ctx.hass, ctx.config.entity);
    if (!configEntry) return;
    await ctx.hass.callService('hypercolor', 'set_control', {
      config_entry_id: configEntry,
      control_name: id,
      value,
    });
  },

  async setAudioReactive(ctx, on) {
    const entityId = addenda(ctx.config).audio_reactive_switch_entity;
    if (!entityId) return;
    await ctx.hass.callService('switch', on ? 'turn_on' : 'turn_off', { entity_id: entityId });
  },

  async setAudioDevice(ctx, value) {
    const entityId = addenda(ctx.config).audio_device_entity;
    if (!entityId) return;
    await ctx.hass.callService('select', 'select_option', { entity_id: entityId, option: value });
  },

  async setZoneBrightness(ctx, zoneEntityId, value) {
    await ctx.hass.callService('light', 'turn_on', {
      entity_id: zoneEntityId,
      brightness: convertCardBrightnessToHA(value),
    });
  },

  async setZoneEnabled(ctx, zoneEntityId, on) {
    await ctx.hass.callService('light', on ? 'turn_on' : 'turn_off', {
      entity_id: zoneEntityId,
    });
  },

  async pressNavigation(ctx, action) {
    const extra = addenda(ctx.config);
    const entity = navigationEntity(ctx.config, extra, action);
    if (!entity) return;
    await ctx.hass.callService('button', 'press', { entity_id: entity });
  },

  autoDiscover(ctx) {
    const mainEntity = ctx.config.entity;
    if (!mainEntity?.startsWith('light.hypercolor')) return {};
    const entities = Object.keys(ctx.hass.states);

    const findOne = (prefix: string) =>
      entities.find(id => id === prefix) ?? entities.find(id => id.startsWith(prefix));

    const patch: Partial<Config> = {};

    if (!ctx.config.layout_entity) {
      const found = findOne('select.hypercolor_layout');
      if (found) patch.layout_entity = found;
    }
    if (!ctx.config.preset_entity) {
      const found = findOne('select.hypercolor_preset');
      if (found) patch.preset_entity = found;
    }
    if (!ctx.config.next_effect_entity) {
      const found = findOne('button.hypercolor_next_effect');
      if (found) patch.next_effect_entity = found;
    }
    if (!ctx.config.previous_effect_entity) {
      const found = findOne('button.hypercolor_previous_effect');
      if (found) patch.previous_effect_entity = found;
    }
    if (!ctx.config.random_effect_entity) {
      const found = findOne('button.hypercolor_random_effect');
      if (found) patch.random_effect_entity = found;
    }

    const extra: HypercolorConfigAddenda = {};
    const scene = findOne('select.hypercolor_scene');
    if (scene) extra.scene_entity = scene;
    const profile = findOne('select.hypercolor_profile');
    if (profile) extra.profile_entity = profile;
    const stop = findOne('button.hypercolor_stop_effect');
    if (stop) extra.stop_effect_entity = stop;
    const fps = findOne('sensor.hypercolor_fps');
    if (fps) extra.fps_entity = fps;
    const connected = findOne('binary_sensor.hypercolor_connected');
    if (connected) extra.connected_entity = connected;
    const beat = findOne('binary_sensor.hypercolor_audio_beat');
    if (beat) extra.audio_beat_entity = beat;
    const reactive = findOne('binary_sensor.hypercolor_audio_reactive_active');
    if (reactive) extra.audio_reactive_active_entity = reactive;
    const energy = findOne('sensor.hypercolor_audio_energy');
    if (energy) extra.audio_energy_entity = energy;
    const audioReactiveSwitch = findOne('switch.hypercolor_audio_reactive');
    if (audioReactiveSwitch) extra.audio_reactive_switch_entity = audioReactiveSwitch;
    const audioDevice = findOne('select.hypercolor_audio_device');
    if (audioDevice) extra.audio_device_entity = audioDevice;

    const liveControls: Partial<Record<HypercolorLiveControlId, string>> = {};
    for (const id of LIVE_CONTROL_IDS) {
      const found = findOne(`number.hypercolor_${id}`);
      if (found) liveControls[id] = found;
    }
    if (Object.keys(liveControls).length > 0) extra.live_control_entities = liveControls;

    // Scope per-device discovery to the cards's own group. A non-root card
    // like `light.hypercolor_living_room` must not pick up children from
    // unrelated groups (e.g. `light.hypercolor_kitchen_*`); only the root
    // `light.hypercolor` card sees every Hypercolor light in the install.
    const childPrefix = mainEntity === 'light.hypercolor' ? 'light.hypercolor_' : `${mainEntity}_`;
    // Zone lights share the hub prefix but carry a `zone_id` attribute; they
    // are scene render-groups, not physical devices, so split them out and
    // keep them from polluting the per-device drilldown.
    const isZoneLight = (id: string) => ctx.hass.states[id]?.attributes.zone_id != null;
    const childLights = entities.filter(
      id => id.startsWith(childPrefix) && id !== mainEntity && !isZoneLight(id)
    );
    const zoneLights = entities.filter(id => id.startsWith(childPrefix) && isZoneLight(id));
    // Hypercolor exposes identify buttons as `button.hypercolor_identify_<device>`
    // for hub-managed children, plus the conventional `<device>_identify`
    // pattern HA generates from `_attr_name = "Identify"` on a child entity.
    const identifyButtons = entities.filter(
      id =>
        id.startsWith('button.hypercolor_identify_') ||
        (id.startsWith('button.') && id.endsWith('_identify'))
    );
    if (childLights.length > 0) extra.per_device_lights = childLights;
    if (zoneLights.length > 0) extra.zone_lights = zoneLights;
    if (identifyButtons.length > 0) extra.per_device_identify_buttons = identifyButtons;

    if (Object.keys(extra).length > 0) {
      patch.hypercolor = extra;
    }
    return patch;
  },

  stubConfig(_hass, entities) {
    const masters = entities.filter(
      id => id === 'light.hypercolor' || id.startsWith('light.hypercolor_')
    );
    const master = masters.find(id => id === 'light.hypercolor') ?? masters[0];
    if (!master) return null;
    return {
      entity: master,
      backend: 'hypercolor',
      name: '',
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
      show_zones: true,
      show_audio_controls: true,
      background_opacity: 0.7,
      allowed_effects: [],
    } satisfies Config;
  },
};

function addenda(config: Config): HypercolorConfigAddenda {
  return config.hypercolor ?? {};
}

function liveControlLabel(id: string): string {
  if (id === 'brightness') return 'Effect Brightness';
  return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function identifyEntityFor(slug: string, identifyButtons: string[]): string | null {
  const shortSlug = slug.replace(/^hypercolor_/, '');
  const candidates = new Set([
    `button.${slug}_identify`,
    `button.${shortSlug}_identify`,
    `button.hypercolor_identify_${slug}`,
    `button.hypercolor_identify_${shortSlug}`,
  ]);
  return identifyButtons.find(id => candidates.has(id)) ?? null;
}

function readSelectModel(hass: HomeAssistant, entityId?: string): SelectModel | null {
  if (!entityId) return null;
  const stateObj = hass.states[entityId];
  if (!stateObj) return { current: '', options: [], available: false };
  return {
    current: stateObj.state ?? '',
    options: Array.isArray(stateObj.attributes.options)
      ? (stateObj.attributes.options as string[])
      : [],
    available: stateObj.state !== 'unavailable',
  } satisfies SelectModel;
}

function readSwitchModel(
  hass: HomeAssistant,
  entityId?: string
): { on: boolean; available: boolean } | null {
  if (!entityId) return null;
  const stateObj = hass.states[entityId];
  if (!stateObj) return null;
  return {
    on: stateObj.state === 'on',
    available: stateObj.state !== 'unavailable' && stateObj.state !== 'unknown',
  };
}

/** Raw shape of one entry in the light's `effect_controls` attribute. */
interface HypercolorControlDescriptor {
  id?: string;
  label?: string;
  kind?: string;
  control_type?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: unknown;
  options?: string[];
}

function liveControlsFromAttribute(ctx: BackendContext): LiveControlModel[] {
  const stateObj = ctx.hass.states[ctx.config.entity];
  const raw = stateObj?.attributes.effect_controls;
  if (!Array.isArray(raw)) return [];
  // Controls inherit the master light's availability — a stale attribute on an
  // unavailable light must not render as interactive.
  const available = stateObj
    ? stateObj.state !== 'unavailable' && stateObj.state !== 'unknown'
    : false;
  return (raw as HypercolorControlDescriptor[]).flatMap(descriptor => {
    const id = descriptor?.id;
    if (!id) return [];
    const control = mapControlDescriptor(id, descriptor, available);
    // null == a control kind the card has no faithful widget for; skip it
    // rather than mis-rendering it as a slider.
    return control ? [control] : [];
  });
}

function liveControlsFromEntities(ctx: BackendContext): LiveControlModel[] {
  const extra = addenda(ctx.config);
  return LIVE_CONTROL_IDS.flatMap(id => {
    const entityId = extra.live_control_entities?.[id];
    const stateObj = entityId ? ctx.hass.states[entityId] : undefined;
    if (!stateObj) return [];
    const numeric = Number.parseFloat(stateObj.state);
    return [
      {
        id,
        label: liveControlLabel(id),
        kind: 'number',
        min: Number(stateObj.attributes.min ?? 0),
        max: Number(stateObj.attributes.max ?? 100),
        step: Number(stateObj.attributes.step ?? 1),
        value: Number.isFinite(numeric) ? numeric : 0,
        available: stateObj.state !== 'unavailable' && stateObj.state !== 'unknown',
      } satisfies LiveControlModel,
    ];
  });
}

function mapControlDescriptor(
  id: string,
  descriptor: HypercolorControlDescriptor,
  available: boolean
): LiveControlModel | null {
  const kind = normalizeControlKind(descriptor.kind, descriptor.control_type, descriptor.options);
  const label = descriptor.label || liveControlLabel(id);
  if (kind === 'other') return null;
  if (kind === 'enum') {
    const options = descriptor.options ?? [];
    const text = descriptor.value == null ? '' : String(descriptor.value);
    const index = options.indexOf(text);
    return {
      id,
      label,
      kind,
      min: 0,
      max: Math.max(0, options.length - 1),
      step: 1,
      value: index >= 0 ? index : 0,
      text,
      options,
      available,
    } satisfies LiveControlModel;
  }
  if (kind === 'boolean') {
    return {
      id,
      label,
      kind,
      min: 0,
      max: 1,
      step: 1,
      value: booleanControlValue(descriptor.value) ? 1 : 0,
      available,
    } satisfies LiveControlModel;
  }
  if (kind === 'color') {
    return {
      id,
      label,
      kind,
      min: 0,
      max: 0,
      step: 1,
      value: 0,
      text: colorToHex(descriptor.value),
      // Color controls render as a read-only swatch: the daemon's color value
      // is a linear-RGBA float list and its write contract isn't a plain sRGB
      // hex, so committing one from the card could corrupt the color.
      available: false,
    } satisfies LiveControlModel;
  }
  const numeric =
    typeof descriptor.value === 'number'
      ? descriptor.value
      : Number.parseFloat(String(descriptor.value));
  const min = Number(descriptor.min ?? 0);
  return {
    id,
    label,
    kind: 'number',
    min,
    max: Number(descriptor.max ?? 100),
    step: Number(descriptor.step ?? 1),
    value: Number.isFinite(numeric) ? numeric : min,
    available,
  } satisfies LiveControlModel;
}

function booleanControlValue(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    return ['true', '1', 'on', 'yes'].includes(value.trim().toLowerCase());
  }
  return false;
}

/**
 * Collapse the descriptor's widget vocabulary to a renderable kind. The
 * integration now emits a canonical `kind`, but keep the fuzzy fallback so the
 * card still works against older integrations that forward raw daemon tokens
 * (`combobox`/`dropdown`/`color_picker`/…). Returns `other` for kinds with no
 * faithful widget so the caller can skip them.
 */
function normalizeControlKind(
  kind?: string,
  controlType?: string,
  options?: string[]
): LiveControlKind | 'other' {
  const tokens = [kind ?? '', controlType ?? ''].map(token => token.toLowerCase());
  const has = (needle: string) => tokens.some(token => token.includes(needle));
  if (has('bool') || tokens.includes('toggle') || tokens.includes('switch')) return 'boolean';
  if (has('color') || has('rgb')) return 'color';
  if (
    has('enum') ||
    has('select') ||
    has('dropdown') ||
    has('combobox') ||
    has('variant') ||
    has('choice')
  ) {
    return 'enum';
  }
  if (options && options.length > 0) return 'enum';
  if (has('number') || has('slider') || has('float') || has('int') || has('range')) return 'number';
  return 'other';
}

/**
 * Best-effort conversion of a Hypercolor color control value to a `#rrggbb`
 * string for display. Handles the daemon's tagged `{color:[r,g,b,a]}` /
 * `[r,g,b]` float arrays (0-1), plain `{r,g,b}` objects (0-255), and hex
 * strings (`#rgb`/`#rrggbb`, with or without `#`). Always returns a valid
 * 7-char hex so `<input type="color">` never silently coerces to black on a
 * malformed value.
 */
function colorToHex(value: unknown): string {
  // Unwrap externally-tagged colors, e.g. {"color":[...]} / {"rgba":[...]}.
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const tagged = value as Record<string, unknown>;
    const inner = tagged.color ?? tagged.rgba ?? tagged.rgb;
    if (Array.isArray(inner)) value = inner;
  }

  const toHex = (r: number, g: number, b: number): string => {
    // 0-1 floats scale to 0-255; anything above 1 is already 0-255.
    const scale = (n: number) => (n <= 1 && n >= 0 ? n * 255 : n);
    const channel = (n: number) =>
      Math.max(0, Math.min(255, Math.round(scale(n))))
        .toString(16)
        .padStart(2, '0');
    return `#${channel(r)}${channel(g)}${channel(b)}`;
  };

  if (Array.isArray(value)) {
    const [r, g, b] = value;
    if (typeof r === 'number' && typeof g === 'number' && typeof b === 'number') {
      return toHex(r, g, b);
    }
  }
  if (value && typeof value === 'object') {
    const rgb = value as { r?: number; g?: number; b?: number };
    if (typeof rgb.r === 'number' && typeof rgb.g === 'number' && typeof rgb.b === 'number') {
      return toHex(rgb.r, rgb.g, rgb.b);
    }
  }
  if (typeof value === 'string') {
    const hex = value.trim().replace(/^#/, '');
    if (/^[0-9a-fA-F]{6}$/.test(hex)) return `#${hex.toLowerCase()}`;
    if (/^[0-9a-fA-F]{3}$/.test(hex)) {
      const [r, g, b] = hex.toLowerCase();
      return `#${r}${r}${g}${g}${b}${b}`;
    }
  }
  return '#000000';
}

/**
 * Resolve the Hypercolor integration's config entry id from the light entity,
 * needed by domain services like `hypercolor.set_control`. Tries the entity
 * registry first, then the owning device's primary config entry. Returns
 * undefined when the frontend registries aren't populated, in which case the
 * caller degrades gracefully (the control simply won't commit via service).
 */
function configEntryId(hass: HomeAssistant, entityId: string): string | undefined {
  const registries = hass as unknown as {
    entities?: Record<string, { config_entry_id?: string; device_id?: string } | undefined>;
    devices?: Record<
      string,
      { primary_config_entry?: string; config_entries?: string[] } | undefined
    >;
  };
  const entity = registries.entities?.[entityId];
  if (entity?.config_entry_id) return entity.config_entry_id;
  const deviceId = entity?.device_id;
  if (deviceId) {
    const device = registries.devices?.[deviceId];
    return device?.primary_config_entry ?? device?.config_entries?.[0];
  }
  return undefined;
}

function hasEntity(hass: HomeAssistant, entityId?: string): boolean {
  return Boolean(entityId && hass.states[entityId]);
}

function navigationEntity(
  config: Config,
  extra: HypercolorConfigAddenda,
  action: 'next' | 'previous' | 'random' | 'stop'
): string | undefined {
  switch (action) {
    case 'next':
      return config.next_effect_entity;
    case 'previous':
      return config.previous_effect_entity;
    case 'random':
      return config.random_effect_entity;
    case 'stop':
      return extra.stop_effect_entity;
  }
}
