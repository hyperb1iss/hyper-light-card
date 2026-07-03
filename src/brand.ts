import { html, svg, type TemplateResult } from 'lit';

/**
 * Sentinel icon value the card uses to request the inline Hypercolor mark
 * instead of an `mdi:` glyph or a remote image. The Hypercolor backend hands
 * this back from `describeCard` when the user has not set an explicit icon.
 */
export const HYPERCOLOR_MARK_ICON = 'hypercolor:mark';

// Six petals sampled around the cyan -> violet -> magenta brand wheel. Opposite
// petals share a hue so the bloom reads as symmetric at any size.
const PETAL_GRADIENTS = ['hc-cyan', 'hc-violet', 'hc-magenta'] as const;

// A single upward-pointing petal, centred on (50,50); each instance is rotated
// 60deg around the centre to build the bloom.
const PETAL_PATH = 'M50 44 C35 34 35 27 50 15 C65 27 65 34 50 44 Z';

/**
 * The Hypercolor brand mark as a self-contained inline SVG. Gradients/filter
 * ids are shadow-root scoped, so multiple cards on one dashboard don't clash.
 * The bloom inherits the card's `--accent-color` for its glowing core, so it
 * stays in harmony with the effect palette the card extracts.
 */
export function hypercolorMark(): TemplateResult {
  const petals = [0, 1, 2, 3, 4, 5].map(
    i => svg`
      <path
        d=${PETAL_PATH}
        fill="url(#${PETAL_GRADIENTS[i % PETAL_GRADIENTS.length]})"
        transform="rotate(${i * 60} 50 50)"
      />
    `
  );

  return html`
    <svg
      class="brand-mark"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Hypercolor"
    >
      <defs>
        <linearGradient id="hc-cyan" x1="50" y1="44" x2="50" y2="15" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#0891b2" />
          <stop offset="1" stop-color="#22d3ee" />
        </linearGradient>
        <linearGradient
          id="hc-violet"
          x1="50"
          y1="44"
          x2="50"
          y2="15"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stop-color="#7c3aed" />
          <stop offset="1" stop-color="#c084fc" />
        </linearGradient>
        <linearGradient
          id="hc-magenta"
          x1="50"
          y1="44"
          x2="50"
          y2="15"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stop-color="#db2777" />
          <stop offset="1" stop-color="#ff4ecd" />
        </linearGradient>
        <radialGradient id="hc-core" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stop-color="#ffffff" />
          <stop offset="0.55" stop-color="#ffffff" stop-opacity="0.85" />
          <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>
        <filter id="hc-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>
      <g class="brand-mark-bloom" filter="url(#hc-glow)" opacity="0.55">${petals}</g>
      <g class="brand-mark-bloom">${petals}</g>
      <circle cx="50" cy="50" r="9" fill="url(#hc-core)" />
    </svg>
  `;
}
