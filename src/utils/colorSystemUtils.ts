import { getPalette, listPalettes } from '../core/palette/registry';
import { toSelectableColors } from '../core/palette/dedupe';
import type { PaletteColor } from './pixelation';

/**
 * 兼容层：保留原有函数签名，把底层数据源从"hex 交叉表"换成 per-brand 独立色板。
 *
 * 历史上 ColorSystem 是 'MARD' | 'COCO' | ... 五个品牌名，用一张
 * hex → 五品牌色号 的交叉表查表。现在它表示**色板 id**（如 'mard-221'），
 * 每个色板各自持有一套 HEX 与色号。
 *
 * 之所以保留签名而不做全量重命名：调用点分布在 10 个文件、88 处，
 * 全量改写风险远大于收益。彻底清理命名留到后续重构。
 */
export type ColorSystem = string;

export const DEFAULT_COLOR_SYSTEM = 'mard-221';

export const colorSystemOptions = listPalettes().map((palette) => ({
  key: palette.id,
  name: palette.name,
}));

/**
 * 把持久化里的值归一化成有效色板 id。
 * 早期版本存的是 'MARD' 这类品牌名，读到未知值时回退到默认色板，
 * 避免升级后老用户看到满屏 '?'。
 */
export function normalizeColorSystem(value: string | null | undefined): ColorSystem {
  if (value && getPalette(value)) return value;
  return DEFAULT_COLOR_SYSTEM;
}

/**
 * 色板内 hex → 色号的索引。
 *
 * 注意：上游数据里同一色板内存在重复 HEX（如 COCO 的 #FFFFFF 同时是 A01 与 L14）。
 * 本层以 HEX 作为颜色身份（与图纸数据结构一致），因此重复项只保留先出现的一个。
 * 这会让极少数颜色无法被选中，属于已知限制，详见 tests/unit/color-system.test.ts。
 */
const hexToCodeCache = new Map<string, Map<string, string>>();

function hexToCodeMap(paletteId: string): Map<string, string> {
  let map = hexToCodeCache.get(paletteId);
  if (!map) {
    map = new Map();
    const palette = getPalette(paletteId);
    if (palette) {
      for (const color of toSelectableColors(palette)) {
        map.set(color.hex.toUpperCase(), color.code);
      }
    }
    hexToCodeCache.set(paletteId, map);
  }
  return map;
}

export function getAllHexValues(): string[] {
  const palette = getPalette(DEFAULT_COLOR_SYSTEM);
  return palette ? palette.colors.map((color) => color.hex.toUpperCase()) : [];
}

/** @deprecated 旧接口，保留给尚未迁移的调用点。 */
export function getMardToHexMapping(): Record<string, string> {
  const palette = getPalette(DEFAULT_COLOR_SYSTEM);
  const mapping: Record<string, string> = {};
  if (palette) {
    for (const color of palette.colors) mapping[color.code] = color.hex.toUpperCase();
  }
  return mapping;
}

/** @deprecated 旧接口，保留给尚未迁移的调用点。 */
export function loadFullColorMapping(): Map<string, Record<string, string>> {
  const mapping = new Map<string, Record<string, string>>();
  for (const palette of listPalettes()) {
    for (const color of palette.colors) {
      const key = color.hex.toUpperCase();
      const row = mapping.get(key) ?? {};
      row[palette.id] = color.code;
      mapping.set(key, row);
    }
  }
  return mapping;
}

export function convertPaletteToColorSystem(
  palette: PaletteColor[],
  colorSystem: ColorSystem
): PaletteColor[] {
  const map = hexToCodeMap(colorSystem);
  return palette.map((color) => {
    const code = map.get(color.hex.toUpperCase()) ?? map.get(color.key.toUpperCase());
    return code ? { ...color, key: code } : color;
  });
}

export function getDisplayColorKey(hexValue: string, colorSystem: ColorSystem): string {
  if (hexValue === 'ERASE' || hexValue.length === 0 || hexValue === '?') {
    return hexValue;
  }
  return hexToCodeMap(colorSystem).get(hexValue.toUpperCase()) ?? '?';
}

/** 通过色号反查该色板内的 HEX。找不到时原样返回入参。 */
export function convertColorKeyToHex(displayKey: string, colorSystem: ColorSystem): string {
  if (displayKey.startsWith('#') && displayKey.length === 7) {
    return displayKey.toUpperCase();
  }
  const palette = getPalette(colorSystem);
  if (palette) {
    const hit = palette.colors.find((color) => color.code === displayKey);
    if (hit) return hit.hex.toUpperCase();
  }
  return displayKey;
}

export function isValidColorInSystem(hexValue: string, colorSystem: ColorSystem): boolean {
  return hexToCodeMap(colorSystem).has(hexValue.toUpperCase());
}

export function getColorKeyByHex(hexValue: string, colorSystem: ColorSystem): string {
  return hexToCodeMap(colorSystem).get(hexValue.toUpperCase()) ?? '?';
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;
  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / diff + 2) / 6;
        break;
      case b:
        h = ((r - g) / diff + 4) / 6;
        break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function sortColorsByHue<T extends { color: string }>(colors: T[]): T[] {
  return colors.slice().sort((a, b) => {
    const hslA = hexToHsl(a.color);
    const hslB = hexToHsl(b.color);
    if (Math.abs(hslA.h - hslB.h) > 5) return hslA.h - hslB.h;
    if (Math.abs(hslA.l - hslB.l) > 3) return hslB.l - hslA.l;
    return hslB.s - hslA.s;
  });
}
