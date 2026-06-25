/**
 * Tests for business-model tool availability: the pure isToolAvailable filter
 * and registry-level filtering driven by config.
 */

import { isToolAvailable } from '../../src/tools/types';

describe('isToolAvailable', () => {
  const b2c = { businessModel: 'b2c' as const, marketplaceEnabled: false };
  const b2b = { businessModel: 'b2b' as const, marketplaceEnabled: false };
  const b2cMp = { businessModel: 'b2c' as const, marketplaceEnabled: true };
  const b2bMp = { businessModel: 'b2b' as const, marketplaceEnabled: true };

  it('exposes tools without availability in every context', () => {
    expect(isToolAvailable({}, b2c)).toBe(true);
    expect(isToolAvailable({}, b2b)).toBe(true);
  });

  it('restricts by business model', () => {
    expect(isToolAvailable({ availability: { models: ['b2c'] } }, b2c)).toBe(true);
    expect(isToolAvailable({ availability: { models: ['b2c'] } }, b2b)).toBe(false);
    expect(isToolAvailable({ availability: { models: ['b2b'] } }, b2b)).toBe(true);
    expect(isToolAvailable({ availability: { models: ['b2b'] } }, b2c)).toBe(false);
    expect(isToolAvailable({ availability: { models: ['b2c', 'b2b'] } }, b2b)).toBe(true);
  });

  it('requires marketplace capability when marketplace is true', () => {
    expect(isToolAvailable({ availability: { marketplace: true } }, b2c)).toBe(false);
    expect(isToolAvailable({ availability: { marketplace: true } }, b2cMp)).toBe(true);
    expect(isToolAvailable({ availability: { marketplace: true } }, b2bMp)).toBe(true);
  });

  it('combines model and marketplace constraints', () => {
    const avail = { availability: { models: ['b2b'] as ('b2c' | 'b2b')[], marketplace: true } };
    expect(isToolAvailable(avail, b2bMp)).toBe(true);
    expect(isToolAvailable(avail, b2b)).toBe(false); // marketplace off
    expect(isToolAvailable(avail, b2cMp)).toBe(false); // wrong model
  });
});

describe('registry filtering by business model', () => {
  const realModel = process.env.SPRYKER_BUSINESS_MODEL;
  const realMp = process.env.SPRYKER_MARKETPLACE_ENABLED;

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    if (realModel === undefined) { delete process.env.SPRYKER_BUSINESS_MODEL; }
    else { process.env.SPRYKER_BUSINESS_MODEL = realModel; }
    if (realMp === undefined) { delete process.env.SPRYKER_MARKETPLACE_ENABLED; }
    else { process.env.SPRYKER_MARKETPLACE_ENABLED = realMp; }
  });

  function registeredToolNames(): string[] {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ToolRegistry } = require('../../src/tools/index.js');
    const registry = new ToolRegistry();
    const fakeServer = { setRequestHandler: jest.fn() };
    registry.registerAll(fakeServer);
    return registry.getTools().map((t: { name: string }) => t.name);
  }

  it('exposes B2C wishlist tools in the default (b2c) model', () => {
    delete process.env.SPRYKER_BUSINESS_MODEL;
    const names = registeredToolNames();
    expect(names).toContain('get-wishlists');
    expect(names).toContain('product-search'); // common tool always present
  });

  it('hides B2C wishlist tools when business model is b2b', () => {
    process.env.SPRYKER_BUSINESS_MODEL = 'b2b';
    const names = registeredToolNames();
    expect(names).not.toContain('get-wishlists');
    expect(names).not.toContain('wishlist-to-cart');
    expect(names).toContain('product-search'); // common tool still present
  });
});
