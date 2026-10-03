import { describe, it, expect } from 'vitest';
import { compilePalettes, normalizeHex, SPECS } from '../../scripts/lib/palette-compile.mjs';

const SRC = 'vendor/pindou-color-data';

describe('normalizeHex', () => {
  it('统一为大写', () => {
    expect(normalizeHex('#faf5cd')).toBe('#FAF5CD');
  });

  it('保留八位带透明度色值', () => {
    expect(normalizeHex('#c6c6d280')).toBe('#C6C6D280');
  });

  it('拒绝非法色值', () => {
    expect(() => normalizeHex('red')).toThrow();
    expect(() => normalizeHex('#FFF')).toThrow();
  });
});

describe('compilePalettes', () => {
  const { palettes, problems } = compilePalettes(SRC);

  it('不应有校验问题', () => {
    expect(problems).toEqual([]);
  });

  it('应生成九个色板', () => {
    expect(palettes).toHaveLength(9);
  });

  it('每个色板颜色数与上游声明一致', () => {
    for (const spec of SPECS) {
      const palette = palettes.find((p) => p.id === spec.id);
      expect(palette?.colors.length, spec.id).toBe(spec.expectedCount);
    }
  });

  it('颜色总数为 2496', () => {
    const total = palettes.reduce((n, p) => n + p.colors.length, 0);
    expect(total).toBe(2496);
  });

  it('色号在色板内唯一', () => {
    for (const palette of palettes) {
      const codes = palette.colors.map((c) => c.code);
      expect(new Set(codes).size, palette.id).toBe(codes.length);
    }
  });

  it('透明色号带 alpha 字段', () => {
    const artkal = palettes.find((p) => p.id === 'artkal-c197');
    const ct01 = artkal?.colors.find((c) => c.code === 'CT01');
    expect(ct01?.alpha).toBe(128);
    expect(ct01?.hex).toHaveLength(9);
  });

  it('无法辨认的占位色号被标记', () => {
    const panpan = palettes.find((p) => p.id === 'panpan-289');
    expect(panpan?.colors.filter((c) => c.unidentified)).toHaveLength(4);
  });

  it('不透明色号不带 alpha 字段', () => {
    const coco = palettes.find((p) => p.id === 'coco-291');
    expect(coco?.colors.every((c) => c.alpha === undefined)).toBe(true);
  });
});
