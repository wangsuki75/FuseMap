import fs from 'node:fs';
import path from 'node:path';

/**
 * 上游仓库与本项目色板的对应关系。
 * expectedCount 用于校验，防止上游静默改数据后我们毫不知情。
 */
export const SPECS = [
  { id: 'mard-221', brandId: 'mard', name: 'MARD 221', dir: 'mard-221-alfonse-doudou', beadSizeMm: 5.0, expectedCount: 221 },
  { id: 'mard-291', brandId: 'mard', name: 'MARD 291', dir: 'mard-291-github', beadSizeMm: 5.0, expectedCount: 291 },
  { id: 'artkal-c197', brandId: 'artkal', name: '优肯 C197', dir: 'artkal-c-197-official', beadSizeMm: 5.0, expectedCount: 197 },
  { id: 'artkal-m221', brandId: 'artkal', name: '优肯 M221', dir: 'artkal-m-221-official', beadSizeMm: 5.0, expectedCount: 221 },
  { id: 'artkal-418', brandId: 'artkal', name: '优肯 全部 418', dir: 'artkal-c197-m221-418-official', beadSizeMm: 5.0, expectedCount: 418 },
  { id: 'coco-291', brandId: 'coco', name: 'COCO 291', dir: 'coco-291', beadSizeMm: 5.0, expectedCount: 291 },
  { id: 'manman-278', brandId: 'manman', name: '漫漫 278', dir: 'manman-278', beadSizeMm: 5.0, expectedCount: 278 },
  { id: 'panpan-289', brandId: 'panpan', name: '盼盼 289', dir: 'panpan-289', beadSizeMm: 5.0, expectedCount: 289 },
  { id: 'mixiaowo-290', brandId: 'mixiaowo', name: '咪小窝 290', dir: 'mixiaowo-290', beadSizeMm: 5.0, expectedCount: 290 },
];

const HEX_RE = /^#[0-9A-F]{6}([0-9A-F]{2})?$/;

export function normalizeHex(hex) {
  const value = String(hex ?? '').trim().toUpperCase();
  if (!HEX_RE.test(value)) throw new Error(`非法色值: ${hex}`);
  return value;
}

/**
 * 读取上游每个色板的 colors.json，规范化为内部结构。
 * 不抛异常，把问题收集进 problems，交给调用方决定如何处理。
 */
export function compilePalettes(srcDir) {
  const palettes = [];
  const problems = [];

  for (const spec of SPECS) {
    const file = path.join(srcDir, spec.dir, 'colors.json');
    if (!fs.existsSync(file)) {
      problems.push(`${spec.id}: 缺少文件 ${file}`);
      continue;
    }

    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    const colors = [];
    const seen = new Set();

    for (const row of raw.colors) {
      let hex;
      try {
        hex = normalizeHex(row.hex);
      } catch {
        problems.push(`${spec.id}/${row.code}: 色值非法 ${row.hex}`);
        continue;
      }

      if (seen.has(row.code)) {
        problems.push(`${spec.id}: 色号重复 ${row.code}`);
        continue;
      }
      seen.add(row.code);

      const color = {
        code: row.code,
        hex,
        rgb: [row.rgb[0], row.rgb[1], row.rgb[2]],
        group: row.group ?? '',
      };
      if (row.rgb.length > 3) color.alpha = row.rgb[3];
      if (row.unidentified) color.unidentified = true;
      colors.push(color);
    }

    if (colors.length !== spec.expectedCount) {
      problems.push(`${spec.id}: 颜色数 ${colors.length} 与预期 ${spec.expectedCount} 不符`);
    }

    palettes.push({
      id: spec.id,
      brandId: spec.brandId,
      name: spec.name,
      beadSizeMm: spec.beadSizeMm,
      colors,
    });
  }

  return { palettes, problems };
}

/** 把编译结果渲染成可提交的 TypeScript 模块。 */
export function renderTypeScript(palettes, meta) {
  return `// 本文件由 scripts/build-palettes.mjs 自动生成，请勿手工编辑。
// 数据来源：${meta.repo}
// 上游提交：${meta.commit}
//
// 上游色值为公开渠道整理与实测采样值，非品牌官方发布数据，详见仓库根目录 NOTICE。

import type { PaletteSpec } from '../types';

export const PALETTE_SOURCE = {
  repo: ${JSON.stringify(meta.repo)},
  commit: ${JSON.stringify(meta.commit)},
} as const;

export const PALETTES: PaletteSpec[] = ${JSON.stringify(palettes, null, 2)};
`;
}
