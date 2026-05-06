import type { HomeAssistant } from 'custom-card-helpers';
import type { HassEntity } from 'home-assistant-js-websocket';
import type { Config } from '../config';

/**
 * Identifier for a concrete backend. Used for detection cache keys, config
 * `backend` overrides, and telemetry.
 */
export type BackendId = 'signalrgb' | 'hypercolor';

export interface BackendContext {
  hass: HomeAssistant;
  config: Config;
}

export interface CardModel {
  /** Display name for the card header. */
  name: string;
  /** Icon URI or `mdi:` token. */
  icon: string;
  /** Whether the underlying light is currently on. */
  isOn: boolean;
  /** 1-100 brightness, after HA-to-card conversion. */
  brightness: number;
  /** Source URL for the palette extractor; null if backend has no image. */
  paletteSource: string | null;
}

export interface EffectModel {
  /** Effect display name; e.g. `Lava Lamp`. */
  name: string;
  /** Long-form description; empty string when unknown. */
  description: string;
  /** Publisher/author label; empty string when unknown. */
  publisher: string;
  /** Effect uses the system audio for reactivity. */
  usesAudio: boolean;
  /** Effect responds to keyboard/mouse/gamepad input. */
  usesInput: boolean;
  /** Effect renders video content. */
  usesVideo: boolean;
  /**
   * Effect-static parameters keyed by display label. Live-tweakable controls
   * live on `LiveControlModel[]` instead.
   */
  parameters: Record<string, EffectParameter>;
}

export type EffectParameter =
  | string
  | { label: string; type: string; value: string | number | boolean };

export interface EffectListModel {
  /** Currently active effect name (matches EffectModel.name). */
  current: string;
  /** All effect names the backend can switch to. */
  all: string[];
  /** Subset filtered by user `allowed_effects`, never null. */
  allowed: string[];
}

export interface SelectModel {
  /** Currently active option name. */
  current: string;
  /** All available options. */
  options: string[];
  /** Whether the underlying entity is reachable. */
  available: boolean;
}

export interface NavigationModel {
  hasNext: boolean;
  hasPrevious: boolean;
  hasRandom: boolean;
  hasStop: boolean;
}

export interface LiveControlModel {
  /** Stable id used by `setLiveControl`. */
  id: string;
  /** Human-readable label, e.g. "Speed". */
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  available: boolean;
}

export interface ConnectivityModel {
  connected: boolean;
}

export interface AudioModel {
  beat: boolean;
  energy: number | null;
  reactiveActive: boolean;
}

export interface DeviceModel {
  id: string;
  name: string;
  brightness: number | null;
  enabled: boolean;
  identifyEntity: string | null;
}

/**
 * A LightBackend hides the entity-shape differences between integrations
 * (SignalRGB, Hypercolor, future ones) behind view models. Render code
 * consumes the view models and never reads `stateObj.attributes` directly.
 *
 * Optional methods (`scenes`, `profiles`, `liveControls`, etc.) signal that
 * the backend exposes a richer surface; the card gates UI accordingly.
 */
export interface LightBackend {
  readonly id: BackendId;
  readonly displayName: string;

  describeCard(ctx: BackendContext): CardModel;
  describeEffect(ctx: BackendContext, stateObj: HassEntity): EffectModel;
  effectList(ctx: BackendContext, stateObj: HassEntity): EffectListModel;

  layouts(ctx: BackendContext): SelectModel | null;
  presets(ctx: BackendContext): SelectModel | null;
  scenes?(ctx: BackendContext): SelectModel | null;
  profiles?(ctx: BackendContext): SelectModel | null;

  navigation(ctx: BackendContext): NavigationModel;
  liveControls?(ctx: BackendContext): LiveControlModel[];
  connectivity?(ctx: BackendContext): ConnectivityModel | null;
  fps?(ctx: BackendContext): number | null;
  audio?(ctx: BackendContext): AudioModel | null;
  perDevice?(ctx: BackendContext): DeviceModel[];

  togglePower(ctx: BackendContext, on: boolean): Promise<void>;
  setBrightness(ctx: BackendContext, value: number): Promise<void>;
  setEffect(ctx: BackendContext, effect: string): Promise<void>;
  setLayout(ctx: BackendContext, value: string): Promise<void>;
  setPreset(ctx: BackendContext, value: string): Promise<void>;
  setScene?(ctx: BackendContext, value: string): Promise<void>;
  setProfile?(ctx: BackendContext, value: string): Promise<void>;
  setLiveControl?(ctx: BackendContext, id: string, value: number): Promise<void>;
  pressNavigation(
    ctx: BackendContext,
    action: 'next' | 'previous' | 'random' | 'stop'
  ): Promise<void>;

  /** Auto-discover related entities and return config patches. */
  autoDiscover?(ctx: BackendContext): Partial<Config>;
  /** Return a default Config for the visual card picker. */
  stubConfig?(hass: HomeAssistant, entities: string[]): Config | null;
}
