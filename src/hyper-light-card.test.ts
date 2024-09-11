import { HyperLightCard } from './hyper-light-card';
import { HomeAssistant } from 'custom-card-helpers';
import { Config } from './config';

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
          },
        },
      },
      callService: jest.fn(),
    } as unknown as jest.Mocked<HomeAssistant>;

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
    beforeEach(() => {
      // Spy on the card's internal StateManager methods
      jest.spyOn(card['stateManager'], 'setIsOn').mockImplementation();
      jest.spyOn(card['stateManager'], 'setCurrentEffect').mockImplementation();
      jest.spyOn(card['stateManager'], 'setBrightness').mockImplementation();
      jest.spyOn(card['stateManager'], 'setAccentColor').mockImplementation();

      card['stateManager'].setIsOn(true);
      card['stateManager'].setCurrentEffect('Test Effect');
      card['stateManager'].setBrightness(50);
      card['stateManager'].setAccentColor('#ff0000');
    });

    it('renders without errors', () => {
      const renderResult = card.render();
      expect(renderResult).toBeDefined();
    });

    // Add more specific tests for render output if needed
  });

  describe('_toggleLight', () => {
    it('calls the correct hass service to turn off the light when it is on', () => {
      jest.spyOn(card['stateManager'], 'setIsOn').mockImplementation();
      card['stateManager'].setIsOn(true);
      card['_toggleLight']();
      expect(mockHass.callService).toHaveBeenCalledWith('light', 'turn_off', {
        entity_id: 'light.test_light',
      });
      expect(card['stateManager'].setIsOn).toHaveBeenCalledWith(false);
    });

    it('calls the correct hass service to turn on the light when it is off', () => {
      jest.spyOn(card['stateManager'], 'setIsOn').mockImplementation();
      expect(card['stateManager'].isOn).toBe(true);
      card['stateManager'].toggleLight();
      expect(card['stateManager'].isOn).toBe(false);

      card['_toggleLight']();
      expect(mockHass.callService).toHaveBeenCalledWith('light', 'turn_on', {
        entity_id: 'light.test_light',
      });
      expect(card['stateManager'].setIsOn).toHaveBeenCalledWith(true);
    });
  });

  // Add more test cases for other methods and functionalities
});
