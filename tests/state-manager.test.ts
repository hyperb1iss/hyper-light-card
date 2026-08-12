// src/state-manager.test.ts

import type { HomeAssistant } from 'custom-card-helpers';
import type { Mocked } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ColorManager } from '@/color-manager';
import type { Config } from '@/config';
import { State } from '@/state';
import { StateManager } from '@/state-manager';
import { convertCardBrightnessToHA } from '@/utils';

// Mock implementation of ReactiveControllerHost
class MockReactiveControllerHost {
  addController = vi.fn();
  requestUpdate = vi.fn();
  removeController = vi.fn();
  updateComplete: Promise<boolean> = Promise.resolve(true);
}

describe('StateManager', () => {
  let stateManager: StateManager;
  let mockHass: Mocked<HomeAssistant>;
  let mockState: State;
  let mockHost: MockReactiveControllerHost;

  beforeEach(() => {
    mockHost = new MockReactiveControllerHost();
    mockState = new State(mockHost);

    mockState.palette = null;

    stateManager = new StateManager({ entity: 'light.test_light' } as Config, mockState);

    mockHass = {
      states: {
        'light.test_light': {
          entity_id: 'light.test_light',
          state: 'on',
          attributes: {
            friendly_name: 'Test Light',
            effect_list: ['Effect1', 'Effect2'],
            effect: 'Effect1',
            effect_image: 'http://example.com/effect.png',
            brightness: convertCardBrightnessToHA(50), // This is the brightness value in Home Assistant's scale
          },
        },
      },
      callService: vi.fn(),
    } as unknown as Mocked<HomeAssistant>;

    // Install before assigning hass: the setter runs updateState() eagerly and
    // latches `lastEffectImage`, so a spy added afterwards is never consulted.
    vi.spyOn(ColorManager.prototype, 'extractColors').mockResolvedValue({
      backgroundColor: 'rgb(255, 0, 0)',
      textColor: 'rgb(0, 0, 0)',
      accentColor: 'rgb(0, 255, 0)',
      backgroundColorRgb: '255, 0, 0',
      textColorRgb: '0, 0, 0',
      accentColorRgb: '0, 255, 0',
    });

    stateManager.hass = mockHass;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initializes without errors', () => {
    expect(stateManager).toBeInstanceOf(StateManager);
  });

  describe('updateState', () => {
    it('updates the state correctly', async () => {
      await stateManager.updateState();
      await new Promise(process.nextTick);

      expect(mockState.palette).toEqual({
        backgroundColor: 'rgb(255, 0, 0)',
        textColor: 'rgb(0, 0, 0)',
        accentColor: 'rgb(0, 255, 0)',
        backgroundColorRgb: '255, 0, 0',
        textColorRgb: '0, 0, 0',
        accentColorRgb: '0, 255, 0',
      });
      expect(mockState.isOn).toBe(true);
      expect(mockState.currentEffect).toBe('Effect1');
      expect(mockState.brightness).toBe(50); // This is the expected brightness value in the card's scale
    });

    it('clears the palette when a later cover image cannot be read', async () => {
      await stateManager.updateState();
      await new Promise(process.nextTick);
      expect(mockState.palette).not.toBeNull();

      // A cross-origin cover taints the canvas and yields no palette. Keeping
      // the previous effect's colors would misreport the running effect, so
      // the card publishes null and falls back to the Home Assistant theme.
      vi.spyOn(ColorManager.prototype, 'extractColors').mockResolvedValue(null);
      mockHass.states['light.test_light'].attributes.effect_image = 'http://other.test/cover.png';
      await stateManager.updateState();
      await new Promise(process.nextTick);

      expect(mockState.palette).toBeNull();
    });

    it('ignores a slow extraction for a cover that is no longer current', async () => {
      await stateManager.updateState();
      await new Promise(process.nextTick);

      const stale = {
        backgroundColor: 'rgb(1, 1, 1)',
        textColor: 'rgb(2, 2, 2)',
        accentColor: 'rgb(3, 3, 3)',
        backgroundColorRgb: '1, 1, 1',
        textColorRgb: '2, 2, 2',
        accentColorRgb: '3, 3, 3',
      };
      const fresh = {
        backgroundColor: 'rgb(9, 9, 9)',
        textColor: 'rgb(8, 8, 8)',
        accentColor: 'rgb(7, 7, 7)',
        backgroundColorRgb: '9, 9, 9',
        textColorRgb: '8, 8, 8',
        accentColorRgb: '7, 7, 7',
      };

      // Cover A resolves *after* cover B. Without a guard the older request
      // would repaint the card for an effect that is no longer running.
      let releaseSlow: (() => void) | undefined;
      const slow = new Promise<typeof stale>(resolve => {
        releaseSlow = () => resolve(stale);
      });
      vi.spyOn(ColorManager.prototype, 'extractColors').mockImplementation(async (url: string) =>
        url.includes('slow') ? slow : fresh
      );

      mockHass.states['light.test_light'].attributes.effect_image = 'http://a.test/slow.png';
      const first = stateManager.updateState();
      mockHass.states['light.test_light'].attributes.effect_image = 'http://b.test/fast.png';
      await stateManager.updateState();
      await new Promise(process.nextTick);
      expect(mockState.palette).toEqual(fresh);

      releaseSlow?.();
      await first;
      await new Promise(process.nextTick);

      expect(mockState.palette).toEqual(fresh);
    });

    it('syncs visibility flags from config', async () => {
      stateManager = new StateManager(
        {
          entity: 'light.test_light',
          show_effect_info: false,
          show_effect_parameters: false,
          show_brightness_control: false,
        } as Config,
        mockState
      );
      stateManager.hass = mockHass;

      await stateManager.updateState();

      expect(mockState.showEffectInfo).toBe(false);
      expect(mockState.showEffectParameters).toBe(false);
      expect(mockState.showBrightnessControl).toBe(false);
    });
  });

  describe('toggleDropdown', () => {
    it('toggles the dropdown state', () => {
      stateManager.toggleDropdown();
      expect(mockState.isDropdownOpen).toBe(true);

      stateManager.toggleDropdown();
      expect(mockState.isDropdownOpen).toBe(false);
    });
  });

  describe('toggleAttributes', () => {
    it('toggles the attributes state', () => {
      stateManager.toggleAttributes();
      expect(mockState.isAttributesExpanded).toBe(true);

      stateManager.toggleAttributes();
      expect(mockState.isAttributesExpanded).toBe(false);
    });
  });

  describe('toggleLight', () => {
    it('toggles the light state', () => {
      // Make sure we're starting with the state we expect
      mockState.isOn = true;

      stateManager.toggleLight();
      expect(mockState.isOn).toBe(false);

      stateManager.toggleLight();
      expect(mockState.isOn).toBe(true);
    });
  });

  describe('setBrightness', () => {
    it('sets the brightness state', () => {
      stateManager.setBrightness(75);
      expect(mockState.brightness).toBe(75);
    });

    it('cancels queued brightness updates during cleanup', () => {
      vi.useFakeTimers();
      try {
        stateManager.setBrightness(75);
        stateManager.cleanup();
        vi.runAllTimers();

        expect(mockHass.callService).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('setCurrentEffect', () => {
    it('sets the current effect state', () => {
      stateManager.setCurrentEffect('Effect2');
      expect(mockState.currentEffect).toBe('Effect2');
    });
  });
});
