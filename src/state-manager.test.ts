// src/state-manager.test.ts
import { StateManager } from './state-manager';
import { State } from './state';
import { ColorManager } from './color-manager';
import { HomeAssistant } from 'custom-card-helpers';
import { Config } from './config';
import { convertCardBrightnessToHA } from './utils';

// Mock implementation of ReactiveControllerHost
class MockReactiveControllerHost {
  addController = jest.fn();
  requestUpdate = jest.fn();
  removeController = jest.fn();
  updateComplete: Promise<boolean> = Promise.resolve(true);
}

describe('StateManager', () => {
  let stateManager: StateManager;
  let mockHass: jest.Mocked<HomeAssistant>;
  let mockState: State;
  let mockHost: MockReactiveControllerHost;

  beforeEach(() => {
    mockHost = new MockReactiveControllerHost();
    mockState = new State(mockHost);

    stateManager = new StateManager(
      { entity: 'light.test_light' } as Config,
      mockState,
    );

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
      callService: jest.fn(),
    } as unknown as jest.Mocked<HomeAssistant>;

    stateManager.hass = mockHass;

    // Mock the ColorManager's extractColors method
    jest.spyOn(ColorManager.prototype, 'extractColors').mockResolvedValue({
      backgroundColor: 'rgb(255, 0, 0)',
      textColor: 'rgb(0, 0, 0)',
      accentColor: 'rgb(0, 255, 0)',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('initializes without errors', () => {
    expect(stateManager).toBeInstanceOf(StateManager);
  });

  describe('updateState', () => {
    it('updates the state correctly', async () => {
      await stateManager.updateState();

      expect(mockState.backgroundColor).toBe('rgb(255, 0, 0)');
      expect(mockState.textColor).toBe('rgb(0, 0, 0)');
      expect(mockState.accentColor).toBe('rgb(0, 255, 0)');
      expect(mockState.isOn).toBe(true);
      expect(mockState.currentEffect).toBe('Effect1');
      expect(mockState.brightness).toBe(50); // This is the expected brightness value in the card's scale
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
