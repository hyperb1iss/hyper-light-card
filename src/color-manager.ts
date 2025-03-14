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

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = effectImage;
    img.alt = 'Effect image';

    return new Promise(resolve => {
      img.onload = () => {
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

          log.debug('ColorManager: New colors:', newBackgroundColor, newTextColor, newAccentColor);

          resolve({
            backgroundColor: newBackgroundColor,
            textColor: newTextColor,
            accentColor: newAccentColor,
          });
        } else {
          console.warn('ColorManager: Insufficient colors in palette', palette);
          resolve({
            backgroundColor: '',
            textColor: '',
            accentColor: '',
          });
        }
      };
    });
  }
}
