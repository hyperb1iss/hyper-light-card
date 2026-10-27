import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SourceMap } from 'node:module';
import { SourceTextModule } from 'node:vm';
import { JSDOM } from 'jsdom';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const code = readFileSync(new URL('../target/hyper-light-card.js', import.meta.url), 'utf8');
const payload = JSON.parse(
  readFileSync(new URL('../target/hyper-light-card.js.map', import.meta.url), 'utf8')
);

assert.ok(code.startsWith(`/* Hyper Light Card v${pkg.version} - Apache 2.0 Licensed */`));
assert.ok(code.includes('sourceMappingURL=hyper-light-card.js.map'));

// Check an emitted statement against its original source, not only the map's existence.
const offset = code.lastIndexOf('customElements.define("hyper-light-card",');
assert.ok(offset >= 0, 'The bundle must register the card');
const prefix = code.slice(0, offset);
const mapping = new SourceMap(payload).findEntry(
  prefix.split('\n').length - 1,
  prefix.length - prefix.lastIndexOf('\n') - 1
);
assert.ok('originalSource' in mapping, 'The card registration must have a source mapping');
assert.ok(mapping.originalSource.endsWith('/src/hyper-light-card.ts'));
const original = payload.sourcesContent[payload.sources.indexOf(mapping.originalSource)];
assert.ok(
  original.split('\n')[mapping.originalLine].includes("customElements.define('hyper-light-card'")
);

const dom = new JSDOM('<!doctype html>', {
  url: 'http://localhost',
  runScripts: 'outside-only',
  pretendToBeVisual: true,
});
Object.defineProperty(dom.window, 'ResizeObserver', {
  value: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
});
dom.window.HTMLElement.prototype.scrollIntoView = () => {};

try {
  const module = new SourceTextModule(code, { context: dom.getInternalVMContext() });
  await module.link(() => {
    throw new Error('The published card must not require external module imports');
  });
  await module.evaluate();
  for (const tag of ['hyper-light-card', 'hyper-light-card-editor']) {
    assert.ok(dom.window.customElements.get(tag), `${tag} must register from the built module`);
  }

  const card = /** @type {import('../src/hyper-light-card').HyperLightCard} */ (
    dom.window.document.createElement('hyper-light-card')
  );
  card.setConfig({ entity: 'light.test_light', backend: 'signalrgb' });
  Object.assign(card, {
    hass: {
      states: {
        'light.test_light': {
          entity_id: 'light.test_light',
          state: 'on',
          attributes: {
            friendly_name: 'Test',
            effect: 'A',
            effect_list: ['A', 'B'],
            brightness: 128,
          },
        },
      },
      callService: async () => {},
    },
  });
  dom.window.document.body.appendChild(card);
  await card.updateComplete;
  await card.updateComplete;

  const selector = card.shadowRoot?.querySelector('.effect-select-wrapper [aria-expanded]');
  assert.ok(selector instanceof dom.window.HTMLElement, 'The rendered effect selector must exist');
  assert.equal(selector.getAttribute('aria-expanded'), 'false');
  selector.click();
  await card.updateComplete;
  assert.equal(selector.getAttribute('aria-expanded'), 'true');
  const options = [
    ...(card.shadowRoot?.querySelectorAll('.effect-select-wrapper [role=option]') ?? []),
  ];
  assert.deepEqual(
    options.map(option => option.getAttribute('aria-selected')),
    ['true', 'false']
  );
  card.remove();
  console.log('Built card: standalone module, source map, and ARIA states verified');
} finally {
  dom.window.close();
}
