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
    const find = (prefix: string) =>
      entities.find(id => id === `${prefix}${deviceId}`) ??
      entities.find(id => id.startsWith(prefix) && id.includes(deviceId)) ??
      entities.find(id => id.startsWith(prefix));

    const patch: Partial<Config> = {};
    if (!ctx.config.layout_entity) {
      const found = find('select.signalrgb_layout_');
      if (found) patch.layout_entity = found;
    }
    if (!ctx.config.preset_entity) {
      const found = find('select.signalrgb_preset_');
      if (found) patch.preset_entity = found;
    }
    if (!ctx.config.next_effect_entity) {
      const found = find('button.signalrgb_next_effect_');
      if (found) patch.next_effect_entity = found;
    }
    if (!ctx.config.previous_effect_entity) {
      const found = find('button.signalrgb_previous_effect_');
      if (found) patch.previous_effect_entity = found;
    }
    if (!ctx.config.random_effect_entity) {
      const found = find('button.signalrgb_random_effect_');
      if (found) patch.random_effect_entity = found;
    }
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
