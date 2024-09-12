import chroma from 'chroma-js';
import {
  getAccessibleTextColors,
  ensureContrastLab,
  formatAttributeKey,
  formatAttributeValue,
} from '@/utils';
import { render } from 'lit';

describe('getAccessibleTextColors', () => {
  test.each([
    [[255, 0, 0], 'Red background'],
    [[0, 255, 0], 'Green background'],
    [[0, 0, 255], 'Blue background'],
    [[0, 0, 0], 'Black background'],
    [[255, 255, 255], 'White background'],
  ])('getAccessibleTextColors returns accessible text colors (%s)', bgRgb => {
    const textColors = getAccessibleTextColors(bgRgb);

    // Ensure text is in a valid rgb format
    const textRgb = textColors.map(Number);
    if (!textRgb || textRgb.length !== 3) {
      throw new Error(`Invalid RGB value returned: ${textColors}`);
    }

    const textContrast = chroma.contrast(chroma(bgRgb), chroma(textRgb));

    expect(textContrast).toBeGreaterThanOrEqual(4.5);
  });
});

describe('ensureContrastLab', () => {
  test('ensures contrast ratio of at least 4.5', () => {
    const darkBg = chroma('hsl(0, 0%, 0%)');
    const lightBg = chroma('hsl(0, 0%, 100%)');
    const midColor = chroma('hsl(0, 0%, 50%)');

    const adjustedDark = ensureContrastLab(darkBg, midColor);
    const adjustedLight = ensureContrastLab(lightBg, midColor);

    expect(adjustedDark.lab()[0]).not.toBe(darkBg.lab()[0]);
    expect(adjustedLight.lab()[0]).not.toBe(lightBg.lab()[0]);

    const darkContrast = chroma.contrast(darkBg, adjustedDark);
    const lightContrast = chroma.contrast(lightBg, adjustedLight);

    expect(darkContrast).toBeGreaterThanOrEqual(4.5);
    expect(lightContrast).toBeGreaterThanOrEqual(4.5);
  });
});

describe('Formatting Functions', () => {
  test('formatAttributeKey formats keys correctly', () => {
    expect(formatAttributeKey('test_key')).toBe('Test Key');
    expect(formatAttributeKey('another_test_key')).toBe('Another Test Key');
    expect(formatAttributeKey('camelCaseKey')).toBe('CamelCaseKey');
  });

  test('formatAttributeValue formats values correctly', () => {
    expect(formatAttributeValue(true, 'boolean')).toBe('Yes');
    expect(formatAttributeValue(false, 'boolean')).toBe('No');
    expect(formatAttributeValue(3.14159, 'number')).toBe('3.14159');
    expect(formatAttributeValue(42, 'number')).toBe('42');
    expect(formatAttributeValue('test string', 'string')).toBe('test string');

    // Handle TemplateResult for color type
    const colorResult = formatAttributeValue('#ff0000', 'color');
    const div = document.createElement('div');
    render(colorResult, div);
    const renderedHTML = div.innerHTML
      .replace(/<!--.*?-->/g, '')
      .replace(/<!--\?lit.*?-->/g, '');
    expect(renderedHTML).toBe('<span style="color: #ff0000;">#ff0000</span>');

    expect(formatAttributeValue('Single Color', 'combobox')).toBe(
      'Single Color',
    );
  });
});
