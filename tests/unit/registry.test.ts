import { describe, it, expect } from 'vitest';
import {
  listPalettes,
  listPalettesByBrand,
  getPalette,
  PALETTE_SOURCE,
} from '../../src/core/palette/registry';
import { BRANDS } from '../../src/core/palette/types';

describe('registry', () => {
  it('列出九个色板', () => {
    expect(listPalettes()).toHaveLength(9);
  });

  it('按品牌分组，数量与数据一致', () => {
    expect(listPalettesByBrand('artkal')).toHaveLength(3);
    expect(listPalettesByBrand('mard')).toHaveLength(2);
    expect(listPalettesByBrand('coco')).toHaveLength(1);
    expect(listPalettesByBrand('manman')).toHaveLength(1);
    expect(listPalettesByBrand('panpan')).toHaveLength(1);
    expect(listPalettesByBrand('mixiaowo')).toHaveLength(1);
  });

  it('每个品牌都至少有一个色板', () => {
    for (const brand of BRANDS) {
      expect(listPalettesByBrand(brand.id).length, brand.id).toBeGreaterThan(0);
    }
  });

  it('色板 id 唯一', () => {
    const ids = listPalettes().map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('按 id 取色板', () => {
    expect(getPalette('mard-221')?.colors).toHaveLength(221);
    expect(getPalette('artkal-418')?.colors).toHaveLength(418);
  });

  it('未知 id 返回 undefined', () => {
    expect(getPalette('nope')).toBeUndefined();
  });

  it('暴露上游来源信息', () => {
    expect(PALETTE_SOURCE.repo).toContain('pindou-color-data');
    expect(PALETTE_SOURCE.commit).toMatch(/^[0-9a-f]{40}$/);
  });
});
