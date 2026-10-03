import { describe, it, expect } from 'vitest';
import { PALETTES, PALETTE_SOURCE } from '../../src/core/palette/generated/palettes';
import { findNearest } from '../../src/core/palette/match';
import { toSelectableColors } from '../../src/core/palette/dedupe';
import { compilePalettes } from '../../scripts/lib/palette-compile.mjs';
import type { PaletteSpec } from '../../src/core/palette/types';

/**
 * 抽检：固定若干条真实色值，确保上游数据变动或编译脚本引入错误时能被立刻发现。
 * 这里的期望值来自上游实测数据，若断言失败，先查上游是否真的改了，不要直接改期望值。
 */

const mard = PALETTES.find((p) => p.id === 'mard-221')!;
const artkal = PALETTES.find((p) => p.id === 'artkal-c197')!;

describe('色号抽检', () => {
  it('MARD 221 首个色号与上游一致', () => {
    expect(mard.colors[0].code).toBe('A1');
    expect(mard.colors[0].hex).toBe('#FAF5CD');
  });

  it('上游提交号已固定', () => {
    expect(PALETTE_SOURCE.commit).toBe('178dafbc9e77d3de556550dbd058270200129186');
  });

  it('九个色板颜色数合计 2496', () => {
    const total = PALETTES.reduce((n, p) => n + p.colors.length, 0);
    expect(total).toBe(2496);
  });

  it('每个色板的前 20 个色值都能命中到同色', () => {
    // 注意断言的是色差为 0 而不是色号相同：上游存在同一色板内重复 HEX 的情况
    // （如 COCO 的 #FFFFFF 同为 A01/L14），此时只能命中到先出现的那个色号。
    // 色号级的重复行为在 tests/unit/dedupe.test.ts 与 color-system.test.ts 中单独固定。
    for (const palette of PALETTES) {
      for (const color of palette.colors.slice(0, 20)) {
        const hit = findNearest(color.rgb, palette.colors);
        expect(hit, `${palette.id}/${color.code}`).not.toBeNull();
        expect(hit!.distance, `${palette.id}/${color.code}`).toBeCloseTo(0, 4);
      }
    }
  });

  it('优肯 C197 的透明色号带 alpha 且为八位色值', () => {
    const ct01 = artkal.colors.find((c) => c.code === 'CT01')!;
    expect(ct01.alpha).toBe(128);
    expect(ct01.hex).toHaveLength(9);
  });

  it('占位色号不会被选为匹配目标', () => {
    const panpan = PALETTES.find((p) => p.id === 'panpan-289')!;
    const unknown = panpan.colors.find((c) => c.unidentified)!;
    expect(findNearest(unknown.rgb, panpan.colors)?.color.unidentified).toBeUndefined();
  });
});

describe('产物与上游一致性', () => {
  it('提交进仓库的 palettes.ts 与重新编译的结果一致', () => {
    const { palettes, problems } = compilePalettes('vendor/pindou-color-data') as {
      palettes: PaletteSpec[];
      problems: string[];
    };
    expect(problems).toEqual([]);
    expect(palettes).toEqual(PALETTES);
  });

  it('每个色板去重后的颜色数可复现', () => {
    const counts = PALETTES.map((p) => [p.id, toSelectableColors(p).length] as const);
    expect(Object.fromEntries(counts)).toMatchInlineSnapshot(`
      {
        "artkal-418": 416,
        "artkal-c197": 197,
        "artkal-m221": 221,
        "coco-291": 289,
        "manman-278": 277,
        "mard-221": 221,
        "mard-291": 291,
        "mixiaowo-290": 286,
        "panpan-289": 285,
      }
    `);
  });
});
