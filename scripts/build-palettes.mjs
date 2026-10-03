#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compilePalettes, renderTypeScript } from './lib/palette-compile.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'vendor', 'pindou-color-data');
const OUT = path.join(ROOT, 'src', 'core', 'palette', 'generated', 'palettes.ts');
const VERSION_FILE = path.join(SRC, 'VERSION');
const REPO = 'https://github.com/HansBug/pindou-color-data';

const commit = fs.existsSync(VERSION_FILE)
  ? fs.readFileSync(VERSION_FILE, 'utf8').trim()
  : '未知（请补充 vendor/pindou-color-data/VERSION）';

const { palettes, problems } = compilePalettes(SRC);

if (problems.length > 0) {
  console.error('色卡编译失败，未写出任何文件：');
  for (const problem of problems) console.error('  - ' + problem);
  process.exit(1);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, renderTypeScript(palettes, { repo: REPO, commit }), 'utf8');

const total = palettes.reduce((sum, palette) => sum + palette.colors.length, 0);
console.log(`已生成 ${path.relative(ROOT, OUT)}`);
console.log(`色板 ${palettes.length} 个，颜色合计 ${total} 条`);
