import { describe, it, expect } from 'vitest';
import {
  colorSystemOptions,
  convertPaletteToColorSystem,
  convertColorKeyToHex,
  getColorKeyByHex,
  getDisplayColorKey,
  getMardToHexMapping,
  isValidColorInSystem,
  normalizeColorSystem,
  DEFAULT_COLOR_SYSTEM,
} from '../../src/utils/colorSystemUtils';
import { listPalettes } from '../../src/core/palette/registry';
import { hexToRgb } from '../../src/utils/pixelation';

describe('colorSystemOptions', () => {
  it('列出全部九个色板', () => {
    expect(colorSystemOptions).toHaveLength(9);
    expect(colorSystemOptions.map((o) => o.key)).toContain('mard-221');
    expect(colorSystemOptions.map((o) => o.key)).toContain('artkal-418');
  });
});

describe('getColorKeyByHex', () => {
  it('MARD 色板下 #FAF5CD 对应 A1', () => {
    expect(getColorKeyByHex('#FAF5CD', 'mard-221')).toBe('A1');
  });

  it('同一 HEX 在不同色板下给出各自的色号', () => {
    // 上游数据里 MARD 的 A1 与 COCO 的 A01 恰好同色，但色号体系不同
    expect(getColorKeyByHex('#FAF5CD', 'mard-221')).toBe('A1');
    expect(getColorKeyByHex('#F7F8F5', 'coco-291')).toBeDefined();
  });

  it('未知色板返回 ?', () => {
    expect(getColorKeyByHex('#FAF5CD', '不存在的色板')).toBe('?');
  });

  it('透明与橡皮擦等特殊键原样透传', () => {
    expect(getDisplayColorKey('ERASE', 'mard-221')).toBe('ERASE');
    expect(getDisplayColorKey('', 'mard-221')).toBe('');
  });
});

describe('重复 HEX 的已知限制', () => {
  // 上游数据里同一色板内存在重复 HEX。本层以 HEX 作颜色身份（与图纸结构一致），
  // 因此每个重复组只有先出现的色号可达。这里是把这个限制固定下来，
  // 而不是让它变成无人察觉的数据丢失。
  const duplicates: Array<[string, string, string]> = [
    ['artkal-418', '#FFFFFF', 'C01'],
    ['artkal-418', '#000000', 'C02'],
    ['coco-291', '#FFFFFF', 'A01'],
    ['coco-291', '#FFFDF7', 'A03'],
    ['manman-278', '#D093BC', 'S8'],
  ];

  it.each(duplicates)('%s 的 %s 解析为首个色号 %s', (paletteId, hex, expected) => {
    expect(getColorKeyByHex(hex, paletteId)).toBe(expected);
  });

  it('全库共 5 个 HEX 在所属色板内重复', () => {
    let total = 0;
    for (const palette of listPalettes()) {
      const seen = new Set<string>();
      const dup = new Set<string>();
      for (const color of palette.colors) {
        const hex = color.hex.toUpperCase();
        if (seen.has(hex)) dup.add(hex);
        seen.add(hex);
      }
      total += dup.size;
    }
    expect(total).toBe(5);
  });
});

describe('convertPaletteToColorSystem', () => {
  it('把 key 从 HEX 换成对应色号', () => {
    const palette = [
      { key: '#FAF5CD', hex: '#FAF5CD', rgb: hexToRgb('#FAF5CD')! },
    ];
    const converted = convertPaletteToColorSystem(palette, 'mard-221');
    expect(converted[0].key).toBe('A1');
    expect(converted[0].hex).toBe('#FAF5CD');
  });

  it('色板外的颜色保持原样', () => {
    const palette = [{ key: '#123456', hex: '#123456', rgb: hexToRgb('#123456')! }];
    const converted = convertPaletteToColorSystem(palette, 'mard-221');
    expect(converted[0].key).toBe('#123456');
  });
});

describe('convertColorKeyToHex', () => {
  it('色号反查回 HEX', () => {
    expect(convertColorKeyToHex('A1', 'mard-221')).toBe('#FAF5CD');
  });

  it('入参已是 HEX 时原样返回', () => {
    expect(convertColorKeyToHex('#ABCDEF', 'mard-221')).toBe('#ABCDEF');
  });
});

describe('isValidColorInSystem', () => {
  it('辨识色板内外的颜色', () => {
    expect(isValidColorInSystem('#FAF5CD', 'mard-221')).toBe(true);
    expect(isValidColorInSystem('#123456', 'mard-221')).toBe(false);
  });
});

describe('normalizeColorSystem', () => {
  it('有效的色板 id 原样返回', () => {
    expect(normalizeColorSystem('coco-291')).toBe('coco-291');
  });

  it('旧版本存的品牌名回退到默认色板', () => {
    expect(normalizeColorSystem('MARD')).toBe(DEFAULT_COLOR_SYSTEM);
    expect(normalizeColorSystem('盼盼')).toBe(DEFAULT_COLOR_SYSTEM);
  });

  it('null / undefined / 空串回退到默认色板', () => {
    expect(normalizeColorSystem(null)).toBe(DEFAULT_COLOR_SYSTEM);
    expect(normalizeColorSystem(undefined)).toBe(DEFAULT_COLOR_SYSTEM);
    expect(normalizeColorSystem('')).toBe(DEFAULT_COLOR_SYSTEM);
  });
});

describe('getMardToHexMapping', () => {
  it('返回默认色板的 色号 → HEX 映射', () => {
    const mapping = getMardToHexMapping();
    expect(mapping.A1).toBe('#FAF5CD');
    expect(Object.keys(mapping)).toHaveLength(221);
  });
});
