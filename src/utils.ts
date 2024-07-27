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
