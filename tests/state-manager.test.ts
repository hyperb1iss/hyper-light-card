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
    // starts palette extraction, so a spy added afterwards is never consulted.
    vi.spyOn(ColorManager.prototype, 'extractColors').mockResolvedValue({
      backgroundColor: 'rgb(255, 0, 0)',
      textColor: 'rgb(0, 0, 0)',
      accentColor: 'rgb(0, 255, 0)',
      accentTextColor: 'rgb(0, 0, 0)',
      backgroundColorRgb: '255, 0, 0',
      textColorRgb: '0, 0, 0',
      accentColorRgb: '0, 255, 0',
    });

    stateManager.hass = mockHass;
  });

  afterEach(() => {
    stateManager.cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('initializes without errors', () => {
    expect(stateManager).toBeInstanceOf(StateManager);
  });

  describe('updateState', () => {
    it('rejects a retired manager palette when its replacement uses the same cover', async () => {
      await stateManager.updateState();
      const fresh = mockState.palette;
      let releaseOld: (() => void) | undefined;
      vi.spyOn(ColorManager.prototype, 'extractColors')
        .mockImplementationOnce(
          () =>
            new Promise(resolve => {
              releaseOld = () => resolve(null);
            })
        )
        .mockResolvedValueOnce(fresh);
      mockHass.states['light.test_light'].attributes.effect_image = 'replacement.png';
      const pending = stateManager.updateState();
      stateManager.cleanup();
      stateManager = new StateManager({ entity: 'light.test_light' }, mockState);
      stateManager.hass = mockHass;
      await stateManager.updateState();
      releaseOld?.();
      await pending;
      expect(mockState.palette).toEqual(fresh);
    });

    it('ignores an older extraction after returning to the same cover', async () => {
      await stateManager.updateState();
      const fresh = mockState.palette;
      let releaseOld: (() => void) | undefined;
      vi.spyOn(ColorManager.prototype, 'extractColors')
        .mockImplementationOnce(
          () =>
            new Promise(resolve => {
              releaseOld = () => resolve(null);
            })
        )
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(fresh);
      mockHass.states['light.test_light'].attributes.effect_image = 'a.png';
      const old = stateManager.updateState();
      mockHass.states['light.test_light'].attributes.effect_image = 'b.png';
      await stateManager.updateState();
      mockHass.states['light.test_light'].attributes.effect_image = 'a.png';
      await stateManager.updateState();
      expect(mockState.palette).toEqual(fresh);
      releaseOld?.();
      await old;
      expect(mockState.palette).toEqual(fresh);
    });

    it('updates the state correctly', async () => {
      await stateManager.updateState();
      await new Promise(process.nextTick);

      expect(mockState.palette).toEqual({
        backgroundColor: 'rgb(255, 0, 0)',
        textColor: 'rgb(0, 0, 0)',
        accentColor: 'rgb(0, 255, 0)',
        accentTextColor: 'rgb(0, 0, 0)',
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
        accentTextColor: 'rgb(255, 255, 255)',
        backgroundColorRgb: '1, 1, 1',
        textColorRgb: '2, 2, 2',
        accentColorRgb: '3, 3, 3',
      };
      const fresh = {
        backgroundColor: 'rgb(9, 9, 9)',
        textColor: 'rgb(8, 8, 8)',
        accentColor: 'rgb(7, 7, 7)',
        accentTextColor: 'rgb(255, 255, 255)',
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

    it.each(['hypercolor', 'signalrgb'] as const)(
      'keeps newer %s state when the same cover finishes loading',
      async backend => {
        await stateManager.updateState();
        stateManager = new StateManager(
          { entity: 'light.test_light', backend } as Config,
          mockState
        );
        stateManager.hass = mockHass;

        let finishCover: (() => void) | undefined;
        const cover = new Promise<null>(resolve => {
          finishCover = () => resolve(null);
        });
        vi.spyOn(ColorManager.prototype, 'extractColors').mockReturnValue(cover);
        mockHass.states['light.test_light'].attributes.effect_image = 'http://a.test/slow.png';
        const pending = stateManager.updateState();

        mockHass.states['light.test_light'] = {
          ...mockHass.states['light.test_light'],
          state: 'off',
          attributes: {
            ...mockHass.states['light.test_light'].attributes,
            effect: 'Effect2',
            brightness: convertCardBrightnessToHA(20),
          },
        };
        await stateManager.updateState();
        expect(mockState.isOn).toBe(false);
        expect(mockState.brightness).toBe(20);
        expect(mockState.currentEffect).toBe('Effect2');

        finishCover?.();
        await pending;
        expect(mockState.isOn).toBe(false);
        expect(mockState.brightness).toBe(20);
        expect(mockState.currentEffect).toBe('Effect2');
      }
    );

    it('updates light state before the cover is available', async () => {
      await stateManager.updateState();
      let finishCover: (() => void) | undefined;
      const cover = new Promise<null>(resolve => {
        finishCover = () => resolve(null);
      });
      vi.spyOn(ColorManager.prototype, 'extractColors').mockReturnValue(cover);
      const light = mockHass.states['light.test_light'];
      light.state = 'off';
      light.attributes.effect = 'Effect2';
      light.attributes.brightness = convertCardBrightnessToHA(20);
      light.attributes.effect_image = 'http://a.test/slow.png';
      const pending = stateManager.updateState();

      expect(mockState.isOn).toBe(false);
      expect(mockState.currentEffect).toBe('Effect2');
      expect(mockState.brightness).toBe(20);
      finishCover?.();
      await pending;
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
    it('releases drag ownership when disconnected before pointer release', () => {
      stateManager.startBrightnessDrag();
      stateManager.cleanup();
      mockHass.states['light.test_light'].attributes.brightness = convertCardBrightnessToHA(20);
      stateManager.hass = mockHass;
      expect(mockState.brightness).toBe(20);
    });

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

  describe('live control failures', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.spyOn(console, 'error').mockImplementation(() => {});
      stateManager.cleanup();
      stateManager = new StateManager(
        {
          entity: 'light.test_light',
          backend: 'hypercolor',
        },
        mockState
      );
      Object.assign(mockHass, { entities: { 'light.test_light': { config_entry_id: 'entry' } } });
      stateManager.hass = mockHass;
    });

    it.each(['setLiveControl', 'setLiveControlImmediate'] as const)(
      'handles rejection and restores the current edit through %s',
      async method => {
        const restore = vi.fn();
        mockHass.callService.mockRejectedValueOnce(new Error('read-only scene'));
        stateManager[method]('speed', 59, restore);
        await vi.advanceTimersByTimeAsync(50);
        expect(mockHass.callService).toHaveBeenCalledExactlyOnceWith('hypercolor', 'set_control', {
          config_entry_id: 'entry',
          control_name: 'speed',
          value: 59,
        });
        expect(restore).toHaveBeenCalledOnce();
      }
    );

    it.each(['setLiveControl', 'setLiveControlImmediate'] as const)(
      'does not restore an old failure after a newer edit through %s',
      async method => {
        const oldRestore = vi.fn();
        const newRestore = vi.fn();
        let rejectOld: (error: Error) => void = () => {};
        mockHass.callService.mockImplementationOnce(
          () => new Promise((_resolve, reject) => (rejectOld = reject))
        );
        stateManager.setLiveControlImmediate('speed', 59, oldRestore);
        stateManager[method]('speed', 60, newRestore);
        rejectOld(new Error('old failure'));
        await vi.advanceTimersByTimeAsync(0);
        expect(oldRestore).not.toHaveBeenCalled();
        expect(newRestore).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(50);
        expect(mockHass.callService).toHaveBeenCalledTimes(2);
      }
    );

    it('keeps independent controls eligible for rollback', async () => {
      const restore = vi.fn();
      mockHass.callService.mockRejectedValueOnce(new Error('failure'));
      stateManager.setLiveControlImmediate('speed', 59, restore);
      stateManager.setLiveControlImmediate('scale', 20);
      await vi.advanceTimersByTimeAsync(0);
      expect(restore).toHaveBeenCalledOnce();
    });

    it('retires in-flight failure callbacks during cleanup', async () => {
      const restore = vi.fn();
      let rejectOld: (error: Error) => void = () => {};
      mockHass.callService.mockImplementationOnce(
        () => new Promise((_resolve, reject) => (rejectOld = reject))
      );
      stateManager.setLiveControlImmediate('speed', 59, restore);
      stateManager.cleanup();
      stateManager.setLiveControlImmediate('speed', 60);
      rejectOld(new Error('old failure'));
      await vi.advanceTimersByTimeAsync(0);
      expect(restore).not.toHaveBeenCalled();
    });

    it('cancels queued edits during cleanup', async () => {
      const restore = vi.fn();
      stateManager.setLiveControl('speed', 59, restore);
      stateManager.cleanup();
      await vi.advanceTimersByTimeAsync(50);
      expect(mockHass.callService).not.toHaveBeenCalled();
      expect(restore).not.toHaveBeenCalled();
    });
  });

  it.each([false, true])(
    'retires navigation work when cleanup runs (pending service: %s)',
    async pendingService => {
      vi.useFakeTimers();
      stateManager.cleanup();
      stateManager = new StateManager(
        { entity: 'light.test_light', next_effect_entity: 'button.next' },
        mockState
      );
      stateManager.hass = mockHass;
      let releaseService: (() => void) | undefined;
      if (pendingService) {
        mockHass.callService.mockImplementationOnce(
          () =>
            new Promise(resolve => {
              releaseService = () => resolve(undefined as never);
            })
        );
      }
      const navigation = stateManager.nextEffect();
      if (!pendingService) await navigation;
      stateManager.cleanup();
      mockState.currentEffect = 'Replacement';
      releaseService?.();
      await navigation;
      await vi.advanceTimersByTimeAsync(300);
      expect(mockState.currentEffect).toBe('Replacement');
    }
  );

  it.each([
    ['setCurrentEffect', 'isDropdownOpen'],
    ['setCurrentLayout', 'isLayoutDropdownOpen'],
    ['setCurrentPreset', 'isPresetDropdownOpen'],
    ['setScene', 'isSceneDropdownOpen'],
  ] as const)(
    'retired %s completion cannot close a replacement picker',
    async (method, openFlag) => {
      stateManager.cleanup();
      const config: Config = {
        entity: 'light.test_light',
        backend: 'hypercolor',
        layout_entity: 'select.layout',
        preset_entity: 'select.preset',
        hypercolor: { scene_entity: 'select.scene' },
      };
      stateManager = new StateManager(config, mockState);
      stateManager.hass = mockHass;
      let release: (() => void) | undefined;
      mockHass.callService.mockImplementationOnce(
        () =>
          new Promise(resolve => {
            release = () => resolve(undefined as never);
          })
      );
      const pending = stateManager[method]('Chosen');
      expect(mockHass.callService).toHaveBeenCalledTimes(1);
      stateManager.cleanup();
      stateManager = new StateManager(config, mockState);
      stateManager.hass = mockHass;
      mockState[openFlag] = true;
      release?.();
      await pending;
      expect(mockState[openFlag]).toBe(true);
    }
  );
});
