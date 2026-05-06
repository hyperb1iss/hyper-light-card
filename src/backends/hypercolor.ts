import type { HomeAssistant } from 'custom-card-helpers';
import type { Config } from '../config';
import { convertCardBrightnessToHA, convertHABrightnessToCard } from '../utils';
import type {
  AudioModel,
  CardModel,
  ConnectivityModel,
  DeviceModel,
  EffectListModel,
  EffectModel,
  LightBackend,
  LiveControlModel,
  NavigationModel,
  SelectModel,
} from './types';

const DEFAULT_ICON = 'mdi:led-strip-variant';
const LIVE_CONTROL_IDS = ['brightness', 'speed', 'hue_shift', 'intensity'] as const;

type LiveControlId = (typeof LIVE_CONTROL_IDS)[number];

interface HypercolorAddenda {
  scene_entity?: string;
  profile_entity?: string;
  stop_effect_entity?: string;
  fps_entity?: string;
  connected_entity?: string;
  audio_beat_entity?: string;
  audio_reactive_active_entity?: string;
  audio_energy_entity?: string;
  live_control_entities?: Partial<Record<LiveControlId, string>>;
  per_device_lights?: string[];
  per_device_identify_buttons?: string[];
}

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
      publisher:
        typeof attrs.effect_publisher === 'string' ? attrs.effect_publisher : 'Hypercolor',
      usesAudio: Boolean(attrs.effect_audio_reactive ?? attrs.effect_uses_audio),
      usesInput: false,
      usesVideo: false,
      // Hypercolor exposes interactive controls as separate `number.*`
      // entities (see liveControls below). Static parameters stay empty.
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
    const extra = addenda(ctx.config);
    return LIVE_CONTROL_IDS.flatMap(id => {
      const entityId = extra.live_control_entities?.[id];
      const stateObj = entityId ? ctx.hass.states[entityId] : undefined;
      if (!stateObj) return [];
      const numeric = Number.parseFloat(stateObj.state);
      return [
        {
          id,
          label: id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          min: Number(stateObj.attributes.min ?? 0),
          max: Number(stateObj.attributes.max ?? 100),
          step: Number(stateObj.attributes.step ?? 1),
          value: Number.isFinite(numeric) ? numeric : 0,
          available: stateObj.state !== 'unavailable' && stateObj.state !== 'unknown',
        } satisfies LiveControlModel,
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
    const beatState = extra.audio_beat_entity ? ctx.hass.states[extra.audio_beat_entity] : undefined;
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
      const identifyEntity =
        identifyButtons.find(id => id.includes(slug.replace(/^hypercolor_/, ''))) ?? null;
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
    const entityId = addenda(ctx.config).live_control_entities?.[id as LiveControlId];
    if (!entityId) return;
    await ctx.hass.callService('number', 'set_value', { entity_id: entityId, value });
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

    const patch: Partial<Config> & { hypercolor?: HypercolorAddenda } = {};

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

    const extra: HypercolorAddenda = {};
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

    const liveControls: Partial<Record<LiveControlId, string>> = {};
    for (const id of LIVE_CONTROL_IDS) {
      const found = findOne(`number.hypercolor_${id}`);
      if (found) liveControls[id] = found;
    }
    if (Object.keys(liveControls).length > 0) extra.live_control_entities = liveControls;

    const childLights = entities.filter(
      id => id.startsWith('light.hypercolor_') && id !== mainEntity
    );
    const identifyButtons = entities.filter(
      id => id.startsWith('button.hypercolor_') && id.endsWith('_identify')
    );
    if (childLights.length > 0) extra.per_device_lights = childLights;
    if (identifyButtons.length > 0) extra.per_device_identify_buttons = identifyButtons;

    if (Object.keys(extra).length > 0) {
      patch.hypercolor = extra;
    }
    return patch as Partial<Config>;
  },

  stubConfig(_hass, entities) {
    const masters = entities.filter(id => id === 'light.hypercolor' || id.startsWith('light.hypercolor_'));
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
      background_opacity: 0.7,
      allowed_effects: [],
    } satisfies Config;
  },
};

function addenda(config: Config): HypercolorAddenda {
  return ((config as Config & { hypercolor?: HypercolorAddenda }).hypercolor ??
    {}) as HypercolorAddenda;
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

function hasEntity(hass: HomeAssistant, entityId?: string): boolean {
  return Boolean(entityId && hass.states[entityId]);
}

function navigationEntity(
  config: Config,
  extra: HypercolorAddenda,
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
