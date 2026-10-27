# Configuration reference

Use the visual editor for common options, or edit the card YAML directly.
Entity IDs below are examples; use the entities created by your integration.

## SignalRGB example

```yaml
type: custom:hyper-light-card
entity: light.signalrgb
name: 'All The RGBeez'
icon: mdi:led-strip-variant
show_effect_info: true
show_effect_parameters: true
show_brightness_control: true
background_opacity: 0.7
layout_entity: select.signalrgb_layout
preset_entity: select.signalrgb_preset
next_effect_entity: button.signalrgb_next_effect
previous_effect_entity: button.signalrgb_previous_effect
random_effect_entity: button.signalrgb_random_effect
show_layout_select: true
show_preset_select: true
show_effect_controls: true
allowed_effects:
  - 'Lava Lamp'
  - 'Bubbles'
  - 'Rave Visualizer'
```

## Hypercolor example

The Hypercolor integration namespaces each hub with the product and daemon
instance name. A daemon called `Hyperia` appears as **Hypercolor Hyperia** and
produces `light.hypercolor_hyperia` alongside
`select.hypercolor_hyperia_layout`, `button.hypercolor_hyperia_next_effect`,
and the rest of its hub entities:

```yaml
type: custom:hyper-light-card
entity: light.hypercolor_hyperia
name: 'Living Room'
show_status_chips: true
show_live_controls: true
show_scene_select: true
show_audio_controls: true
show_zones: true
show_per_device: false
background_opacity: 0.7
```

> Companion entities are auto-discovered through Home Assistant's device and
> entity registries. Hub controls, scene zones, and physical child devices stay
> attached to the correct Hypercolor instance even when their entity ids are
> renamed. Effect description, publisher, tags, and the full control set come
> from the master light's attributes, so the info panel and controls populate
> automatically.

Discovery fills in options you have not set. Pin Hypercolor-specific helpers
under `hypercolor`; layout, preset, and navigation overrides use top-level
keys (see the companion overrides table):

```yaml
type: custom:hyper-light-card
entity: light.hypercolor_hyperia
backend: hypercolor
hypercolor:
  scene_entity: select.hypercolor_hyperia_scene
  stop_effect_entity: button.hypercolor_hyperia_stop_effect
  fps_entity: sensor.hypercolor_hyperia_fps
  connected_entity: binary_sensor.hypercolor_hyperia_connected
  audio_beat_entity: binary_sensor.hypercolor_hyperia_audio_beat
  audio_reactive_active_entity: binary_sensor.hypercolor_hyperia_audio_reactive_active
  audio_energy_entity: sensor.hypercolor_hyperia_audio_energy
  audio_reactive_switch_entity: switch.hypercolor_hyperia_audio_reactive
  audio_device_entity: select.hypercolor_hyperia_audio_device
  live_control_entities:
    brightness: number.hypercolor_hyperia_brightness
    speed: number.hypercolor_hyperia_speed
    hue_shift: number.hypercolor_hyperia_hue_shift
    intensity: number.hypercolor_hyperia_intensity
  zone_lights:
    - light.hypercolor_hyperia_default_zone
  per_device_lights:
    - light.lamp_1
  per_device_identify_buttons:
    - button.lamp_1_identify
```

## Options

### Shared

| Option                    | Type                       | Default                   | Description                                                                |
| ------------------------- | -------------------------- | ------------------------- | -------------------------------------------------------------------------- |
| `entity`                  | string                     | **Required**              | The entity_id of your SignalRGB or Hypercolor light                        |
| `backend`                 | `signalrgb` \| `hypercolor` | _auto-detected_           | Override backend detection. Leave unset unless detection picks the wrong one. |
| `name`                    | string                     | `friendly_name` of entity | Card title                                                                 |
| `icon`                    | string                     | backend default           | Icon to display (SignalRGB uses the brand icon URL; Hypercolor uses the animated Hypercolor brand mark). Set any `mdi:` token or image URL to override. |
| `background_opacity`      | number                     | `0.7`                     | Opacity of the effect image background (0-1)                               |
| `show_effect_info`        | boolean                    | `true`                    | Show effect description and publisher                                      |
| `show_effect_parameters`  | boolean                    | `true`                    | Show the collapsible parameters panel, including layout, preset, scene, and live controls |
| `show_brightness_control` | boolean                    | `true`                    | Display brightness slider                                                  |
| `show_effect_controls`    | boolean                    | `true`                    | Show effect navigation (next, previous, random)                            |
| `show_layout_select`      | boolean                    | `true`                    | Show layout dropdown when a layout source is available                     |
| `show_preset_select`      | boolean                    | `true`                    | Show preset dropdown when a preset source is available                     |
| `allowed_effects`         | string[]                   | _all effects_             | Limit the effect dropdown. Empty means all available effects.              |

### Companion overrides (both backends)

| Option                   | Type   | Default     | Description                                        |
| ------------------------ | ------ | ----------- | -------------------------------------------------- |
| `layout_entity`          | string | _auto_      | Override the layout `select` entity      |
| `preset_entity`          | string | _auto_      | Override the preset `select` entity      |
| `next_effect_entity`     | string | _auto_      | Override the next-effect `button` entity           |
| `previous_effect_entity` | string | _auto_      | Override the previous-effect `button` entity       |
| `random_effect_entity`   | string | _auto_      | Override the random-effect `button` entity         |

Both backends discover these helpers from the selected integration instance.
Set an override only when automatic discovery does not find the intended entity.

### Hypercolor

| Option                | Type    | Default | Description                                              |
| --------------------- | ------- | ------- | -------------------------------------------------------- |
| `show_scene_select`   | boolean | `true`  | Show the scene selector dropdown                         |
| `show_live_controls`  | boolean | `true`  | Show numeric sliders, boolean switches, enum selectors, and read-only color swatches |
| `show_audio_controls` | boolean | `true`  | Show the audio-reactive toggle and input device selector (when present) |
| `show_zones`          | boolean | `true`  | Show the Zones disclosure (collapsed by default) for per-group brightness and power |
| `show_status_chips`   | boolean | `true`  | Show FPS, audio reactivity, and connectivity chips       |
| `show_per_device`     | boolean | `false` | Show child light brightness and Identify actions below the card   |

Selectors hide when their entity exposes no options. Hypercolor's preset list, for instance, is empty for
effects that have no saved presets, and the Preset dropdown simply won't appear
for those.

### Hypercolor helper entities

All of these live under the `hypercolor:` key and are auto-discovered from Home
Assistant's device and entity registries. Set one only when you need to override
discovery.

| Option                         | Type     | Description                                             |
| ------------------------------ | -------- | ------------------------------------------------------- |
| `scene_entity`                 | string   | Scene `select` entity                                   |
| `stop_effect_entity`           | string   | Stop-effect `button` entity                             |
| `fps_entity`                   | string   | Render-rate `sensor` for the FPS chip                   |
| `connected_entity`             | string   | Daemon connectivity `binary_sensor`                     |
| `audio_beat_entity`            | string   | Beat `binary_sensor`; drives the icon pulse             |
| `audio_reactive_active_entity` | string   | Audio-reactive `binary_sensor` for the status chip      |
| `audio_energy_entity`          | string   | Audio energy `sensor`                                   |
| `audio_reactive_switch_entity` | string   | Audio-reactive `switch` shown in the audio controls     |
| `audio_device_entity`          | string   | Audio input device `select`                             |
| `live_control_entities`        | map      | `brightness` / `speed` / `hue_shift` / `intensity` to `number` entities |
| `zone_lights`                  | string[] | Scene render-group lights backing the Zones section     |
| `per_device_lights`            | string[] | Child lights whose brightness is displayed               |
| `per_device_identify_buttons`  | string[] | Identify `button` entities matched to those children    |

