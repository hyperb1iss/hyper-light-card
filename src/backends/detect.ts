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
 * Attributes only Hypercolor's light entity publishes. The integration names
 * entities after the daemon instance (`light.hyperia`, not
 * `light.hypercolor_*`), so an entity-id prefix alone cannot identify it and
 * these are the reliable signature.
 */
const HYPERCOLOR_ATTRIBUTES = ['effect_controls', 'active_effect_id', 'zone_count'] as const;

/**
 * Detect which backend owns a given entity. Resolution order:
 *
 * 1. `config.backend` explicit override (power-user escape hatch).
 * 2. Entity id prefix, when the install happens to use the default naming.
 * 3. Feature signature on attributes.
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

  const attributes = hass.states[entityId]?.attributes;
  if (attributes && HYPERCOLOR_ATTRIBUTES.some(key => key in attributes)) {
    return REGISTRY.hypercolor;
  }

  return REGISTRY.signalrgb;
}

export function backendById(id: BackendId): LightBackend {
  return REGISTRY[id];
}
