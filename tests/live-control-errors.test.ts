import type { HomeAssistant } from 'custom-card-helpers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ColorManager } from '@/color-manager';
import { HyperLightCard } from '@/hyper-light-card';

describe('live control error recovery', () => {
  let card: HyperLightCard;
  let hass: HomeAssistant;
  let rejectService: (error: Error) => void;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(ColorManager.prototype, 'extractColors').mockResolvedValue(null);
    rejectService = () => {};
    hass = {
      states: {
        'light.hypercolor': {
          entity_id: 'light.hypercolor',
          state: 'on',
          attributes: {
            friendly_name: 'Hypercolor',
            effect_controls: [
              { id: 'speed', kind: 'number', min: 0, max: 100, value: 58 },
              { id: 'enabled', kind: 'boolean', value: true },
              { id: 'mode', kind: 'enum', value: 'A', options: ['A', 'B'] },
              { id: 'tint', kind: 'color', value: '#123456' },
            ],
          },
        },
      },
      entities: { 'light.hypercolor': { config_entry_id: 'entry' } },
      callService: vi.fn(() => new Promise((_resolve, reject) => (rejectService = reject))),
    } as unknown as HomeAssistant;
    card = new HyperLightCard();
    card.setConfig({
      entity: 'light.hypercolor',
      backend: 'hypercolor',
    });
    card.hass = hass;
    document.body.append(card);
    await card.updateComplete;
  });

  afterEach(() => {
    card.remove();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  function widget(id: string): HTMLInputElement {
    const input = card.shadowRoot?.querySelector<HTMLInputElement>(
      `[data-live-control-id="${id}"]`
    );
    expect(input).toBeTruthy();
    return input!;
  }

  async function failService() {
    rejectService(new Error('read-only scene'));
    await vi.advanceTimersByTimeAsync(0);
    await card.updateComplete;
  }

  it.each(['change', 'input'])('restores an unchanged HA value after %s fails', async event => {
    const input = widget('speed');
    input.value = '59';
    input.dispatchEvent(new Event(event, { bubbles: true, composed: true }));
    await vi.advanceTimersByTimeAsync(50);
    expect(hass.callService).toHaveBeenCalledOnce();
    await failService();
    expect(input.value).toBe('58');
  });

  it('restores the latest HA value rather than the value before the edit', async () => {
    const input = widget('speed');
    input.value = '59';
    input.dispatchEvent(new Event('change'));
    hass.states['light.hypercolor'].attributes.effect_controls[0].value = 62;
    await failService();
    expect(input.value).toBe('62');
  });

  it.each([
    ['mode', 'B', 'A'],
    ['tint', '#abcdef', '#123456'],
  ])('restores the %s widget after rejection', async (id, changed, expected) => {
    const input = widget(id);
    input.value = changed;
    input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    await failService();
    expect(input.value).toBe(expected);
  });

  it('restores a switch after rejection', async () => {
    const input = widget('enabled');
    input.checked = false;
    input.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    await failService();
    expect(input.checked).toBe(true);
  });

  it('does not overwrite a new input when an earlier write fails', async () => {
    const input = widget('speed');
    input.value = '59';
    input.dispatchEvent(new Event('change'));
    input.value = '60';
    input.dispatchEvent(new Event('input'));
    await failService();
    expect(input.value).toBe('60');
  });

  it('does not reset a widget reused for a different control', async () => {
    const input = widget('speed');
    input.value = '59';
    input.dispatchEvent(new Event('change'));
    hass.states['light.hypercolor'].attributes.effect_controls[0] = {
      id: 'scale',
      kind: 'number',
      value: 20,
    };
    card.requestUpdate();
    await card.updateComplete;
    const replacement = widget('scale');
    replacement.value = '21';
    await failService();
    expect(replacement.value).toBe('21');
  });

  it('does not reset controls after replacing the card configuration', async () => {
    const input = widget('speed');
    input.value = '59';
    input.dispatchEvent(new Event('change'));
    card.setConfig({
      entity: 'light.hypercolor',
      backend: 'hypercolor',
      name: 'Replacement',
    });
    await card.updateComplete;
    const replacement = widget('speed');
    replacement.value = '61';
    await failService();
    expect(replacement.value).toBe('61');
  });
});
