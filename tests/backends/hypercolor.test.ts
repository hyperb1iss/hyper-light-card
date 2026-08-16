import type { HomeAssistant } from 'custom-card-helpers';
import { describe, expect, it, vi } from 'vitest';
import { hypercolorBackend } from '@/backends/hypercolor';
import { HYPERCOLOR_MARK_ICON } from '@/brand';
import type { Config, HypercolorConfigAddenda } from '@/config';

type DiscoveredPatch = Partial<Config>;

interface StateStub {
  state?: string;
  attributes?: Record<string, unknown>;
}

function hassWith(entityIds: string[]): HomeAssistant {
  const states: Record<string, unknown> = {};
  for (const id of entityIds) {
    states[id] = { entity_id: id, state: 'unknown', attributes: {} };
  }
  return { states } as unknown as HomeAssistant;
}

interface HassWithSpy {
  hass: HomeAssistant;
  calls: Array<{ domain: string; service: string; data: Record<string, unknown> }>;
}

function hassWithStates(entities: Record<string, StateStub>): HassWithSpy {
  const states: Record<string, unknown> = {};
  for (const [id, stub] of Object.entries(entities)) {
    states[id] = {
      entity_id: id,
      state: stub.state ?? 'on',
      attributes: stub.attributes ?? {},
    };
  }
  const calls: HassWithSpy['calls'] = [];
  const callService = vi.fn((domain: string, service: string, data: Record<string, unknown>) => {
    calls.push({ domain, service, data });
    return Promise.resolve();
  });
  return { hass: { states, callService } as unknown as HomeAssistant, calls };
}

describe('hypercolorBackend.autoDiscover', () => {
  it('skips entities outside the hypercolor namespace', () => {
    const ctx = {
      hass: hassWith(['light.kitchen']),
      config: { entity: 'light.kitchen' } as Config,
    };
    expect(hypercolorBackend.autoDiscover?.(ctx)).toEqual({});
  });

  it('waits for registry roles even when helper names match', () => {
    const ctx = {
      hass: hassWith([
        'light.hypercolor',
        'light.hypercolor_living_room',
        'light.hypercolor_living_room_lamp_1',
        'select.hypercolor_layout',
        'select.hypercolor_preset',
        'button.hypercolor_next_effect',
        'sensor.hypercolor_fps',
        'binary_sensor.hypercolor_connected',
        'number.hypercolor_brightness',
      ]),
      config: { entity: 'light.hypercolor' } as Config,
    };

    expect(hypercolorBackend.autoDiscover?.(ctx)).toEqual({});
  });

  it('discovers the full hub surface from stable registry roles', () => {
    const hass = hassWith([
      'light.hypercolor_hyperia',
      'select.hypercolor_hyperia_layout',
      'select.hypercolor_hyperia_preset',
      'select.hypercolor_hyperia_scene',
      'button.hypercolor_hyperia_next_effect',
      'button.hypercolor_hyperia_previous_effect',
      'button.hypercolor_hyperia_random_effect',
      'button.hypercolor_hyperia_stop_effect',
      'sensor.hypercolor_hyperia_fps',
      'binary_sensor.hypercolor_hyperia_connected',
      'switch.hypercolor_hyperia_audio_reactive',
      'number.hypercolor_hyperia_brightness',
      'number.hypercolor_hyperia_speed',
    ]);
    (hass as unknown as { entities: Record<string, unknown> }).entities = {
      'light.hypercolor_hyperia': { device_id: 'hub' },
      'select.hypercolor_hyperia_layout': { device_id: 'hub', translation_key: 'layout' },
      'select.hypercolor_hyperia_preset': { device_id: 'hub', translation_key: 'preset' },
      'select.hypercolor_hyperia_scene': { device_id: 'hub', translation_key: 'scene' },
      'button.hypercolor_hyperia_next_effect': {
        device_id: 'hub',
        translation_key: 'next_effect',
      },
      'button.hypercolor_hyperia_previous_effect': {
        device_id: 'hub',
        translation_key: 'previous_effect',
      },
      'button.hypercolor_hyperia_random_effect': {
        device_id: 'hub',
        translation_key: 'random_effect',
      },
      'button.hypercolor_hyperia_stop_effect': {
        device_id: 'hub',
        translation_key: 'stop_effect',
      },
      'sensor.hypercolor_hyperia_fps': { device_id: 'hub', translation_key: 'fps' },
      'binary_sensor.hypercolor_hyperia_connected': {
        device_id: 'hub',
        translation_key: 'connected',
      },
      'switch.hypercolor_hyperia_audio_reactive': {
        device_id: 'hub',
        translation_key: 'audio_reactive',
      },
      'number.hypercolor_hyperia_brightness': {
        device_id: 'hub',
        translation_key: 'brightness',
      },
      'number.hypercolor_hyperia_speed': { device_id: 'hub', translation_key: 'speed' },
    };
    (hass as unknown as { devices: Record<string, unknown> }).devices = {
      hub: { via_device_id: null },
    };
    const ctx = {
      hass,
      config: { entity: 'light.hypercolor_hyperia' } as Config,
    };

    const patch = hypercolorBackend.autoDiscover?.(ctx) as DiscoveredPatch;

    expect(patch.layout_entity).toBe('select.hypercolor_hyperia_layout');
    expect(patch.preset_entity).toBe('select.hypercolor_hyperia_preset');
    expect(patch.next_effect_entity).toBe('button.hypercolor_hyperia_next_effect');
    expect(patch.previous_effect_entity).toBe('button.hypercolor_hyperia_previous_effect');
    expect(patch.random_effect_entity).toBe('button.hypercolor_hyperia_random_effect');
    expect(patch.hypercolor?.scene_entity).toBe('select.hypercolor_hyperia_scene');
    expect(patch.hypercolor?.stop_effect_entity).toBe('button.hypercolor_hyperia_stop_effect');
    expect(patch.hypercolor?.fps_entity).toBe('sensor.hypercolor_hyperia_fps');
    expect(patch.hypercolor?.connected_entity).toBe('binary_sensor.hypercolor_hyperia_connected');
    expect(patch.hypercolor?.audio_reactive_switch_entity).toBe(
      'switch.hypercolor_hyperia_audio_reactive'
    );
    expect(patch.hypercolor?.live_control_entities).toEqual({
      brightness: 'number.hypercolor_hyperia_brightness',
      speed: 'number.hypercolor_hyperia_speed',
    });
  });

  it('discovers hub, zone, and physical entities through registry relationships', () => {
    const hass = hassWith([
      'light.hypercolor_hyperia',
      'select.custom_layout',
      'light.lamp',
      'button.find_lamp',
      'light.other_lamp',
      'button.find_other_lamp',
    ]);
    hass.states['light.lamp'].state = 'on';
    hass.states['light.lamp'].attributes = { friendly_name: 'Lamp' };
    (hass as unknown as { entities: Record<string, unknown> }).entities = {
      'light.hypercolor_hyperia': { device_id: 'hub' },
      'select.custom_layout': { device_id: 'hub', translation_key: 'layout' },
      'light.hypercolor_hyperia_default_zone': { device_id: 'hub' },
      'light.lamp': { device_id: 'lamp' },
      'button.find_lamp': { device_id: 'lamp', translation_key: 'identify' },
      'light.other_lamp': { device_id: 'other_lamp' },
      'button.find_other_lamp': { device_id: 'other_lamp', translation_key: 'identify' },
    };
    (hass as unknown as { devices: Record<string, unknown> }).devices = {
      hub: { via_device_id: null },
      lamp: { via_device_id: 'hub' },
      other_hub: { via_device_id: null },
      other_lamp: { via_device_id: 'other_hub' },
    };

    const patch = hypercolorBackend.autoDiscover?.({
      hass,
      config: { entity: 'light.hypercolor_hyperia' } as Config,
    }) as DiscoveredPatch;

    expect(patch.layout_entity).toBe('select.custom_layout');
    expect(patch.hypercolor?.zone_lights).toEqual(['light.hypercolor_hyperia_default_zone']);
    expect(patch.hypercolor?.per_device_lights).toEqual(['light.lamp']);
    expect(patch.hypercolor?.per_device_identify_buttons).toEqual(['button.find_lamp']);

    const devices = hypercolorBackend.perDevice?.({
      hass,
      config: {
        entity: 'light.hypercolor_hyperia',
        hypercolor: patch.hypercolor,
      } as Config,
    });
    expect(devices?.[0]?.identifyEntity).toBe('button.find_lamp');
  });

  it('does not borrow another instance entities when the slug does not match', () => {
    const ctx = {
      hass: hassWith([
        'light.hypercolor_hyperia',
        'select.otherbox_layout',
        'button.otherbox_next_effect',
      ]),
      config: { entity: 'light.hypercolor_hyperia' } as Config,
    };

    const patch = hypercolorBackend.autoDiscover?.(ctx) as DiscoveredPatch;

    expect(patch.layout_entity).toBeUndefined();
    expect(patch.next_effect_entity).toBeUndefined();
  });

  it('never falls back to a different instance that happens to be default-named', () => {
    // Both a custom instance and a stock one are installed. The Hyperia card
    // must not adopt the hypercolor instance's helpers just because its own
    // are absent.
    const ctx = {
      hass: hassWith([
        'light.hypercolor_hyperia',
        'light.hypercolor',
        'select.hypercolor_layout',
        'button.hypercolor_next_effect',
      ]),
      config: { entity: 'light.hypercolor_hyperia' } as Config,
    };

    const patch = hypercolorBackend.autoDiscover?.(ctx) as DiscoveredPatch;

    expect(patch.layout_entity).toBeUndefined();
    expect(patch.next_effect_entity).toBeUndefined();
  });

  it('does not bind a collision-renamed neighbour by prefix', () => {
    const ctx = {
      hass: hassWith(['light.hypercolor_hyperia', 'select.hypercolor_hyperia_layout_2']),
      config: { entity: 'light.hypercolor_hyperia' } as Config,
    };

    expect(
      (hypercolorBackend.autoDiscover?.(ctx) as DiscoveredPatch).layout_entity
    ).toBeUndefined();
  });

  it('uses the device registry to pick the right hub when names overlap', () => {
    // Two instances whose names collide by prefix: a `hyperia_living` hub
    // alongside this card's `light.hypercolor_hyperia_living_room`. Names alone cannot
    // disambiguate, so discovery follows the registry instead.
    const hass = hassWith([
      'light.hypercolor_hyperia',
      'light.hypercolor_hyperia_living_room',
      'select.hypercolor_hyperia_layout',
      'light.hypercolor_hyperia_living',
      'select.hypercolor_hyperia_living_layout',
    ]);
    (hass as unknown as { entities: Record<string, unknown> }).entities = {
      'light.hypercolor_hyperia': { device_id: 'hub' },
      'select.hypercolor_hyperia_layout': { device_id: 'hub', translation_key: 'layout' },
      'light.hypercolor_hyperia_living_room': { device_id: 'child' },
      'light.hypercolor_hyperia_living': { device_id: 'other_hub' },
      'select.hypercolor_hyperia_living_layout': {
        device_id: 'other_hub',
        translation_key: 'layout',
      },
    };
    (hass as unknown as { devices: Record<string, unknown> }).devices = {
      hub: { via_device_id: null },
      child: { via_device_id: 'hub' },
      other_hub: { via_device_id: null },
    };

    const patch = hypercolorBackend.autoDiscover?.({
      hass,
      config: { entity: 'light.hypercolor_hyperia_living_room' } as Config,
    }) as DiscoveredPatch;

    expect(patch.layout_entity).toBe('select.hypercolor_hyperia_layout');
    expect(patch.hypercolor?.zone_lights).toBeUndefined();
  });

  it('does not fall back to names when the registry answers but lacks the helper', () => {
    // The registry is the authority. A miss means this hub has no layout
    // select, so discovery must report nothing rather than reaching for a
    // same-named entity that belongs to a different hub.
    const hass = hassWith([
      'light.hypercolor_hyperia',
      'light.hypercolor_hyperia_living_room',
      'light.hypercolor_hyperia_living',
      'select.hypercolor_hyperia_living_layout',
    ]);
    (hass as unknown as { entities: Record<string, unknown> }).entities = {
      // The hub is present and registered, it simply exposes no layout select.
      'light.hypercolor_hyperia': { device_id: 'hub' },
      'light.hypercolor_hyperia_living_room': { device_id: 'child' },
      'light.hypercolor_hyperia_living': { device_id: 'other_hub' },
      'select.hypercolor_hyperia_living_layout': { device_id: 'other_hub' },
    };
    (hass as unknown as { devices: Record<string, unknown> }).devices = {
      hub: { via_device_id: null },
      child: { via_device_id: 'hub' },
      other_hub: { via_device_id: null },
    };

    const patch = hypercolorBackend.autoDiscover?.({
      hass,
      config: { entity: 'light.hypercolor_hyperia_living_room' } as Config,
    }) as DiscoveredPatch;

    expect(patch.layout_entity).toBeUndefined();
  });

  it('waits when the device registry is only half loaded', () => {
    // `entities` knows the light but `devices` has not caught up. Treating the
    // child device as a hub would return a one-entity set and, since the
    // registry answer wins, suppress discovery entirely.
    const hass = hassWith(['light.hypercolor_hyperia', 'select.hypercolor_hyperia_layout']);
    (hass as unknown as { entities: Record<string, unknown> }).entities = {
      'light.hypercolor_hyperia': { device_id: 'hub' },
      'select.hypercolor_hyperia_layout': { device_id: 'hub' },
    };
    (hass as unknown as { devices: Record<string, unknown> }).devices = {};

    const patch = hypercolorBackend.autoDiscover?.({
      hass,
      config: { entity: 'light.hypercolor_hyperia' } as Config,
    }) as DiscoveredPatch;

    expect(patch.layout_entity).toBeUndefined();
  });

  it('ignores an ambiguous suffix match within the hub', () => {
    // Two same-device entities end in `_layout`; picking one would make the
    // result depend on registry key order.
    const hass = hassWith([
      'light.hypercolor_hyperia',
      'select.custom_layout',
      'select.spare_layout',
    ]);
    (hass as unknown as { entities: Record<string, unknown> }).entities = {
      'light.hypercolor_hyperia': { device_id: 'hub' },
      'select.custom_layout': { device_id: 'hub', translation_key: 'layout' },
      'select.spare_layout': { device_id: 'hub', translation_key: 'layout' },
    };
    (hass as unknown as { devices: Record<string, unknown> }).devices = {
      hub: { via_device_id: null },
    };

    const patch = hypercolorBackend.autoDiscover?.({
      hass,
      config: { entity: 'light.hypercolor_hyperia' } as Config,
    }) as DiscoveredPatch;

    expect(patch.layout_entity).toBeUndefined();
  });

  it('does not infer a parent namespace from a child name without registries', () => {
    const ctx = {
      hass: hassWith([
        'light.hypercolor_hyperia',
        'light.hypercolor_hyperia_living_room',
        'select.hypercolor_hyperia_layout',
        'select.hypercolor_layout',
      ]),
      config: { entity: 'light.hypercolor_hyperia_living_room' } as Config,
    };

    const patch = hypercolorBackend.autoDiscover?.(ctx) as DiscoveredPatch;

    expect(patch.layout_entity).toBeUndefined();
  });

  it('does not infer topology from overlapping names before registries load', () => {
    const ctx = {
      hass: hassWith([
        'light.hypercolor_hyperia',
        'light.hypercolor_hyperia_living',
        'button.hypercolor_hyperia_living_identify',
      ]),
      config: { entity: 'light.hypercolor_hyperia' } as Config,
    };

    const patch = hypercolorBackend.autoDiscover?.(ctx) as DiscoveredPatch;

    expect(patch.hypercolor?.per_device_lights).toBeUndefined();
    expect(patch.hypercolor?.per_device_identify_buttons).toBeUndefined();
  });

  it('returns no per-device entry when the group has no children', () => {
    const ctx = {
      hass: hassWith([
        'light.hypercolor_living_room',
        'light.hypercolor_kitchen',
        'light.hypercolor_kitchen_strip_1',
      ]),
      config: { entity: 'light.hypercolor_living_room' } as Config,
    };

    const patch = hypercolorBackend.autoDiscover?.(ctx) as DiscoveredPatch;

    expect(patch.hypercolor?.per_device_lights).toBeUndefined();
  });

  it('matches identify buttons by exact child slug', () => {
    const hass = hassWith([
      'light.hypercolor_living_room',
      'light.hypercolor_living_room_door',
      'button.hypercolor_identify_living_room_door',
      'button.hypercolor_identify_living_room',
    ]);
    hass.states['light.hypercolor_living_room'].state = 'on';
    hass.states['light.hypercolor_living_room'].attributes = {
      friendly_name: 'Living Room',
    };

    const devices = hypercolorBackend.perDevice?.({
      hass,
      config: {
        entity: 'light.hypercolor',
        hypercolor: {
          per_device_lights: ['light.hypercolor_living_room'],
          per_device_identify_buttons: [
            'button.hypercolor_identify_living_room_door',
            'button.hypercolor_identify_living_room',
          ],
        },
      },
    });

    expect(devices?.[0]?.identifyEntity).toBe('button.hypercolor_identify_living_room');
  });

  it('matches hub identify buttons for a custom instance name', () => {
    // Discovery collects `button.<instance>_identify_<child>`, so the matcher
    // has to build that shape too or the Identify control silently vanishes.
    const hass = hassWith([
      'light.hypercolor_hyperia_lamp',
      'button.hypercolor_hyperia_identify_lamp',
    ]);
    hass.states['light.hypercolor_hyperia_lamp'].state = 'on';
    hass.states['light.hypercolor_hyperia_lamp'].attributes = { friendly_name: 'Lamp' };

    const devices = hypercolorBackend.perDevice?.({
      hass,
      config: {
        entity: 'light.hypercolor_hyperia',
        hypercolor: {
          per_device_lights: ['light.hypercolor_hyperia_lamp'],
          per_device_identify_buttons: ['button.hypercolor_hyperia_identify_lamp'],
        },
      },
    });

    expect(devices?.[0]?.identifyEntity).toBe('button.hypercolor_hyperia_identify_lamp');
  });

  it('separates zone lights from device lights and finds audio + render entities', () => {
    const { hass } = hassWithStates({
      'light.hypercolor': {},
      'light.hypercolor_studio': { attributes: {} },
      'light.hypercolor_main': { attributes: { zone_id: 'zone-primary' } },
      'light.hypercolor_accent': { attributes: { zone_id: 'zone-accent' } },
      'switch.hypercolor_audio_reactive': {},
      'select.hypercolor_audio_device': {},
    });
    (hass as unknown as { entities: Record<string, unknown> }).entities = {
      'light.hypercolor': { device_id: 'hub' },
      'light.hypercolor_studio': { device_id: 'studio' },
      'light.hypercolor_main': { device_id: 'hub' },
      'light.hypercolor_accent': { device_id: 'hub' },
      'switch.hypercolor_audio_reactive': {
        device_id: 'hub',
        translation_key: 'audio_reactive',
      },
      'select.hypercolor_audio_device': {
        device_id: 'hub',
        translation_key: 'audio_device',
      },
    };
    (hass as unknown as { devices: Record<string, unknown> }).devices = {
      hub: { via_device_id: null },
      studio: { via_device_id: 'hub' },
    };

    const patch = hypercolorBackend.autoDiscover?.({
      hass,
      config: { entity: 'light.hypercolor' } as Config,
    }) as DiscoveredPatch;

    expect(patch.hypercolor?.per_device_lights).toEqual(['light.hypercolor_studio']);
    expect(patch.hypercolor?.zone_lights).toEqual([
      'light.hypercolor_main',
      'light.hypercolor_accent',
    ]);
    expect(patch.hypercolor?.audio_reactive_switch_entity).toBe('switch.hypercolor_audio_reactive');
    expect(patch.hypercolor?.audio_device_entity).toBe('select.hypercolor_audio_device');
  });

  it('does not overwrite explicitly configured entities', () => {
    const hass = hassWith([
      'light.hypercolor',
      'select.hypercolor_layout',
      'select.hypercolor_custom_layout',
      'select.hypercolor_scene',
      'select.hypercolor_custom_scene',
      'number.hypercolor_brightness',
      'number.hypercolor_custom_brightness',
      'button.hypercolor_stop_effect',
    ]);
    (hass as unknown as { entities: Record<string, unknown> }).entities = {
      'light.hypercolor': { device_id: 'hub' },
      'button.hypercolor_stop_effect': {
        device_id: 'hub',
        translation_key: 'stop_effect',
      },
    };
    (hass as unknown as { devices: Record<string, unknown> }).devices = {
      hub: { via_device_id: null },
    };
    const ctx = {
      hass,
      config: {
        entity: 'light.hypercolor',
        layout_entity: 'select.hypercolor_custom_layout',
        hypercolor: {
          scene_entity: 'select.hypercolor_custom_scene',
          live_control_entities: {
            brightness: 'number.hypercolor_custom_brightness',
          },
        },
      } as Config,
    };

    const patch = hypercolorBackend.autoDiscover?.(ctx) as Partial<Config>;

    expect(patch.layout_entity).toBeUndefined();
    expect(patch.hypercolor?.scene_entity).toBe('select.hypercolor_custom_scene');
    expect(patch.hypercolor?.live_control_entities?.brightness).toBe(
      'number.hypercolor_custom_brightness'
    );
    expect(patch.hypercolor?.stop_effect_entity).toBe('button.hypercolor_stop_effect');
  });
});

describe('hypercolorBackend.liveControls', () => {
  it('labels effect brightness distinctly from the card brightness slider', () => {
    const hass = hassWith(['light.hypercolor', 'number.hypercolor_brightness']);
    (hass.states as Record<string, unknown>)['number.hypercolor_brightness'] = {
      entity_id: 'number.hypercolor_brightness',
      state: '42',
      attributes: { min: 0, max: 100, step: 1 },
    };

    const controls = hypercolorBackend.liveControls?.({
      hass,
      config: {
        entity: 'light.hypercolor',
        hypercolor: {
          live_control_entities: {
            brightness: 'number.hypercolor_brightness',
          },
        },
      } satisfies Config & { hypercolor: HypercolorConfigAddenda },
    });

    expect(controls?.[0]).toMatchObject({
      id: 'brightness',
      label: 'Effect Brightness',
      kind: 'number',
      value: 42,
    });
  });

  it('prefers the effect_controls attribute and normalizes control kinds', () => {
    const { hass } = hassWithStates({
      'light.hypercolor': {
        attributes: {
          effect_controls: [
            { id: 'speed', label: 'Speed', kind: 'number', min: 0, max: 100, step: 1, value: 72 },
            { id: 'mirror', label: 'Mirror', kind: 'bool', value: true },
            {
              id: 'palette',
              label: 'Palette',
              kind: 'enum',
              options: ['Sunset', 'Ocean'],
              value: 'Ocean',
            },
            { id: 'tint', label: 'Tint', kind: 'color', value: '#ff00aa' },
          ],
        },
      },
    });

    const controls = hypercolorBackend.liveControls?.({
      hass,
      config: { entity: 'light.hypercolor' } as Config,
    });

    expect(controls?.map(control => [control.id, control.kind])).toEqual([
      ['speed', 'number'],
      ['mirror', 'boolean'],
      ['palette', 'enum'],
      ['tint', 'color'],
    ]);
    // enum value resolves to the selected option index, with the label kept.
    expect(controls?.[2]).toMatchObject({ value: 1, text: 'Ocean', options: ['Sunset', 'Ocean'] });
    expect(controls?.[3]).toMatchObject({ value: 0, text: '#ff00aa' });
    expect(controls?.[1]).toMatchObject({ value: 1 });
  });

  it('skips unrenderable kinds, parses structured colors, and inherits availability', () => {
    const { hass } = hassWithStates({
      'light.hypercolor': {
        state: 'on',
        attributes: {
          effect_controls: [
            { id: 'speed', label: 'Speed', kind: 'number', min: 0, max: 100, value: 40 },
            { id: 'tint', label: 'Tint', kind: 'color', value: { color: [1, 0, 0.5, 1] } },
            { id: 'caption', label: 'Caption', kind: 'other', value: 'hi' },
            // Legacy daemon token: dropdown classifies as enum via the fallback.
            {
              id: 'legacy',
              label: 'Legacy',
              control_type: 'dropdown',
              options: ['A', 'B'],
              value: 'B',
            },
          ],
        },
      },
    });

    const controls = hypercolorBackend.liveControls?.({
      hass,
      config: { entity: 'light.hypercolor' } as Config,
    });

    // 'other' (text/gradient/rect/asset) is skipped, never mis-rendered.
    expect(controls?.map(control => control.id)).toEqual(['speed', 'tint', 'legacy']);
    const tint = controls?.find(control => control.id === 'tint');
    // {color:[1,0,0.5]} linear floats (0-1) scale to #ff0080.
    expect(tint).toMatchObject({ kind: 'color', text: '#ff0080', available: false });
    expect(controls?.find(control => control.id === 'legacy')?.kind).toBe('enum');
    expect(controls?.find(control => control.id === 'speed')?.available).toBe(true);
  });

  it('marks attribute controls unavailable when the light is unavailable', () => {
    const { hass } = hassWithStates({
      'light.hypercolor': {
        state: 'unavailable',
        attributes: { effect_controls: [{ id: 'speed', kind: 'number', value: 10 }] },
      },
    });

    const controls = hypercolorBackend.liveControls?.({
      hass,
      config: { entity: 'light.hypercolor' } as Config,
    });

    expect(controls?.[0]?.available).toBe(false);
  });
});

describe('hypercolorBackend.describeEffect', () => {
  it('surfaces the enriched metadata attributes', () => {
    const { hass } = hassWithStates({
      'light.hypercolor': {
        attributes: {
          effect: 'Neon Rain',
          effect_description: 'Cascading neon',
          effect_publisher: 'Aurora Labs',
          effect_audio_reactive: true,
          effect_tags: ['cyberpunk', 'rain'],
          effect_category: 'ambient',
        },
      },
    });
    const stateObj = hass.states['light.hypercolor'];

    const effect = hypercolorBackend.describeEffect(
      { hass, config: { entity: 'light.hypercolor' } as Config },
      stateObj
    );

    expect(effect).toMatchObject({
      name: 'Neon Rain',
      description: 'Cascading neon',
      publisher: 'Aurora Labs',
      usesAudio: true,
      tags: ['cyberpunk', 'rain'],
      category: 'ambient',
    });
  });
});

describe('hypercolorBackend.describeCard', () => {
  it('defaults to the inline Hypercolor brand mark', () => {
    const { hass } = hassWithStates({ 'light.hypercolor': { attributes: {} } });
    const card = hypercolorBackend.describeCard({
      hass,
      config: { entity: 'light.hypercolor' } as Config,
    });
    expect(card.icon).toBe(HYPERCOLOR_MARK_ICON);
  });

  it('honors an explicit icon override', () => {
    const { hass } = hassWithStates({ 'light.hypercolor': { attributes: {} } });
    const card = hypercolorBackend.describeCard({
      hass,
      config: { entity: 'light.hypercolor', icon: 'mdi:led-strip' } as Config,
    });
    expect(card.icon).toBe('mdi:led-strip');
  });
});

describe('hypercolorBackend.zones', () => {
  it('maps zone lights to zone models', () => {
    const { hass } = hassWithStates({
      'light.hypercolor_main': {
        state: 'on',
        attributes: {
          friendly_name: 'Main',
          role: 'primary',
          zone_id: 'zone-primary',
          brightness: 128,
          effect: 'Rainbow',
        },
      },
      'light.hypercolor_accent': {
        state: 'off',
        attributes: { friendly_name: 'Accent', zone_id: 'zone-accent' },
      },
    });

    const zones = hypercolorBackend.zones?.({
      hass,
      config: {
        entity: 'light.hypercolor',
        hypercolor: { zone_lights: ['light.hypercolor_main', 'light.hypercolor_accent'] },
      } as Config,
    });

    expect(zones?.[0]).toMatchObject({
      id: 'light.hypercolor_main',
      name: 'Main',
      role: 'primary',
      enabled: true,
      effect: 'Rainbow',
    });
    expect(zones?.[0]?.brightness).toBeGreaterThan(0);
    expect(zones?.[1]).toMatchObject({ name: 'Accent', enabled: false, effect: '' });
  });
});

describe('hypercolorBackend.audioControls', () => {
  it('reads the reactive switch and device select', () => {
    const { hass } = hassWithStates({
      'switch.hypercolor_audio_reactive': { state: 'on' },
      'select.hypercolor_audio_device': {
        state: 'Built-in',
        attributes: { options: ['Built-in', 'USB Mic'] },
      },
    });

    const model = hypercolorBackend.audioControls?.({
      hass,
      config: {
        entity: 'light.hypercolor',
        hypercolor: {
          audio_reactive_switch_entity: 'switch.hypercolor_audio_reactive',
          audio_device_entity: 'select.hypercolor_audio_device',
        },
      } as Config,
    });

    expect(model?.reactive).toEqual({ on: true, available: true });
    expect(model?.device).toMatchObject({ current: 'Built-in', options: ['Built-in', 'USB Mic'] });
  });

  it('returns null when no audio entities are configured', () => {
    const { hass } = hassWithStates({});
    expect(
      hypercolorBackend.audioControls?.({ hass, config: { entity: 'light.hypercolor' } as Config })
    ).toBeNull();
  });
});

describe('hypercolorBackend setters', () => {
  it('routes canonical numeric controls through the number entity', async () => {
    const { hass, calls } = hassWithStates({ 'light.hypercolor': {} });
    await hypercolorBackend.setLiveControl?.(
      {
        hass,
        config: {
          entity: 'light.hypercolor',
          hypercolor: { live_control_entities: { speed: 'number.hypercolor_speed' } },
        } as Config,
      },
      'speed',
      55
    );
    expect(calls).toEqual([
      {
        domain: 'number',
        service: 'set_value',
        data: { entity_id: 'number.hypercolor_speed', value: 55 },
      },
    ]);
  });

  it('routes non-entity controls through the set_control service using the config entry id', async () => {
    const { hass, calls } = hassWithStates({ 'light.hypercolor': {} });
    (hass as unknown as { entities: Record<string, unknown> }).entities = {
      'light.hypercolor': { config_entry_id: 'entry-123' },
    };
    await hypercolorBackend.setLiveControl?.(
      { hass, config: { entity: 'light.hypercolor' } as Config },
      'palette',
      'Ocean'
    );
    expect(calls).toEqual([
      {
        domain: 'hypercolor',
        service: 'set_control',
        data: { config_entry_id: 'entry-123', control_name: 'palette', value: 'Ocean' },
      },
    ]);
  });

  it('resolves the config entry via the device registry when the entity lacks one', async () => {
    const { hass, calls } = hassWithStates({ 'light.hypercolor': {} });
    const registries = hass as unknown as {
      entities: Record<string, unknown>;
      devices: Record<string, unknown>;
    };
    registries.entities = { 'light.hypercolor': { device_id: 'dev-1' } };
    registries.devices = { 'dev-1': { primary_config_entry: 'entry-9' } };

    await hypercolorBackend.setLiveControl?.(
      { hass, config: { entity: 'light.hypercolor' } as Config },
      'palette',
      'Ocean'
    );

    expect(calls[0]?.data.config_entry_id).toBe('entry-9');
  });

  it('silently skips set_control when no config entry can be resolved', async () => {
    const { hass, calls } = hassWithStates({ 'light.hypercolor': {} });
    await hypercolorBackend.setLiveControl?.(
      { hass, config: { entity: 'light.hypercolor' } as Config },
      'palette',
      'Ocean'
    );
    expect(calls).toEqual([]);
  });

  it('toggles the audio-reactive switch', async () => {
    const { hass, calls } = hassWithStates({
      'switch.hypercolor_audio_reactive': { state: 'off' },
    });
    await hypercolorBackend.setAudioReactive?.(
      {
        hass,
        config: {
          entity: 'light.hypercolor',
          hypercolor: { audio_reactive_switch_entity: 'switch.hypercolor_audio_reactive' },
        } as Config,
      },
      true
    );
    expect(calls[0]).toMatchObject({ domain: 'switch', service: 'turn_on' });
  });

  it('enables a zone via the light domain', async () => {
    const { hass, calls } = hassWithStates({ 'light.hypercolor_main': { state: 'off' } });
    await hypercolorBackend.setZoneEnabled?.(
      { hass, config: { entity: 'light.hypercolor' } as Config },
      'light.hypercolor_main',
      true
    );
    expect(calls[0]).toEqual({
      domain: 'light',
      service: 'turn_on',
      data: { entity_id: 'light.hypercolor_main' },
    });
  });
});
