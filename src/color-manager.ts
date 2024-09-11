// src/color-manager.ts
import ColorThief from 'colorthief';
import { getAccessibleTextColors, log } from './utils';

export class ColorManager {
  private _colorThief = new ColorThief();
  private _transitionInProgress = false;

  constructor() {
    log.debug('ColorManager: Constructor called');
  }

  async extractColors(effectImage: string): Promise<void> {
    log.debug('ColorManager: extractColors called');
    if (!effectImage) {
      log.debug('ColorManager: No effect image provided');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = effectImage;
    img.alt = 'Effect image';

    img.onload = () => {
      const palette = this._colorThief.getPalette(img, 3);
      log.debug('ColorManager: Color palette extracted', palette);
      if (palette && palette.length >= 2) {
        this._applyColorTransition(palette);
      } else {
        console.warn('ColorManager: Insufficient colors in palette', palette);
      }
    };
  }

  private async _applyColorTransition(palette: number[][]) {
    log.debug('ColorManager: _applyColorTransition called', palette);
    if (this._transitionInProgress) {
      log.debug('ColorManager: Color transition already in progress');
      return;
    }
    this._transitionInProgress = true;

    const newBackgroundColor = `rgb(${palette[0].join(',')})`;
    const textColors = getAccessibleTextColors(palette[0]);
    const newTextColor = `rgb(${textColors.join(',')})`;
    const newAccentColor = `rgb(${palette[1].join(',')})`;

    log.debug(
      'ColorManager: New colors:',
      newBackgroundColor,
      newTextColor,
      newAccentColor,
    );

    await new Promise(resolve => {
      requestAnimationFrame(() => {
        this.applyColors({
          backgroundColor: newBackgroundColor,
          textColor: newTextColor,
          accentColor: newAccentColor,
        });
        resolve(null);
      });
    });

    this._transitionInProgress = false;
  }

  applyColors(colors: {
    backgroundColor: string;
    textColor: string;
    accentColor: string;
  }) {
    const { backgroundColor, textColor, accentColor } = colors;
    document.documentElement.style.setProperty('--background-color', backgroundColor);
    document.documentElement.style.setProperty('--text-color', textColor);
    document.documentElement.style.setProperty('--accent-color', accentColor);
    document.documentElement.style.setProperty('--switch-checked-color', accentColor);
    document.documentElement.style.setProperty('--switch-checked-button-color', accentColor);
    document.documentElement.style.setProperty('--switch-checked-track-color', accentColor);
  }
}