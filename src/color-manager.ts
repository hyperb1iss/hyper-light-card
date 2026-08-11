import ColorThief from 'colorthief';
import { getAccessibleTextColors, log } from './utils';

/**
 * A resolved color scheme derived from the active effect's cover art. Each
 * color ships alongside its bare `r, g, b` triplet so the stylesheet can build
 * `rgba()` values from the same palette instead of falling back to the
 * ambient Home Assistant theme.
 */
export interface Palette {
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  backgroundColorRgb: string;
  textColorRgb: string;
  accentColorRgb: string;
}

export class ColorManager {
  private _colorThief = new ColorThief();

  /**
   * Extract a palette from the effect's cover image.
   *
   * Returns `null` whenever the image cannot be read — missing URL, network
   * failure, or (most commonly) a cover served from the daemon's own origin
   * without CORS headers, which makes the canvas unreadable. `null` is
   * load-bearing: the caller must leave the CSS custom properties unset so the
   * stylesheet's Home Assistant theme fallbacks apply. Emitting empty strings
   * instead would set the properties to an empty value, which defeats every
   * `var(--x, fallback)` in the sheet and renders the card unstyled.
   */
  async extractColors(effectImage: string): Promise<Palette | null> {
    if (!effectImage) {
      log.debug('ColorManager: No effect image provided');
      return null;
    }

    return new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.alt = 'Effect image';

      img.onload = () => {
        try {
          const palette = this._colorThief.getPalette(img, 3);
          if (palette && palette.length >= 2 && Array.isArray(palette[0])) {
            const background = palette[0];
            const accent = Array.isArray(palette[1]) ? palette[1] : background;
            const text = getAccessibleTextColors(background);
            log.debug('ColorManager: Palette extracted', { background, accent, text });
            resolve({
              backgroundColor: rgb(background),
              textColor: rgb(text),
              accentColor: rgb(accent),
              backgroundColorRgb: triplet(background),
              textColorRgb: triplet(text),
              accentColorRgb: triplet(accent),
            });
            return;
          }
          log.warn('ColorManager: Insufficient colors in palette', palette);
        } catch (error) {
          // Cross-origin covers taint the canvas; getPalette throws here.
          log.warn('ColorManager: Failed to read palette, falling back to theme', error);
        }
        resolve(null);
      };

      img.onerror = () => {
        log.warn('ColorManager: Failed to load effect image, falling back to theme', effectImage);
        resolve(null);
      };

      img.src = effectImage;
    });
  }
}

function triplet(color: number[]): string {
  return color.join(', ');
}

function rgb(color: number[]): string {
  return `rgb(${triplet(color)})`;
}
