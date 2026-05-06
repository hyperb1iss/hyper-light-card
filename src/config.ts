export interface Config {
  entity: string;
  name?: string;
  icon?: string;
  background_opacity?: number;
  /** Optional override; bypasses auto-detection. */
  backend?: 'signalrgb' | 'hypercolor';
  show_effect_info?: boolean;
  show_effect_parameters?: boolean;
  show_brightness_control?: boolean;
  allowed_effects?: string[];

  /** SignalRGB-style external entities. */
  layout_entity?: string;
  preset_entity?: string;
  next_effect_entity?: string;
  previous_effect_entity?: string;
  random_effect_entity?: string;

  show_layout_select?: boolean;
  show_preset_select?: boolean;
  show_effect_controls?: boolean;

  /** Hypercolor-only feature toggles (Phase 4). */
  show_scene_select?: boolean;
  show_profile_select?: boolean;
  show_live_controls?: boolean;
  show_status_chips?: boolean;
  show_per_device?: boolean;
}
