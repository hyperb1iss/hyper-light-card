# 🌟 hyper-light-card for Home Assistant

<div align="center">

[![HACS Custom][hacs-shield]][hacs]
[![GitHub Release][releases-shield]][releases]
[![License][license-shield]](LICENSE)

_A dazzling custom card for controlling SignalRGB and Hypercolor lights through Home Assistant_

[Installation](#installation) • [Configuration](#configuration) • [Usage](#usage) • [Contributing](#contributing) • [License](#license)

</div>

## 🎮 Features

- 💅 Sleek, modern design that adapts to your effect's color palette
- 🎨 Dynamic color extraction with automatic UI theming
- 🔌 Auto-detects whether your light is a SignalRGB or Hypercolor entity
- 📱 Responsive layout for desktop and mobile, with native HA section sizing
- 🔀 Effect switching with an intelligent dropdown menu
- 📊 Layout and preset selection for SignalRGB
- 🎬 Scenes and profiles for Hypercolor, with live runtime controls
- 🛰️ Status chips for FPS, audio reactivity, and connectivity (Hypercolor)
- 🧩 Per-device drilldown for grouped Hypercolor installs
- ⏭️ Effect navigation controls (next, previous, random)
- 💡 Animated power toggle with color-aware feedback
- 🔆 Smooth brightness control slider
- ℹ️ Detailed effect information and parameters
- 🔧 Visual editor with backend-aware schema (powered by `ha-form`)

## 🌈 Screenshots

<table>
  <tr>
    <td><img src="images/dark_magic.png"/></td>
    <td><img src="images/sakura.png"/></td>
    <td><img src="images/rave_visualizer.png"/></td>
  </tr>
  <tr>
    <td><img src="images/poison_expanded.png"/></td>
    <td><img src="images/cyberpunk_2077_expanded.png"/></td>
    <td><img src="images/corrosive_expanded.png"/></td>
  </tr>
</table>

## 🛠️ Installation

<a name="installation"></a>

### Prerequisites

- Home Assistant 2024.2.0 or newer
- One of the following light integrations:
  - [SignalRGB Home Assistant Integration](https://github.com/hyperb1iss/signalrgb-homeassistant) (latest SignalRGB beta recommended for full functionality)
  - [Hypercolor Home Assistant Integration](https://github.com/hyperb1iss/hypercolor-hass)

### HACS Installation (Recommended)

1. Make sure you have [HACS](https://hacs.xyz/) installed in your Home Assistant instance.
2. Go to HACS → Frontend → "+ Explore & Download Repositories"
3. Search for "hyper-light-card" and add it.
4. Refresh your browser cache by holding down Ctrl and pressing F5.

NOTE: This component isn't in the official HACS repository yet. You can add it as a custom
repository for now- go to HACS, click on the 3 dots, click custom repositories, and enter
"hyperb1iss/hyper-light-card" for the repository and select "Lovelace" for the
category.

### Manual Installation

1. Download `hyper-light-card.js` from the [latest release](https://github.com/hyperb1iss/hyper-light-card/releases).
2. Copy it into your `config/www` directory.
3. Add the following to your `configuration.yaml`:

   ```yaml
   lovelace:
     resources:
       - url: /local/hyper-light-card.js
         type: module
   ```

4. Restart Home Assistant.

## ⚙️ Configuration

<a name="configuration"></a>

Add the card to your dashboard:

1. Edit your dashboard
2. Click "+ Add Card"
3. Search for "Hyper Light Card" in Custom Cards
4. Choose your light entity and configure options in the visual editor

The visual editor adapts to whichever backend the card detects. Override detection with the `backend` option if you ever need to.

### SignalRGB example

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

### Hypercolor example

```yaml
type: custom:hyper-light-card
entity: light.hypercolor_living_room
name: 'Living Room'
show_status_chips: true
show_live_controls: true
show_scene_select: true
show_profile_select: true
show_per_device: false
background_opacity: 0.7
```

When the entity belongs to a Hypercolor integration, scenes, profiles, live controls, and per-device
children are wired up automatically for standard entity names. Non-standard Hypercolor helper entity
IDs can be supplied in YAML under `hypercolor`:

```yaml
type: custom:hyper-light-card
entity: light.hypercolor_living_room
backend: hypercolor
hypercolor:
  scene_entity: select.hypercolor_scene
  profile_entity: select.hypercolor_profile
  stop_effect_entity: button.hypercolor_stop_effect
  fps_entity: sensor.hypercolor_fps
  connected_entity: binary_sensor.hypercolor_connected
  audio_beat_entity: binary_sensor.hypercolor_audio_beat
  audio_reactive_active_entity: binary_sensor.hypercolor_audio_reactive_active
  audio_energy_entity: sensor.hypercolor_audio_energy
  live_control_entities:
    speed: number.hypercolor_speed
    hue_shift: number.hypercolor_hue_shift
    intensity: number.hypercolor_intensity
  per_device_lights:
    - light.hypercolor_living_room_lamp_1
  per_device_identify_buttons:
    - button.hypercolor_identify_living_room_lamp_1
```

### Configuration Options

#### Shared

| Option                    | Type                       | Default                   | Description                                                                |
| ------------------------- | -------------------------- | ------------------------- | -------------------------------------------------------------------------- |
| `entity`                  | string                     | **Required**              | The entity_id of your SignalRGB or Hypercolor light                        |
| `backend`                 | `signalrgb` \| `hypercolor` | _auto-detected_           | Override backend detection. Leave unset unless detection picks the wrong one. |
| `name`                    | string                     | `friendly_name` of entity | Card title                                                                 |
| `icon`                    | string                     | backend default           | Icon to display (SignalRGB uses the brand icon URL; Hypercolor uses `mdi:led-strip-variant`) |
| `background_opacity`      | number                     | `0.7`                     | Opacity of the effect image background (0-1)                               |
| `show_effect_info`        | boolean                    | `true`                    | Show effect description and publisher                                      |
| `show_effect_parameters`  | boolean                    | `true`                    | Display effect parameters                                                  |
| `show_brightness_control` | boolean                    | `true`                    | Display brightness slider                                                  |
| `show_effect_controls`    | boolean                    | `true`                    | Show effect navigation (next, previous, random)                            |
| `show_layout_select`      | boolean                    | `true`                    | Show layout dropdown when a layout source is available                     |
| `show_preset_select`      | boolean                    | `true`                    | Show preset dropdown when a preset source is available                     |
| `allowed_effects`         | string[]                   | _all effects_             | Limit the effect dropdown. Empty means all available effects.              |

#### SignalRGB

| Option                   | Type   | Default     | Description                                        |
| ------------------------ | ------ | ----------- | -------------------------------------------------- |
| `layout_entity`          | string | _auto_      | Override the SignalRGB layout `select` entity      |
| `preset_entity`          | string | _auto_      | Override the SignalRGB preset `select` entity      |
| `next_effect_entity`     | string | _auto_      | Override the next-effect `button` entity           |
| `previous_effect_entity` | string | _auto_      | Override the previous-effect `button` entity       |
| `random_effect_entity`   | string | _auto_      | Override the random-effect `button` entity         |

These default to the device-scoped helpers exposed by the SignalRGB integration, so they're rarely needed.

#### Hypercolor

| Option                | Type    | Default | Description                                              |
| --------------------- | ------- | ------- | -------------------------------------------------------- |
| `show_scene_select`   | boolean | `true`  | Show the scene selector dropdown                         |
| `show_profile_select` | boolean | `false` | Show the profile selector dropdown                       |
| `show_live_controls`  | boolean | `true`  | Show live control sliders (intensity, speed, etc.)       |
| `show_status_chips`   | boolean | `true`  | Show FPS, audio reactivity, and connectivity chips       |
| `show_per_device`     | boolean | `false` | Show an expandable list of child lights below the card   |

## 🚀 Usage

<a name="usage"></a>

hyper-light-card adapts to whichever backend it detects:

- **Power Toggle**: Click the light icon to turn the light on or off.
- **Effect Selection**: Use the dropdown to choose from available effects.
- **Layout & Preset / Scene & Profile**: SignalRGB exposes layouts and presets; Hypercolor exposes scenes and (optionally) profiles.
- **Effect Navigation**: Cycle through effects with next, previous, and random buttons.
- **Brightness Control**: Adjust brightness with the slider.
- **Live Controls**: Drag Hypercolor's intensity, speed, and parameter sliders without flooding the bus — input is debounced and committed on release.
- **Status Chips**: Hypercolor surfaces FPS, audio reactivity, and connectivity at a glance.
- **Per-Device Drilldown**: Expand grouped Hypercolor installs to see and toggle each child light.
- **Effect Info & Parameters**: Description, publisher, and current parameter values for the running effect.

The card pulls its accent palette from the running effect image, giving each effect its own coherent look. Color contrast is verified with `chroma-js` so foreground text stays readable against any extracted background.

## 👩‍💻 Development

<a name="development"></a>

This project uses a modern toolchain:

- **[Bun](https://bun.com/)** as package manager and script runner
- **[Vite 8](https://vite.dev/) (Rolldown)** for production builds
- **[Vitest 4](https://vitest.dev/)** with V8 coverage for tests
- **[Biome 2](https://biomejs.dev/)** for linting plus JSON/CSS formatting
- **[Prettier 3](https://prettier.io/)** scoped to TS/JS (Lit `html` template formatting)
- **TypeScript 6** with strict mode and Lit's experimental decorators
- **[Lit 3](https://lit.dev/)** for reactive web components
- **ColorThief** for palette extraction, **Chroma.js** for contrast verification

### Getting Started

```bash
# Install dependencies
bun install

# Build + copy to your Home Assistant www folder
bun run dev

# Run the test suite
bun run test

# Lint, format, and typecheck
bun run lint
bun run format:check
bun run typecheck

# Production build
bun run build
```

`bun run dev` reads `config.js` for your Home Assistant config path and copies the built bundle into `<hass>/www/hyper-light-card/`. Refresh your dashboard to pick up changes.

### Releases

Tagging `vX.Y.Z` on `main` triggers the GitHub Actions workflow, which builds, runs the gates, and attaches the bundle to a GitHub release via [shared-workflows](https://github.com/hyperb1iss/shared-workflows). HACS picks it up automatically.

## 🤝 Contributing

<a name="contributing"></a>

Contributions are what make the open-source community such a fantastic place to learn, inspire, and create. Any contributions you make are **greatly appreciated**. Please see our [CONTRIBUTING.md](CONTRIBUTING.md) file for more details on how to get started.

## 📄 License

<a name="license"></a>

Distributed under the Apache License 2.0. See `LICENSE` for more information.

---

<div align="center">

📚 [Documentation](https://github.com/hyperb1iss/hyper-light-card/wiki) • 🐛 [Report Bug](https://github.com/hyperb1iss/hyper-light-card/issues) • 💡 [Request Feature](https://github.com/hyperb1iss/hyper-light-card/issues)

</div>

## 💖 Acknowledgements

- [SignalRGB](https://www.signalrgb.com/) for their amazing RGB control software
- [Hypercolor](https://github.com/hyperb1iss/hypercolor-hass) for the multi-light orchestration backend
- [Home Assistant](https://www.home-assistant.io/) for the incredible smart home platform
- [ColorThief](https://lokeshdhakar.com/projects/color-thief/) for color extraction capabilities
- [Lit](https://lit.dev/) for the powerful web components framework

---

<div align="center">

Created by [Stefanie Jane 🌠](https://github.com/hyperb1iss)

If you find this project useful, [buy me a Monster Ultra Violet!](https://ko-fi.com/hyperb1iss) ⚡️

</div>

[hacs-shield]: https://img.shields.io/badge/HACS-Custom-pink.svg?style=for-the-badge
[hacs]: https://github.com/custom-components/hacs
[releases-shield]: https://img.shields.io/github/release/hyperb1iss/hyper-light-card.svg?style=for-the-badge
[releases]: https://github.com/hyperb1iss/hyper-light-card/releases
[license-shield]: https://img.shields.io/github/license/hyperb1iss/hyper-light-card.svg?style=for-the-badge
