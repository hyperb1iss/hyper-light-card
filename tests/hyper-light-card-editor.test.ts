import { describe, expect, it } from 'vitest';
import type { Config } from '@/config';
import { AUTO_BACKEND, fromFormData, toFormData } from '@/hyper-light-card-editor';

describe('editor backend choice', () => {
  it('shows an absent backend as auto-detect', () => {
    const config = { entity: 'light.hyperia' } as Config;
    expect(toFormData(config).backend).toBe(AUTO_BACKEND);
  });

  it('shows a legacy empty backend as auto-detect', () => {
    const config = { entity: 'light.hypercolor', backend: '' } as unknown as Config;
    expect(toFormData(config).backend).toBe(AUTO_BACKEND);
  });

  it('shows an explicit override as itself', () => {
    const config = { entity: 'light.hyperia', backend: 'hypercolor' } as Config;
    expect(toFormData(config).backend).toBe('hypercolor');
  });

  it('drops the backend key when auto-detect is chosen', () => {
    const next = fromFormData({ entity: 'light.hyperia', backend: AUTO_BACKEND });
    expect('backend' in next).toBe(false);
    expect(next.entity).toBe('light.hyperia');
  });

  it('drops an empty backend the same way', () => {
    const next = fromFormData({ entity: 'light.hyperia', backend: '' });
    expect('backend' in next).toBe(false);
  });

  it('keeps a real override', () => {
    const next = fromFormData({ entity: 'light.hyperia', backend: 'signalrgb' });
    expect(next.backend).toBe('signalrgb');
  });
});
