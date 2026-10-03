import { describe, it, expect } from 'vitest';
import { toSelectableColors } from '../../src/core/palette/dedupe';
import { listPalettes, getPalette } from '../../src/core/palette/registry';

describe('toSelectableColors', () => {
  it('剔除 unidentified 占位色号', () => {
    const panpan = getPalette('panpan-289')!;
    const usable = toSelectableColors(panpan);
    expect(panpan.colors).toHaveLength(289);
    expect(usable).toHaveLength(285);
    expect(usable.every((c) => !c.unidentified)).toBe(true);
  });

  it('每个色板产出的颜色 HEX 唯一', () => {
    for (const palette of listPalettes()) {
      const usable = toSelectableColors(palette);
      const hexes = usable.map((c) => c.hex.toUpperCase());
      expect(new Set(hexes).size, palette.id).toBe(hexes.length);
    }
  });

  it('除重复项外不丢颜色', () => {
    const coco = getPalette('coco-291')!;
    const usable = toSelectableColors(coco);
    // 291 张色卡去掉 2 组重复 HEX 各一项
    expect(usable).toHaveLength(289);
  });

  it('保留先出现的色号', () => {
    const coco = getPalette('coco-291')!;
    const usable = toSelectableColors(coco);
    const white = usable.find((c) => c.hex.toUpperCase() === '#FFFFFF');
    expect(white?.code).toBe('A01');
  });

  it('不修改原色板', () => {
    const coco = getPalette('coco-291')!;
    const before = coco.colors.length;
    toSelectableColors(coco);
    expect(coco.colors).toHaveLength(before);
  });
});
