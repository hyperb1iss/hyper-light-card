export interface Config {
  entity: string;
  name?: string;
  icon?: string;
  background_opacity?: number;
  show_effect_info?: boolean;
  show_effect_parameters?: boolean;
  show_brightness_control?: boolean;
  allowed_effects?: string[];
  layout_entity?: string;
  preset_entity?: string;
  next_effect_entity?: string;
  previous_effect_entity?: string;
  random_effect_entity?: string;
  show_layout_select?: boolean;
  show_preset_select?: boolean;
  show_effect_controls?: boolean;
}
