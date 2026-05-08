import ColorThief from 'colorthief';
import { getAccessibleTextColors, log } from './utils';

export class ColorManager {
  private _colorThief = new ColorThief();

  constructor() {
    log.debug('ColorManager: Constructor called');
  }

  async extractColors(effectImage: string): Promise<{
    backgroundColor: string;
    textColor: string;
    accentColor: string;
  }> {
    log.debug('ColorManager: extractColors called');
    if (!effectImage) {
      log.debug('ColorManager: No effect image provided');
      return {
        backgroundColor: '',
        textColor: '',
        accentColor: '',
      };
    }

    return new Promise(resolve => {
      const fallback = {
        backgroundColor: '',
        textColor: '',
        accentColor: '',
      };
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.alt = 'Effect image';

      img.onload = () => {
        try {
          const palette = this._colorThief.getPalette(img, 3);
          log.debug('ColorManager: Color palette extracted', palette);
          if (palette && palette.length >= 2) {
            log.debug('ColorManager: First palette item:', palette[0]);
            log.debug('ColorManager: First palette item type:', typeof palette[0]);

            const bgColorArray = Array.isArray(palette[0]) ? palette[0] : [0, 0, 0];
            const accentColorArray = Array.isArray(palette[1]) ? palette[1] : [0, 0, 0];

            const newBackgroundColor = `rgb(${bgColorArray.join(',')})`;
            const textColors = getAccessibleTextColors(bgColorArray);
            const newTextColor = `rgb(${textColors.join(',')})`;
            const newAccentColor = `rgb(${accentColorArray.join(',')})`;

            log.debug(
              'ColorManager: New colors:',
              newBackgroundColor,
              newTextColor,
              newAccentColor
            );

            resolve({
              backgroundColor: newBackgroundColor,
              textColor: newTextColor,
              accentColor: newAccentColor,
            });
            return;
          }

          log.warn('ColorManager: Insufficient colors in palette', palette);
        } catch (error) {
          log.warn('ColorManager: Failed to extract palette', error);
        }
        resolve(fallback);
      };

      img.onerror = () => {
        log.warn('ColorManager: Failed to load effect image', effectImage);
        resolve(fallback);
      };

      img.src = effectImage;
    });
  }
}
