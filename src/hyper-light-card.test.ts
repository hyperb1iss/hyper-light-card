import { HyperLightCard, Hass, Config } from './hyper-light-card';

describe('HyperLightCard', () => {
  let card: HyperLightCard;

  beforeEach(() => {
    // Create an instance of the component and attach it to the DOM
    card = document.createElement('hyper-light-card') as HyperLightCard;
    document.body.appendChild(card); // Append the card to the document body

    // Mock the hass object with necessary state
    card.hass = {
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
      callService: jest.fn(), // Mock the callService function
    } as unknown as Hass;

    // Set up the required config property
    card.setConfig({ entity: 'light.test_light' });

    // Force an initial render to ensure everything is set up
    card.requestUpdate();
  });

  afterEach(() => {
    // Clean up after each test
    document.body.removeChild(card);
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
      // Additional setup if necessary before each render test
    });

    it('renders without errors', () => {
      const renderResult = card.render();
      expect(renderResult).toBeDefined();
    });

    // Add more specific tests for render output if needed
  });

  describe('_toggleLight', () => {
    beforeEach(() => {
      card.setConfig({ entity: 'light.test_light' });
      card['hass'] = {
        states: {
          'light.test_light': {
            entity_id: 'light.test_light',
            state: 'on', // Initial state in HASS
            attributes: {
              friendly_name: 'Test Light',
              effect_list: ['Effect1', 'Effect2'],
            },
          },
        },
        callService: jest.fn(),
      } as unknown as Hass;

      // Set the initial internal state
      card['_isOn'] = true; // Light is initially on
    });

    it('calls the correct hass service to turn off the light when it is on', () => {
      card['_toggleLight']();
      expect(card['hass']!.callService).toHaveBeenCalledWith(
        'light',
        'turn_off',
        {
          entity_id: 'light.test_light',
        },
      );
      expect(card['_isOn']).toBe(false); // Check that internal state is updated
    });

    it('calls the correct hass service to turn on the light when it is off', () => {
      // Simulate the light being off by updating the internal state
      card['_isOn'] = false; // Internal state set to off
      card['_toggleLight']();
      expect(card['hass']!.callService).toHaveBeenCalledWith(
        'light',
        'turn_on',
        {
          entity_id: 'light.test_light',
        },
      );
      expect(card['_isOn']).toBe(true); // Check that internal state is updated
    });
  });

  // Add more test cases for other methods and functionalities
});
