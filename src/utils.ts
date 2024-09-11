import chroma from 'chroma-js';

/**
 * Ensures that the text color has sufficient contrast against the background color.
 * @param {chroma.Color} bgColor - The background color.
 * @param {chroma.Color} textColor - The initial text color.
 * @returns {chroma.Color} - The adjusted text color with sufficient contrast.
 */
export function ensureContrastLab(
  bgColor: chroma.Color,
  textColor: chroma.Color,
): chroma.Color {
  let adjustedColor = textColor;
  let contrast = chroma.contrast(bgColor, adjustedColor);

  const maxAttempts = 200;
  let attempts = 0;
  const step = 1; // Smaller step for finer adjustments

  while (contrast < 4.5 && attempts < maxAttempts) {
    if (bgColor.lab()[0] > 50) {
      // For light backgrounds, decrease lightness
      adjustedColor = adjustedColor.set(
        'lab.l',
        Math.max(0, adjustedColor.lab()[0] - step),
      );
    } else {
      // For dark backgrounds, increase lightness
      adjustedColor = adjustedColor.set(
        'lab.l',
        Math.min(100, adjustedColor.lab()[0] + step),
      );
    }
    contrast = chroma.contrast(bgColor, adjustedColor);
    attempts++;
  }

  if (contrast < 4.5) {
    // If contrast is still insufficient, invert the lightness
    adjustedColor = adjustedColor.set('lab.l', 100 - adjustedColor.lab()[0]);
    contrast = chroma.contrast(bgColor, adjustedColor);
  }

  return adjustedColor;
}

/**
 * Gets accessible text colors based on the background color.
 * @param {number[]} rgb - The RGB values of the background color.
 * @returns {number[]} - The RGB values of the accessible text color.
 */
export function getAccessibleTextColors(rgb: number[]): number[] {
  const bgColor = chroma(rgb);
  const complementaryColor = chroma.lab(
    bgColor.lab()[0],
    bgColor.get('lab.a'),
    bgColor.get('lab.b'),
  );

  let textColor =
    bgColor.lab()[0] > 50
      ? chroma.lab(0, complementaryColor.lab()[1], complementaryColor.lab()[2])
      : chroma.lab(
          100,
          complementaryColor.lab()[1],
          complementaryColor.lab()[2],
        );
  textColor = ensureContrastLab(bgColor, textColor);

  return textColor.rgb();
}

/**
 * Converts an array of RGB values to a CSS rgb() string.
 * @param {number[]} color - The RGB values.
 * @returns {string} - The CSS rgb() string.
 */
export function getColor(color: number[]): string {
  return `rgb(${color.join(',')})`;
}

/**
 * Formats an attribute key by capitalizing each word and replacing underscores with spaces.
 * @param {string} key - The attribute key.
 * @returns {string} - The formatted attribute key.
 */
export function formatAttributeKey(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Formats an attribute value based on its type.
 * @param {boolean | number | string} value - The attribute value.
 * @returns {string} - The formatted attribute value.
 */
export function formatAttributeValue(value: boolean | number | string): string {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
  return value;
}

/**
 * Memoizes a function to cache its results based on the arguments provided.
 * This can improve performance by avoiding repeated calculations for the same inputs.
 *
 * @param fn - The function to memoize.
 * @returns A new function that caches the results of the original function.
 */
export function memoize<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
): (...args: TArgs) => TResult {
  // Create a cache to store the results of the function calls.
  const cache = new Map<string, TResult>();

  // Return a new function that wraps the original function.
  return function (...args: TArgs): TResult {
    // Create a key based on the arguments provided.
    const key = JSON.stringify(args);

    // If the result for these arguments is already in the cache, return it.
    if (cache.has(key)) {
      return cache.get(key) as TResult;
    }

    // Otherwise, call the original function with the arguments.
    const result = fn(...args);

    // Store the result in the cache.
    cache.set(key, result);

    // Return the result.
    return result;
  };
}

export function convertHABrightnessToCard(haBrightness: number): number {
  return Math.round(((haBrightness - 3) / 252) * 100);
}

export function convertCardBrightnessToHA(cardBrightness: number): number {
  return Math.round((cardBrightness / 100) * 252) + 3;
}

// Logging utility
const isLoggingEnabled = '__IS_LOGGING_ENABLED__' as unknown as boolean;

export const log = {
  debug: (...args: unknown[]): void => {
    if (isLoggingEnabled) {
      console.debug(...args);
    }
  },
  log: (...args: unknown[]): void => {
    if (isLoggingEnabled) {
      console.log(...args);
    }
  },
  warn: (...args: unknown[]): void => {
    if (isLoggingEnabled) {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]): void => {
    if (isLoggingEnabled) {
      console.error(...args);
    }
  },
};
