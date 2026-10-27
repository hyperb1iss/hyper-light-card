# Demo and screenshots

The screenshots and recording use the real Home Assistant frontend with
Hypercolor. The demo instance is named **Lumen Studio**, with **Desk**,
**Shelves**, and **Ceiling** zones and three saved scenes: **Focus**,
**After Hours**, and **Aurora Lounge**.

The card uses the same configuration as an installed dashboard:

```yaml
type: custom:hyper-light-card
entity: light.hypercolor_lumen_studio
backend: hypercolor
name: Lumen Studio
show_scene_select: true
show_live_controls: true
show_status_chips: true
show_zones: true
```

The [recording](https://github.com/hyperb1iss/hyper-light-card/releases/download/v1.2.0/hyper-light-card-demo.mp4)
demonstrates keyboard navigation in the effect picker, scene selection, live
parameter changes, and zone power. Screenshots also show the card at phone width.
The screenshots use card 1.2.1; the recording uses 1.2.0. Both use Home
Assistant 2026.9.4, integration 0.7.1, and Hypercolor 0.8.0. In 1.2.1, select
**Zones** to expand its controls before the zone-power step.
The phone screenshot uses a 390-pixel browser viewport;
physical touch-device testing is not part of this capture.
No physical lights are attached to the recording environment; card actions go
through real Home Assistant services to real daemon scene and effect state.

## Reproduce the setup

Use a disposable Home Assistant configuration and a separate Hypercolor daemon
with hardware discovery disabled. Install the integration, add the card using
the [development instructions](../CONTRIBUTING.md), and configure these scenes
in Hypercolor:

| Scene | Desk | Shelves | Ceiling |
| --- | --- | --- | --- |
| Focus | Hyperfocus | Gradient | Breathing |
| After Hours | Hyperbloom | Color Wave | Breathing |
| Aurora Lounge | Borealis | Gradient | Breathing |

Create editable scenes for the live-control steps. Snapshot scenes are locked;
the daemon rejects edits to their layer controls. Changes to an editable live
scene persist to that scene. Set the output brightness to 78% and the Desk zone
to 80%, then activate Aurora Lounge.

Use the entity registry to name the zone lights Desk, Shelves, and Ceiling.
The card discovers their relationships through the registry, so no manual
companion entity mapping is needed. Do not use a household instance for a
recording that changes power, scenes, or live parameters.

For fresh screenshots, build the production bundle, copy it into the disposable
instance, update its resource URL's version query, reload dashboard resources,
and refresh the browser. Wait for artwork and transitions to settle before
capturing. Preserve a full-resolution recording and publish a smaller web copy;
keep video masters out of the git repository.
