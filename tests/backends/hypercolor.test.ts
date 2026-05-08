import type { HomeAssistant } from 'custom-card-helpers';
import { describe, expect, it } from 'vitest';
import { hypercolorBackend } from '@/backends/hypercolor';
import type { Config } from '@/config';

interface DiscoveredAddenda {
  scene_entity?: string;
  profile_entity?: string;
  stop_effect_entity?: string;
  fps_entity?: string;
  connected_entity?: string;
  audio_beat_entity?: string;
  audio_reactive_active_entity?: string;
  audio_energy_entity?: string;
  live_control_entities?: Record<string, string>;
  per_device_lights?: string[];
  per_device_identify_buttons?: string[];
}

type DiscoveredPatch = Partial<Config> & { hypercolor?: DiscoveredAddenda };

function hassWith(entityIds: string[]): HomeAssistant {
  const states: Record<string, unknown> = {};
  for (const id of entityIds) {
    states[id] = { entity_id: id, state: 'unknown', attributes: {} };
  }
  return { states } as unknown as HomeAssistant;
}

describe('hypercolorBackend.autoDiscover', () => {
  it('skips entities outside the hypercolor namespace', () => {
    const ctx = {
      hass: hassWith(['light.kitchen']),
      config: { entity: 'light.kitchen' } as Config,
    };
    expect(hypercolorBackend.autoDiscover?.(ctx)).toEqual({});
  });

  it('discovers core entities and per-device children for the root card', () => {
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

    const patch = hypercolorBackend.autoDiscover?.(ctx) as DiscoveredPatch;

    expect(patch.layout_entity).toBe('select.hypercolor_layout');
    expect(patch.preset_entity).toBe('select.hypercolor_preset');
    expect(patch.next_effect_entity).toBe('button.hypercolor_next_effect');
    expect(patch.hypercolor?.fps_entity).toBe('sensor.hypercolor_fps');
    expect(patch.hypercolor?.connected_entity).toBe('binary_sensor.hypercolor_connected');
    expect(patch.hypercolor?.live_control_entities?.brightness).toBe(
      'number.hypercolor_brightness'
    );
    expect(patch.hypercolor?.per_device_lights).toEqual([
      'light.hypercolor_living_room',
      'light.hypercolor_living_room_lamp_1',
    ]);
  });

  it('scopes per-device children to the configured group, not the whole install', () => {
    const ctx = {
      hass: hassWith([
        'light.hypercolor_living_room',
        'light.hypercolor_living_room_lamp_1',
        'light.hypercolor_living_room_lamp_2',
        'light.hypercolor_kitchen',
        'light.hypercolor_kitchen_strip_1',
      ]),
      config: { entity: 'light.hypercolor_living_room' } as Config,
    };

    const patch = hypercolorBackend.autoDiscover?.(ctx) as DiscoveredPatch;

    expect(patch.hypercolor?.per_device_lights).toEqual([
      'light.hypercolor_living_room_lamp_1',
      'light.hypercolor_living_room_lamp_2',
    ]);
    expect(patch.hypercolor?.per_device_lights).not.toContain('light.hypercolor_kitchen');
    expect(patch.hypercolor?.per_device_lights).not.toContain('light.hypercolor_kitchen_strip_1');
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

  it('does not overwrite explicitly configured entities', () => {
    const ctx = {
      hass: hassWith([
        'light.hypercolor',
        'select.hypercolor_layout',
        'select.hypercolor_custom_layout',
      ]),
      config: {
        entity: 'light.hypercolor',
        layout_entity: 'select.hypercolor_custom_layout',
      } as Config,
    };

    const patch = hypercolorBackend.autoDiscover?.(ctx) as Partial<Config>;

    expect(patch.layout_entity).toBeUndefined();
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
      } as Config & { hypercolor: DiscoveredAddenda },
    });

    expect(controls?.[0]).toMatchObject({
      id: 'brightness',
      label: 'Effect Brightness',
      value: 42,
    });
  });
});
