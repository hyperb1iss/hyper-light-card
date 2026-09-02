import type { HomeAssistant } from 'custom-card-helpers';
import { describe, expect, it } from 'vitest';
import { signalRgbBackend } from '@/backends/signalrgb';
import type { Config } from '@/config';

function hassWithSelect(state: string, options: string[]): HomeAssistant {
  return {
    states: {
      'select.signalrgb_layout': {
        entity_id: 'select.signalrgb_layout',
        state,
        attributes: { options },
      },
    },
  } as unknown as HomeAssistant;
}

const config = {
  entity: 'light.signalrgb_home',
  layout_entity: 'select.signalrgb_layout',
} as Config;

describe('signalRgbBackend.layouts', () => {
  it('treats an unknown layout state as no current option', () => {
    const hass = hassWithSelect('unknown', ['Desk', 'Wall']);
    expect(signalRgbBackend.layouts({ hass, config })).toEqual({
      current: '',
      options: ['Desk', 'Wall'],
      available: true,
    });
  });

  it('passes a real option through untouched', () => {
    const hass = hassWithSelect('Wall', ['Desk', 'Wall']);
    expect(signalRgbBackend.layouts({ hass, config })?.current).toBe('Wall');
  });
});
