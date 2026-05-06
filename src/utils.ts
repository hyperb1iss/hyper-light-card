import chroma from 'chroma-js';
import { html, type TemplateResult } from 'lit';

/**
 * Ensures that the text color has sufficient contrast against the background color.
 * @param {chroma.Color} bgColor - The background color.
 * @param {chroma.Color} textColor - The initial text color.
 * @returns {chroma.Color} - The adjusted text color with sufficient contrast.
 */
export function ensureContrastLab(bgColor: chroma.Color, textColor: chroma.Color): chroma.Color {
  let adjustedColor = textColor;
  let contrast = chroma.contrast(bgColor, adjustedColor);

  const maxAttempts = 200;
  let attempts = 0;
  const step = 1; // Smaller step for finer adjustments

  while (contrast < 4.5 && attempts < maxAttempts) {
    if (bgColor.lab()[0] > 50) {
      // For light backgrounds, decrease lightness
      adjustedColor = adjustedColor.set('lab.l', Math.max(0, adjustedColor.lab()[0] - step));
    } else {
      // For dark backgrounds, increase lightness
      adjustedColor = adjustedColor.set('lab.l', Math.min(100, adjustedColor.lab()[0] + step));
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
  // Make sure rgb is an array and not a string
  if (!Array.isArray(rgb)) {
    console.error('Invalid RGB format (not an array):', rgb);
    return [255, 255, 255]; // Return white as fallback
  }

  try {
    // Convert RGB to numbers and ensure they're valid
    const r = Math.min(255, Math.max(0, Number(rgb[0]) || 0));
    const g = Math.min(255, Math.max(0, Number(rgb[1]) || 0));
    const b = Math.min(255, Math.max(0, Number(rgb[2]) || 0));

    // Calculate relative luminance according to WCAG 2.0
    // https://www.w3.org/TR/WCAG20-TECHS/G17.html#G17-tests
    const toLinear = (c: number): number => {
      const srgb = c / 255;
      return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
    };

    const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

    // Choose white or black based on luminance
    // Use a threshold of 0.179 for WCAG AA compliance (contrast ratio of 4.5:1)
    if (luminance > 0.179) {
      // Dark text on light background
      return [0, 0, 0];
    } else {
      // Light text on dark background
      return [255, 255, 255];
    }
  } catch (error) {
    console.error('Error in getAccessibleTextColors:', error);
    console.error('Failed RGB input was:', JSON.stringify(rgb));
    // Return white as fallback
    return [255, 255, 255];
  }
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
 * @param {string | number | boolean} value - The attribute value.
 * @param {string} type - The type of the attribute value.
 * @returns {string | TemplateResult} - The formatted attribute value.
 */
export function formatAttributeValue(
  value: string | number | boolean,
  type: string
): string | TemplateResult {
  switch (type) {
    case 'color':
      return html`<span style="color: ${value};">${value}</span>`;
    case 'number':
      return value.toString();
    case 'boolean':
      return value ? 'Yes' : 'No';
    case 'combobox':
      return value.toString();
    default:
      return value.toString();
  }
}

/**
 * Memoizes a function to cache its results based on the arguments provided.
 * This can improve performance by avoiding repeated calculations for the same inputs.
 *
 * @param fn - The function to memoize.
 * @returns A new function that caches the results of the original function.
 */
export function memoize<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult
): (...args: TArgs) => TResult {
  // Create a cache to store the results of the function calls.
  const cache = new Map<string, TResult>();

  // Return a new function that wraps the original function.
  return (...args: TArgs): TResult => {
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
// This will be replaced at build time with a literal true/false by vite's define plugin
declare const __IS_LOGGING_ENABLED__: boolean;

export const log = {
  debug: (...args: unknown[]): void => {
    if (__IS_LOGGING_ENABLED__) {
      console.debug(...args);
    }
  },
  log: (...args: unknown[]): void => {
    if (__IS_LOGGING_ENABLED__) {
      console.log(...args);
    }
  },
  warn: (...args: unknown[]): void => {
    if (__IS_LOGGING_ENABLED__) {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]): void => {
    console.error(...args);
  },
};
