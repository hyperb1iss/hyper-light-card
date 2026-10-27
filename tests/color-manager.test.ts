import chroma from 'chroma-js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ColorManager } from '@/color-manager';

describe('ColorManager', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null when the effect image fails to load', async () => {
    vi.stubGlobal(
      'Image',
      class FailingImage {
        onerror: (() => void) | null = null;
        crossOrigin = '';
        alt = '';

        set src(_value: string) {
          queueMicrotask(() => this.onerror?.());
        }
      }
    );

    await expect(
      new ColorManager().extractColors('http://example.test/missing.png')
    ).resolves.toBeNull();
  });

  it('returns null when palette extraction throws on a tainted canvas', async () => {
    vi.stubGlobal(
      'Image',
      class LoadingImage {
        onload: (() => void) | null = null;
        crossOrigin = '';
        alt = '';

        set src(_value: string) {
          queueMicrotask(() => this.onload?.());
        }
      }
    );

    const manager = new ColorManager();
    manager['_colorThief'] = {
      getColor: () => [0, 0, 0],
      getPalette: () => {
        throw new Error('SecurityError: tainted canvas');
      },
    };

    await expect(manager.extractColors('http://example.test/broken.png')).resolves.toBeNull();
  });

  it('returns null for an empty image url', async () => {
    await expect(new ColorManager().extractColors('')).resolves.toBeNull();
  });

  it.each([
    { accent: [55, 28, 58], foreground: 'rgb(255, 255, 255)' },
    { accent: [240, 210, 70], foreground: 'rgb(0, 0, 0)' },
  ])('derives a readable foreground for accent $accent', async ({ accent, foreground }) => {
    vi.stubGlobal(
      'Image',
      class LoadingImage {
        onload: (() => void) | null = null;
        set src(_value: string) {
          queueMicrotask(() => this.onload?.());
        }
      }
    );
    const manager = new ColorManager();
    manager['_colorThief'] = {
      getColor: () => [12, 8, 20],
      getPalette: () => [[12, 8, 20], accent],
    };
    const palette = await manager.extractColors('http://example.test/accent.png');
    expect(palette?.accentTextColor).toBe(foreground);
    if (!palette) throw new Error('Expected an extracted palette');
    expect(chroma.contrast(palette.accentColor, palette.accentTextColor)).toBeGreaterThanOrEqual(
      4.5
    );
    if (foreground === 'rgb(255, 255, 255)') {
      expect(chroma.contrast(palette.accentColor, palette.backgroundColor)).toBeLessThan(3);
    }
  });

  it('derives colors and their rgb triplets from the extracted palette', async () => {
    vi.stubGlobal(
      'Image',
      class LoadingImage {
        onload: (() => void) | null = null;
        crossOrigin = '';
        alt = '';

        set src(_value: string) {
          queueMicrotask(() => this.onload?.());
        }
      }
    );

    const manager = new ColorManager();
    manager['_colorThief'] = {
      getColor: () => [10, 20, 30],
      // A dark background, so the accessible text color resolves to white.
      getPalette: () => [
        [10, 20, 30],
        [200, 40, 90],
      ],
    };

    await expect(manager.extractColors('http://example.test/cover.png')).resolves.toEqual({
      backgroundColor: 'rgb(10, 20, 30)',
      textColor: 'rgb(255, 255, 255)',
      accentColor: 'rgb(200, 40, 90)',
      accentTextColor: 'rgb(255, 255, 255)',
      backgroundColorRgb: '10, 20, 30',
      textColorRgb: '255, 255, 255',
      accentColorRgb: '200, 40, 90',
    });
  });
});
