import type { PaletteSpec } from './types';

/**
 * 用户在某个色板上启用了哪些色号。
 * 用"未出现即启用"的存法，新增色板时默认全选，也便于序列化进 localStorage。
 */
export interface PaletteSelection {
  paletteId: string;
  /** 色号 → 是否启用。未出现的色号按启用处理。 */
  enabled: Record<string, boolean>;
}

export function createSelection(palette: PaletteSpec): PaletteSelection {
  return { paletteId: palette.id, enabled: {} };
}

export function isEnabled(selection: PaletteSelection, code: string): boolean {
  return selection.enabled[code] !== false;
}

function withEnabled(selection: PaletteSelection, enabled: Record<string, boolean>): PaletteSelection {
  return { paletteId: selection.paletteId, enabled };
}

export function toggleCode(selection: PaletteSelection, code: string): PaletteSelection {
  const enabled = { ...selection.enabled };
  if (isEnabled(selection, code)) enabled[code] = false;
  else delete enabled[code];
  return withEnabled(selection, enabled);
}

export function selectAll(palette: PaletteSpec): PaletteSelection {
  return { paletteId: palette.id, enabled: {} };
}

export function clearAll(palette: PaletteSpec): PaletteSelection {
  const enabled: Record<string, boolean> = {};
  for (const color of palette.colors) enabled[color.code] = false;
  return { paletteId: palette.id, enabled };
}

export function selectedCodes(selection: PaletteSelection, palette: PaletteSpec): Set<string> {
  const codes = new Set<string>();
  for (const color of palette.colors) {
    if (isEnabled(selection, color.code)) codes.add(color.code);
  }
  return codes;
}

export function excludedSet(selection: PaletteSelection, palette: PaletteSpec): Set<string> {
  const codes = new Set<string>();
  for (const color of palette.colors) {
    if (!isEnabled(selection, color.code)) codes.add(color.code);
  }
  return codes;
}

/** 解析用户粘贴的色号清单。支持中英文逗号、空格、换行、分号、顿号分隔。 */
export function parseCodeList(text: string): string[] {
  const tokens = text
    .split(/[\s,;、，；]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
  return Array.from(new Set(tokens));
}

/**
 * 用清单替换当前选择：清单之内的启用，其余一律关闭。
 * 这样用户从店家买到的一盒豆，粘贴色号就能直接限定选色范围。
 */
export function applyCodeList(palette: PaletteSpec, codes: readonly string[]): PaletteSelection {
  const valid = new Set(palette.colors.map((color) => color.code));
  const enabled: Record<string, boolean> = {};
  for (const color of palette.colors) enabled[color.code] = false;
  for (const code of codes) {
    if (valid.has(code)) enabled[code] = true;
  }
  return { paletteId: palette.id, enabled };
}
