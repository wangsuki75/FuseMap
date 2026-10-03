import type { BeadColor, PaletteSpec } from './types';

/**
 * 取色板中可作为选色目标的颜色。
 *
 * 做两件事：
 * 1. 剔除 `unidentified` 占位色号——它们没有可信品牌色号，不应被选为量化目标。
 * 2. 按 HEX 去重，保留先出现的那个。
 *
 * 第 2 条是不得已而为之：上游数据里同一色板内存在重复 HEX
 * （如 COCO 的 #FFFFFF 同时是 A01 与 L14），而当前图纸数据结构以 HEX 作颜色身份，
 * 重复项无法共存。全库共 5 组，详见 tests/unit/dedupe.test.ts。
 */
export function toSelectableColors(palette: PaletteSpec): BeadColor[] {
  const seen = new Set<string>();
  const colors: BeadColor[] = [];
  for (const color of palette.colors) {
    if (color.unidentified) continue;
    const hex = color.hex.toUpperCase();
    if (seen.has(hex)) continue;
    seen.add(hex);
    colors.push(color);
  }
  return colors;
}
