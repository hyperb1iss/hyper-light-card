import type { HomeAssistant } from 'custom-card-helpers';
import type { Config } from '../config';
import { convertCardBrightnessToHA, convertHABrightnessToCard } from '../utils';
import type {
  CardModel,
  EffectListModel,
  EffectModel,
  LightBackend,
  NavigationModel,
  SelectModel,
} from './types';

const DEFAULT_ICON = 'https://brands.home-assistant.io/_/signalrgb/icon.png';

export const signalRgbBackend: LightBackend = {
  id: 'signalrgb',
  displayName: 'SignalRGB',

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
    const parameters = (attrs.effect_parameters ?? {}) as EffectModel['parameters'];
    return {
      name: typeof attrs.effect === 'string' ? attrs.effect : 'No effect',
      description: typeof attrs.effect_description === 'string' ? attrs.effect_description : '',
      publisher: typeof attrs.effect_publisher === 'string' ? attrs.effect_publisher : '',
      usesAudio: Boolean(attrs.effect_uses_audio),
      usesInput: Boolean(attrs.effect_uses_input),
      usesVideo: Boolean(attrs.effect_uses_video),
      tags: [],
      category: '',
      parameters,
    };
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

  navigation(ctx) {
    return {
      hasNext: hasButton(ctx.hass, ctx.config.next_effect_entity),
      hasPrevious: hasButton(ctx.hass, ctx.config.previous_effect_entity),
      hasRandom: hasButton(ctx.hass, ctx.config.random_effect_entity),
      hasStop: false,
    } satisfies NavigationModel;
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

  async pressNavigation(ctx, action) {
    const entity = navigationEntity(ctx.config, action);
    if (!entity) return;
    await ctx.hass.callService('button', 'press', { entity_id: entity });
  },

  autoDiscover(ctx) {
    const mainEntity = ctx.config.entity;
    if (!mainEntity?.startsWith('light.signalrgb_')) return {};
    const deviceId = mainEntity.match(/^light\.signalrgb_(.+)$/)?.[1] ?? '';
    if (!deviceId) return {};

    const entities = Object.keys(ctx.hass.states);
    // Stay scoped to this device by default; never grab another
    // SignalRGB device's controls in multi-device installs.
    const findScoped = (prefix: string) =>
      entities.find(id => id === `${prefix}${deviceId}`) ??
      entities.find(id => id.startsWith(prefix) && id.includes(deviceId));

    let layoutEntity = !ctx.config.layout_entity
      ? findScoped('select.signalrgb_layout_')
      : undefined;
    let presetEntity = !ctx.config.preset_entity
      ? findScoped('select.signalrgb_preset_')
      : undefined;
    let nextEntity = !ctx.config.next_effect_entity
      ? findScoped('button.signalrgb_next_effect_')
      : undefined;
    let prevEntity = !ctx.config.previous_effect_entity
      ? findScoped('button.signalrgb_previous_effect_')
      : undefined;
    let randomEntity = !ctx.config.random_effect_entity
      ? findScoped('button.signalrgb_random_effect_')
      : undefined;

    // Only fall back to the first matching entity by prefix when scoped
    // discovery turned up nothing for any field. Fallback per-field would
    // mix devices, which is what we want to avoid here.
    const anyScopedHit = layoutEntity || presetEntity || nextEntity || prevEntity || randomEntity;
    if (!anyScopedHit) {
      const findFirst = (prefix: string) => entities.find(id => id.startsWith(prefix));
      if (!ctx.config.layout_entity) layoutEntity = findFirst('select.signalrgb_layout_');
      if (!ctx.config.preset_entity) presetEntity = findFirst('select.signalrgb_preset_');
      if (!ctx.config.next_effect_entity) nextEntity = findFirst('button.signalrgb_next_effect_');
      if (!ctx.config.previous_effect_entity)
        prevEntity = findFirst('button.signalrgb_previous_effect_');
      if (!ctx.config.random_effect_entity)
        randomEntity = findFirst('button.signalrgb_random_effect_');
    }

    const patch: Partial<Config> = {};
    if (layoutEntity) patch.layout_entity = layoutEntity;
    if (presetEntity) patch.preset_entity = presetEntity;
    if (nextEntity) patch.next_effect_entity = nextEntity;
    if (prevEntity) patch.previous_effect_entity = prevEntity;
    if (randomEntity) patch.random_effect_entity = randomEntity;
    return patch;
  },

  stubConfig(_hass, entities) {
    const lights = entities.filter(id => id.match(/^light\.signalrgb_/));
    if (lights.length === 0) return null;
    return {
      entity: lights[0],
      name: '',
      show_effect_info: true,
      show_effect_parameters: true,
      show_brightness_control: true,
      show_layout_select: true,
      show_preset_select: true,
      show_effect_controls: true,
      background_opacity: 0.7,
      allowed_effects: [],
      layout_entity: entities.find(id => id.match(/^select\.signalrgb_layout_/)) ?? '',
      preset_entity: entities.find(id => id.match(/^select\.signalrgb_preset_/)) ?? '',
      next_effect_entity: entities.find(id => id.match(/^button\.signalrgb_next_effect_/)) ?? '',
      previous_effect_entity:
        entities.find(id => id.match(/^button\.signalrgb_previous_effect_/)) ?? '',
      random_effect_entity:
        entities.find(id => id.match(/^button\.signalrgb_random_effect_/)) ?? '',
    } satisfies Config;
  },
};

function readSelectModel(hass: HomeAssistant, entityId?: string): SelectModel | null {
  if (!entityId) return null;
  const stateObj = hass.states[entityId];
  if (!stateObj) return { current: '', options: [], available: false };
  return {
    current: stateObj.state ?? '',
    options: Array.isArray(stateObj.attributes.options)
      ? (stateObj.attributes.options as string[])
      : [],
    available: true,
  } satisfies SelectModel;
}

function hasButton(hass: HomeAssistant, entityId?: string): boolean {
  return Boolean(entityId && hass.states[entityId]);
}

function navigationEntity(
  config: Config,
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
      return undefined;
  }
}

export type { LightBackend } from './types';
