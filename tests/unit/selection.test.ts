import { describe, it, expect } from 'vitest';
import {
  createSelection,
  toggleCode,
  isEnabled,
  selectedCodes,
  excludedSet,
  parseCodeList,
  applyCodeList,
  selectAll,
  clearAll,
} from '../../src/core/palette/selection';
import { PALETTES } from '../../src/core/palette/generated/palettes';

const mard = PALETTES.find((p) => p.id === 'mard-221')!;
const first = mard.colors[0].code;

describe('createSelection', () => {
  it('默认全选', () => {
    const sel = createSelection(mard);
    expect(selectedCodes(sel, mard).size).toBe(mard.colors.length);
    expect(excludedSet(sel, mard).size).toBe(0);
  });

  it('记录所属色板 id', () => {
    expect(createSelection(mard).paletteId).toBe('mard-221');
  });
});

describe('toggleCode', () => {
  it('关掉再打开', () => {
    let sel = createSelection(mard);
    sel = toggleCode(sel, first);
    expect(isEnabled(sel, first)).toBe(false);
    sel = toggleCode(sel, first);
    expect(isEnabled(sel, first)).toBe(true);
  });

  it('不修改原对象', () => {
    const sel = createSelection(mard);
    toggleCode(sel, first);
    expect(isEnabled(sel, first)).toBe(true);
  });
});

describe('selectAll / clearAll', () => {
  it('clearAll 后没有选中项', () => {
    const sel = clearAll(mard);
    expect(selectedCodes(sel, mard).size).toBe(0);
    expect(excludedSet(sel, mard).size).toBe(mard.colors.length);
  });

  it('clearAll 再 selectAll 恢复全选', () => {
    const sel = selectAll(mard);
    expect(selectedCodes(sel, mard).size).toBe(mard.colors.length);
  });
});

describe('parseCodeList', () => {
  it('支持逗号、空格、换行、顿号、分号分隔', () => {
    expect(parseCodeList('A1, A2  A3\nB1、B2;B3')).toEqual([
      'A1', 'A2', 'A3', 'B1', 'B2', 'B3',
    ]);
  });

  it('忽略空项并去重', () => {
    expect(parseCodeList('A1,,A1,  ')).toEqual(['A1']);
  });

  it('空字符串得到空数组', () => {
    expect(parseCodeList('   \n  ')).toEqual([]);
  });
});

describe('applyCodeList', () => {
  it('只保留清单内的色号', () => {
    const sel = applyCodeList(mard, ['A1', 'A2']);
    const codes = selectedCodes(sel, mard);
    expect(codes.size).toBe(2);
    expect(codes.has('A1')).toBe(true);
    expect(codes.has('B1')).toBe(false);
  });

  it('清单中的未知色号被忽略', () => {
    const sel = applyCodeList(mard, ['A1', 'NOT-A-CODE']);
    expect(selectedCodes(sel, mard).size).toBe(1);
  });

  it('空清单等于全部关闭', () => {
    const sel = applyCodeList(mard, []);
    expect(selectedCodes(sel, mard).size).toBe(0);
  });

  it('产出的选择可直接喂给排除集合', () => {
    const sel = applyCodeList(mard, ['A1', 'A2']);
    expect(excludedSet(sel, mard).size).toBe(mard.colors.length - 2);
  });
});
