import { html, type TemplateResult } from 'lit';

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
