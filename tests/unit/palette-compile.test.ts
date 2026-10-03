import { describe, it, expect } from 'vitest';
import {
  compilePalettes,
  normalizeHex,
  renderTypeScript,
  SPECS,
} from '../../scripts/lib/palette-compile.mjs';
import type { PaletteSpec } from '../../src/core/palette/types';

const SRC = 'vendor/pindou-color-data';

/** 编译产物必须符合 core 的 PaletteSpec，这里显式声明以便类型检查真正生效。 */
type CompileResult = { palettes: PaletteSpec[]; problems: string[] };

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
  const { palettes, problems } = compilePalettes(SRC) as CompileResult;

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

describe('renderTypeScript', () => {
  const meta = {
    repo: 'https://github.com/HansBug/pindou-color-data',
    commit: '178dafbc9e77d3de556550dbd058270200129186',
  };

  it('产出文件带自动生成声明与来源标注', () => {
    const { palettes } = compilePalettes(SRC) as CompileResult;
    const out = renderTypeScript(palettes, meta);
    expect(out).toContain('自动生成');
    expect(out).toContain(meta.commit);
    expect(out).toContain(meta.repo);
  });

  it('导出 PALETTES 与 PALETTE_SOURCE', () => {
    const { palettes } = compilePalettes(SRC) as CompileResult;
    const out = renderTypeScript(palettes, meta);
    expect(out).toContain('export const PALETTES');
    expect(out).toContain('export const PALETTE_SOURCE');
  });

  it('内联的色板数据可被 JSON 还原且数量一致', () => {
    const { palettes } = compilePalettes(SRC) as CompileResult;
    const out = renderTypeScript(palettes, meta);
    const start = out.indexOf('export const PALETTES: PaletteSpec[] = ');
    const json = out.slice(start + 'export const PALETTES: PaletteSpec[] = '.length).replace(/;\s*$/, '');
    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(9);
    expect(parsed.reduce((n: number, p: { colors: unknown[] }) => n + p.colors.length, 0)).toBe(2496);
  });
});
