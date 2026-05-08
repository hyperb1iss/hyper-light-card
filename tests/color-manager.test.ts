import { afterEach, describe, expect, it, vi } from 'vitest';
import { ColorManager } from '@/color-manager';

const fallback = {
  backgroundColor: '',
  textColor: '',
  accentColor: '',
};

describe('ColorManager', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves fallback colors when the effect image fails to load', async () => {
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
    ).resolves.toEqual(fallback);
  });

  it('resolves fallback colors when palette extraction throws', async () => {
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
        throw new Error('palette failed');
      },
    };

    await expect(manager.extractColors('http://example.test/broken.png')).resolves.toEqual(
      fallback
    );
  });
});
