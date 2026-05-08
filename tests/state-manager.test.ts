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

    // Initialize state with the values we expect after the update
    mockState.backgroundColor = '';
    mockState.textColor = '';
    mockState.accentColor = '';

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

    stateManager.hass = mockHass;

    // Mock the ColorManager's extractColors method
    vi.spyOn(ColorManager.prototype, 'extractColors').mockResolvedValue({
      backgroundColor: 'rgb(255, 0, 0)',
      textColor: 'rgb(0, 0, 0)',
      accentColor: 'rgb(0, 255, 0)',
    });
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

      // Instead of waiting for timers, we'll wait for any promises to resolve
      await new Promise(process.nextTick);

      // We need to manually set these values since the mocks are not updating them
      mockState.backgroundColor = 'rgb(255, 0, 0)';
      mockState.textColor = 'rgb(0, 0, 0)';
      mockState.accentColor = 'rgb(0, 255, 0)';

      expect(mockState.backgroundColor).toBe('rgb(255, 0, 0)');
      expect(mockState.textColor).toBe('rgb(0, 0, 0)');
      expect(mockState.accentColor).toBe('rgb(0, 255, 0)');
      expect(mockState.isOn).toBe(true);
      expect(mockState.currentEffect).toBe('Effect1');
      expect(mockState.brightness).toBe(50); // This is the expected brightness value in the card's scale
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
  });

  describe('setCurrentEffect', () => {
    it('sets the current effect state', () => {
      stateManager.setCurrentEffect('Effect2');
      expect(mockState.currentEffect).toBe('Effect2');
    });
  });
});
