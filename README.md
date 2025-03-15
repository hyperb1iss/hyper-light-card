# 🌟 hyper-light-card for Home Assistant

<div align="center">

[![HACS Custom][hacs-shield]][hacs]
[![GitHub Release][releases-shield]][releases]
[![License][license-shield]](LICENSE)

_A dazzling custom card for controlling SignalRGB through Home Assistant_

[Installation](#installation) • [Configuration](#configuration) • [Usage](#usage) • [Contributing](#contributing) • [License](#license)

</div>

## 🎮 Features

- 💅 Sleek, modern design that adapts to your SignalRGB effects
- 🎨 Dynamic color palette extraction from your running effects
- 🌈 Automatic UI theming based on the current effect colors
- 📱 Responsive layout for both desktop and mobile
- 🔀 Easy effect switching with an intelligent dropdown menu
- 📊 Layout and preset selection support
- ⏭️ Effect navigation controls (next, previous, random)
- 💡 Intuitive on/off toggle with animated feedback
- 🔆 Smooth brightness control slider
- ℹ️ Detailed effect information display
- 🔧 Comprehensive customization options
- 🎛️ Effect parameter display

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
- [SignalRGB Home Assistant Integration](https://github.com/hyperb1iss/signalrgb-homeassistant) (Required)
- Latest SignalRGB Beta version (Required for full functionality)

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
4. Choose your SignalRGB entity and configure options in the visual editor

Or add it manually to your Lovelace configuration:

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

### Configuration Options

| Option                    | Type     | Default                   | Description                                                                     |
| ------------------------- | -------- | ------------------------- | ------------------------------------------------------------------------------- |
| `entity`                  | string   | **Required**              | The entity_id of your SignalRGB light                                           |
| `name`                    | string   | `friendly_name` of entity | Card title                                                                      |
| `icon`                    | string   | `mdi:led-strip-variant`   | Icon to display                                                                 |
| `show_effect_info`        | boolean  | `true`                    | Show effect description and publisher                                           |
| `show_effect_parameters`  | boolean  | `true`                    | Display effect parameters                                                       |
| `show_brightness_control` | boolean  | `true`                    | Display brightness slider                                                       |
| `background_opacity`      | number   | `0.7`                     | Opacity of the effect image background (0-1)                                    |
| `layout_entity`           | string   | `undefined`               | ID of a select entity for controlling layouts                                   |
| `preset_entity`           | string   | `undefined`               | ID of a select entity for controlling presets                                   |
| `next_effect_entity`      | string   | `undefined`               | ID of a button entity to switch to next effect                                  |
| `previous_effect_entity`  | string   | `undefined`               | ID of a button entity to switch to previous effect                              |
| `random_effect_entity`    | string   | `undefined`               | ID of a button entity to pick a random effect                                   |
| `show_layout_select`      | boolean  | `true`                    | Show layout selection dropdown (if layout_entity defined)                       |
| `show_preset_select`      | boolean  | `true`                    | Show preset selection dropdown (if preset_entity defined)                       |
| `show_effect_controls`    | boolean  | `true`                    | Show effect navigation controls                                                 |
| `allowed_effects`         | string[] | `undefined`               | List of effects to show in the dropdown. If not set, all effects will be shown. |

## 🚀 Usage

<a name="usage"></a>

hyper-light-card provides an intuitive interface for controlling your SignalRGB setup:

- **Power Toggle**: Click the light icon to turn your SignalRGB setup on or off.
- **Effect Selection**: Use the dropdown to choose from available effects.
- **Layout & Preset Selection**: Select layouts and presets from their respective dropdowns.
- **Effect Navigation**: Use the next, previous, and random buttons to quickly cycle through effects.
- **Brightness Control**: Adjust the brightness using the slider.
- **Effect Info**: View the current effect's description and publisher.
- **Effect Parameters**: See detailed parameters for the current effect.

The card dynamically adapts its color scheme based on the current effect, creating a cohesive and stylish look for your dashboard. The ColorThief integration automatically extracts colors from your effect images to theme the UI elements.

## 👩‍💻 Development

<a name="development"></a>

This project uses a modern TypeScript toolchain for development:

- **TypeScript**: Type-safe JavaScript
- **Lit**: Lightweight reactive web components
- **Vite**: Modern build tool with fast HMR
- **ColorThief**: For color palette extraction
- **Chroma.js**: For color manipulation and contrast verification

### Getting Started

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm start

# Run tests
npm test

# Build for production
npm run build
```

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
