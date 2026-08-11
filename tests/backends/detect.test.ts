import type { HomeAssistant } from 'custom-card-helpers';
import { describe, expect, it } from 'vitest';
import { detectBackend } from '@/backends/detect';
import type { Config } from '@/config';

function hassWith(entityId: string, attributes: Record<string, unknown>): HomeAssistant {
  return {
    states: { [entityId]: { entity_id: entityId, state: 'on', attributes } },
  } as unknown as HomeAssistant;
}

describe('detectBackend', () => {
  it('honors an explicit backend override', () => {
    const hass = hassWith('light.anything', {});
    const config = { entity: 'light.anything', backend: 'hypercolor' } as Config;
    expect(detectBackend(hass, config).id).toBe('hypercolor');
  });

  it('detects hypercolor from its attribute signature regardless of entity name', () => {
    // The integration names the light after the daemon instance, so the entity
    // id carries no "hypercolor" marker to key off.
    const hass = hassWith('light.hyperia', {
      effect: 'Borealis',
      effect_image: 'http://hyperia.local:7777/cover.png',
      effect_controls: [{ id: 'speed', kind: 'number', min: 0, max: 100, value: 50 }],
      active_effect_id: 'borealis',
    });
    expect(detectBackend(hass, { entity: 'light.hyperia' } as Config).id).toBe('hypercolor');
  });

  it('still detects hypercolor from the default entity prefix', () => {
    const hass = hassWith('light.hypercolor', {});
    expect(detectBackend(hass, { entity: 'light.hypercolor' } as Config).id).toBe('hypercolor');
  });

  it('leaves a SignalRGB-shaped light on the signalrgb backend', () => {
    const hass = hassWith('light.signalrgb', {
      effect_image: 'http://ha.local/local/effect.png',
      effect_description: 'A SignalRGB effect',
    });
    expect(detectBackend(hass, { entity: 'light.signalrgb' } as Config).id).toBe('signalrgb');
  });

  it('falls back to signalrgb for an unknown light so existing cards do not regress', () => {
    const hass = hassWith('light.kitchen', { effect: 'Solid' });
    expect(detectBackend(hass, { entity: 'light.kitchen' } as Config).id).toBe('signalrgb');
  });
});
