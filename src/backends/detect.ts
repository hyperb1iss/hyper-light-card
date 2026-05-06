import type { HomeAssistant } from 'custom-card-helpers';
import type { Config } from '../config';
import { hypercolorBackend } from './hypercolor';
import { signalRgbBackend } from './signalrgb';
import type { BackendId, LightBackend } from './types';

const REGISTRY: Record<BackendId, LightBackend> = {
  signalrgb: signalRgbBackend,
  hypercolor: hypercolorBackend,
};

/**
 * Detect which backend owns a given entity. Resolution order:
 *
 * 1. `config.backend` explicit override (power-user escape hatch).
 * 2. Entity domain prefix: `light.signalrgb_*` / `light.hypercolor*`.
 * 3. Feature signature on attributes (`effect_image` ⇒ SignalRGB-shaped).
 * 4. Fallback to SignalRGB so existing dashboards do not regress.
 */
export function detectBackend(hass: HomeAssistant, config: Config): LightBackend {
  const override = (config as Config & { backend?: BackendId }).backend;
  if (override && REGISTRY[override]) {
    return REGISTRY[override];
  }

  const entityId = config.entity;
  if (entityId?.startsWith('light.signalrgb_')) return REGISTRY.signalrgb;
  if (entityId?.startsWith('light.hypercolor')) return REGISTRY.hypercolor;

  const stateObj = hass.states[entityId];
  if (stateObj?.attributes && 'effect_image' in stateObj.attributes) {
    return REGISTRY.signalrgb;
  }

  return REGISTRY.signalrgb;
}

export function backendById(id: BackendId): LightBackend {
  return REGISTRY[id];
}
