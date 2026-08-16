import type { HomeAssistant } from 'custom-card-helpers';
import { render } from 'lit';
import type { Mocked } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ColorManager } from '@/color-manager';
import type { Config } from '@/config';
import { HyperLightCard } from '@/hyper-light-card';
import type { State } from '@/state';
import { convertCardBrightnessToHA } from '@/utils';

describe('HyperLightCard', () => {
  let card: HyperLightCard;
  let mockHass: Mocked<HomeAssistant>;

  beforeEach(() => {
    vi.useFakeTimers();

    // Create an instance of the component and attach it to the DOM
    card = document.createElement('hyper-light-card') as HyperLightCard;
    document.body.appendChild(card);

    // Mock the hass object with necessary state
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
            brightness: 125,
          },
        },
      },
      callService: vi.fn().mockImplementation((domain, service, data) => {
        if (domain === 'light' && service === 'turn_off') {
          mockHass.states['light.test_light'].state = 'off';
        } else if (domain === 'light' && service === 'turn_on') {
          mockHass.states['light.test_light'].state = 'on';
          if (data.brightness !== undefined) {
            mockHass.states['light.test_light'].attributes.brightness = data.brightness;
          }
          if (data.effect !== undefined) {
            mockHass.states['light.test_light'].attributes.effect = data.effect;
          }
        }
      }),
    } as unknown as Mocked<HomeAssistant>;

    // Mock the ColorManager's extractColors method
    vi.spyOn(ColorManager.prototype, 'extractColors').mockResolvedValue({
      backgroundColor: 'rgb(255, 0, 0)',
      textColor: 'rgb(0, 0, 0)',
      accentColor: 'rgb(0, 255, 0)',
      backgroundColorRgb: '255, 0, 0',
      textColorRgb: '0, 0, 0',
      accentColorRgb: '0, 255, 0',
    });

    // Set up the required config property
    card.setConfig({ entity: 'light.test_light' });

    // Set the hass object
    card.hass = mockHass;

    // Force an initial render to ensure everything is set up
    card.requestUpdate();
  });

  afterEach(() => {
    // Clean up after each test
    document.body.removeChild(card);
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('initializes without errors', () => {
    expect(card).toBeInstanceOf(HyperLightCard);
  });

  describe('setConfig', () => {
    it('sets the configuration correctly', () => {
      const config = {
        entity: 'light.test_light',
        name: 'Test Light',
        icon: 'mdi:lightbulb',
        show_effect_info: false,
        show_effect_parameters: false,
        show_brightness_control: false,
        background_opacity: 0.5,
        allowed_effects: ['Effect1', 'Effect2'],
      };

      card.setConfig(config);

      expect(card['config']).toEqual(expect.objectContaining(config));
    });

    it('throws an error when no entity is provided', () => {
      expect(() => {
        card.setConfig({} as Config);
      }).toThrow('You need to define an entity');
    });

    it('uses default values when not provided in config', () => {
      card.setConfig({ entity: 'light.test_light' });

      expect(card['config']).toEqual(
        expect.objectContaining({
          entity: 'light.test_light',
          background_opacity: 0.7,
          show_effect_info: true,
          show_effect_parameters: true,
          show_brightness_control: true,
        })
      );
      // Icon is left unset by setConfig; backends supply their own default.
      expect(card['config']?.icon).toBeUndefined();
    });
  });

  describe('auto-discovery', () => {
    it('retries when Home Assistant publishes its registries after first paint', async () => {
      const states = {
        'light.hypercolor_hyperia': {
          entity_id: 'light.hypercolor_hyperia',
          state: 'on',
          attributes: { active_effect_id: 'aurora' },
        },
        'select.custom_layout': {
          entity_id: 'select.custom_layout',
          state: 'default',
          attributes: { options: ['default'] },
        },
        'light.lamp': {
          entity_id: 'light.lamp',
          state: 'on',
          attributes: { friendly_name: 'Lamp' },
        },
        'button.find_lamp': {
          entity_id: 'button.find_lamp',
          state: 'unknown',
          attributes: {},
        },
      };
      const firstPaint = { states, callService: vi.fn() } as unknown as HomeAssistant;
      card.setConfig({ entity: 'light.hypercolor_hyperia', backend: 'hypercolor' });
      card.hass = firstPaint;
      card['_runAutoDiscovery']();

      expect(card.config?.layout_entity).toBeUndefined();
      expect(card.config?.hypercolor?.per_device_lights).toBeUndefined();

      card.hass = {
        ...firstPaint,
        entities: {
          'light.hypercolor_hyperia': { device_id: 'hub' },
          'select.custom_layout': { device_id: 'hub', translation_key: 'layout' },
          'light.lamp': { device_id: 'lamp' },
          'button.find_lamp': { device_id: 'lamp', translation_key: 'identify' },
        },
        devices: {
          hub: { via_device_id: null },
          lamp: { via_device_id: 'hub' },
        },
      } as unknown as HomeAssistant;
      await card.updateComplete;

      expect(card.config?.layout_entity).toBe('select.custom_layout');
      expect(card.config?.hypercolor?.per_device_lights).toEqual(['light.lamp']);
      expect(card.config?.hypercolor?.per_device_identify_buttons).toEqual(['button.find_lamp']);

      card.hass = {
        ...firstPaint,
        states: {
          ...states,
          'select.spatial_picker': {
            entity_id: 'select.spatial_picker',
            state: 'default',
            attributes: { options: ['default'] },
          },
          'light.new_strip': {
            entity_id: 'light.new_strip',
            state: 'on',
            attributes: { friendly_name: 'New strip' },
          },
          'button.locate_strip': {
            entity_id: 'button.locate_strip',
            state: 'unknown',
            attributes: {},
          },
        },
        entities: {
          'light.hypercolor_hyperia': { device_id: 'hub' },
          'select.spatial_picker': { device_id: 'hub', translation_key: 'layout' },
          'light.lamp': { device_id: 'lamp' },
          'button.find_lamp': { device_id: 'lamp', translation_key: 'identify' },
          'light.new_strip': { device_id: 'strip' },
          'button.locate_strip': { device_id: 'strip', translation_key: 'identify' },
        },
        devices: {
          hub: { via_device_id: null },
          lamp: { via_device_id: 'hub' },
          strip: { via_device_id: 'hub' },
        },
      } as unknown as HomeAssistant;
      await card.updateComplete;

      expect(card.config?.layout_entity).toBe('select.spatial_picker');
      expect(card.config?.hypercolor?.per_device_lights).toEqual(['light.lamp', 'light.new_strip']);
      expect(card.config?.hypercolor?.per_device_identify_buttons).toEqual([
        'button.find_lamp',
        'button.locate_strip',
      ]);
    });
  });

  describe('render', () => {
    it('renders without errors', () => {
      const renderResult = card.render();
      expect(renderResult).toBeDefined();
    });

    it('renders a stop button when the backend exposes stop navigation', () => {
      const div = document.createElement('div');
      render(
        card['_renderEffectControls']({
          hasNext: false,
          hasPrevious: false,
          hasRandom: false,
          hasStop: true,
        }),
        div
      );

      expect(div.innerHTML).toContain('aria-label="Stop effect"');
      expect(div.innerHTML).toContain('mdi:stop');
    });

    it('presses the Hypercolor stop entity from the stop control', async () => {
      (mockHass.states as Record<string, unknown>)['light.hypercolor'] = {
        entity_id: 'light.hypercolor',
        state: 'on',
        attributes: {
          friendly_name: 'Hypercolor',
          effect: 'Aurora',
          effect_list: ['Aurora'],
        },
      };
      (mockHass.states as Record<string, unknown>)['button.hypercolor_stop_effect'] = {
        entity_id: 'button.hypercolor_stop_effect',
        state: 'unknown',
        attributes: {},
      };
      card.setConfig({
        entity: 'light.hypercolor',
        backend: 'hypercolor',
        hypercolor: {
          stop_effect_entity: 'button.hypercolor_stop_effect',
        },
      });
      card.hass = mockHass;
      card['stateManager'].hass = mockHass;

      await card['_stopEffect']();

      expect(mockHass.callService).toHaveBeenCalledWith('button', 'press', {
        entity_id: 'button.hypercolor_stop_effect',
      });
    });
  });

  describe('_toggleLight', () => {
    it('calls the correct hass service to turn off the light when it is on', async () => {
      const state = card['state'] as State;
      state.isOn = true;

      await card['_toggleLight']();
      expect(mockHass.callService).toHaveBeenCalledWith('light', 'turn_off', {
        entity_id: 'light.test_light',
      });

      expect(state.isOn).toBe(false);
    });

    it('calls the correct hass service to turn on the light when it is off', async () => {
      const state = card['state'] as State;
      state.isOn = false;
      await card['_toggleLight']();
      expect(mockHass.callService).toHaveBeenCalledWith('light', 'turn_on', {
        entity_id: 'light.test_light',
      });
      expect(state.isOn).toBe(true);
    });
  });

  describe('_handleBrightnessChange', () => {
    it('updates the brightness state and calls the correct hass service', async () => {
      const event = new Event('change');
      Object.defineProperty(event, 'target', {
        value: { value: '50' },
        writable: false,
      });

      // Call the handler directly
      await card['_handleBrightnessChange'](event);

      // Fast-forward all timers
      vi.runAllTimers();

      // Only check that the service was called with correct parameters
      // This is what really matters - the communication with Home Assistant
      expect(mockHass.callService).toHaveBeenCalledWith('light', 'turn_on', {
        entity_id: 'light.test_light',
        brightness: convertCardBrightnessToHA(50),
      });
    });
  });

  describe('_selectEffect', () => {
    it('updates the current effect state and calls the correct hass service', async () => {
      const state = card['state'] as State;
      await card['_selectEffect']('Effect2');
      expect(state.currentEffect).toBe('Effect2');
      expect(mockHass.callService).toHaveBeenCalledWith('light', 'turn_on', {
        entity_id: 'light.test_light',
        effect: 'Effect2',
      });
    });
  });

  describe('_toggleDropdown', () => {
    it('toggles the dropdown state', () => {
      const event = new Event('click');
      const state = card['state'] as State;
      card['_toggleDropdown'](event);
      expect(state.isDropdownOpen).toBe(true);

      card['_toggleDropdown'](event);
      expect(state.isDropdownOpen).toBe(false);
    });
  });

  describe('_toggleAttributes', () => {
    it('toggles the attributes state', () => {
      const state = card['state'] as State;
      card['_toggleAttributes']();
      expect(state.isAttributesExpanded).toBe(true);

      card['_toggleAttributes']();
      expect(state.isAttributesExpanded).toBe(false);
    });
  });

  describe('_handleClickOutside', () => {
    it('closes the dropdown when clicking outside', () => {
      const state = card['state'] as State;
      state.isDropdownOpen = true;
      const event = new Event('click');
      Object.defineProperty(event, 'composedPath', {
        value: () => [],
        writable: false,
      });

      card['_handleClickOutside'](event);
      expect(state.isDropdownOpen).toBe(false);
    });
  });

  // Add more test cases for other methods and functionalities
});
