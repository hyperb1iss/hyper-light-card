import { HyperLightCard } from '@/hyper-light-card';
import { HomeAssistant } from 'custom-card-helpers';
import { Config } from '@/config';
import { State } from '@/state';
import { ColorManager } from '@/color-manager';
import { convertCardBrightnessToHA } from '@/utils';

describe('HyperLightCard', () => {
  let card: HyperLightCard;
  let mockHass: jest.Mocked<HomeAssistant>;

  beforeEach(() => {
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
      callService: jest.fn().mockImplementation((domain, service, data) => {
        if (domain === 'light' && service === 'turn_off') {
          mockHass.states['light.test_light'].state = 'off';
        } else if (domain === 'light' && service === 'turn_on') {
          mockHass.states['light.test_light'].state = 'on';
          if (data.brightness !== undefined) {
            mockHass.states['light.test_light'].attributes.brightness =
              data.brightness;
          }
          if (data.effect !== undefined) {
            mockHass.states['light.test_light'].attributes.effect = data.effect;
          }
        }
      }),
    } as unknown as jest.Mocked<HomeAssistant>;

    // Mock the ColorManager's extractColors method
    jest.spyOn(ColorManager.prototype, 'extractColors').mockResolvedValue({
      backgroundColor: 'rgb(255, 0, 0)',
      textColor: 'rgb(0, 0, 0)',
      accentColor: 'rgb(0, 255, 0)',
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
    jest.clearAllMocks();
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
          icon: 'https://brands.home-assistant.io/_/signalrgb/icon.png',
          background_opacity: 0.7,
          show_effect_info: true,
          show_effect_parameters: true,
          show_brightness_control: true,
        }),
      );
    });
  });

  describe('render', () => {
    it('renders without errors', () => {
      const renderResult = card.render();
      expect(renderResult).toBeDefined();
    });

    // Add more specific tests for render output if needed
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

      const state = card['state'] as State;
      await card['_handleBrightnessChange'](event);
      expect(state.brightness).toBe(50);
      expect(mockHass.callService).toHaveBeenCalledWith('light', 'turn_on', {
        entity_id: 'light.test_light',
        brightness: convertCardBrightnessToHA(50), // 50 in 0-100 scale should be 129 in 0-255 scale
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
