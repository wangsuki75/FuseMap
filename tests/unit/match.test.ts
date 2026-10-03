import { describe, it, expect } from 'vitest';
import { rgbToLab, ciede2000, findNearest } from '../../src/core/palette/match';
import { PALETTES } from '../../src/core/palette/generated/palettes';

describe('rgbToLab', () => {
  it('纯白对应 L≈100', () => {
    const [L] = rgbToLab([255, 255, 255]);
    expect(L).toBeCloseTo(100, 1);
  });

  it('纯黑对应 L≈0', () => {
    const [L] = rgbToLab([0, 0, 0]);
    expect(L).toBeCloseTo(0, 3);
  });

  it('中灰的 a、b 分量接近 0', () => {
    const [, a, b] = rgbToLab([128, 128, 128]);
    expect(Math.abs(a)).toBeLessThan(0.5);
    expect(Math.abs(b)).toBeLessThan(0.5);
  });
});

describe('ciede2000', () => {
  const a: [number, number, number] = [50, 2.6772, -79.7751];
  const b: [number, number, number] = [50, 0, -82.7485];

  it('同色距离为 0', () => {
    expect(ciede2000(a, a)).toBeCloseTo(0, 6);
  });

  it('满足对称性', () => {
    expect(ciede2000(a, b)).toBeCloseTo(ciede2000(b, a), 6);
  });

  it('对 Sharma 标准参考对返回 2.0425', () => {
    expect(ciede2000(a, b)).toBeCloseTo(2.0425, 4);
  });

  it('对另一组 Sharma 参考值返回 2.8615', () => {
    const r: [number, number, number] = [50, 3.1571, -77.2803];
    const s: [number, number, number] = [50, 0, -82.7485];
    expect(ciede2000(r, s)).toBeCloseTo(2.8615, 4);
  });
});

describe('findNearest', () => {
  const mard = PALETTES.find((p) => p.id === 'mard-221')!;

  it('命中色卡原色时距离为 0', () => {
    const target = mard.colors[0];
    const hit = findNearest(target.rgb, mard.colors);
    expect(hit?.color.code).toBe(target.code);
    expect(hit?.distance).toBeCloseTo(0, 4);
  });

  it('色板内每个色号都能命中自己', () => {
    for (const color of mard.colors) {
      const hit = findNearest(color.rgb, mard.colors);
      expect(hit?.color.code, color.code).toBe(color.code);
    }
  });

  it('可排除指定色号', () => {
    const target = mard.colors[0];
    const hit = findNearest(target.rgb, mard.colors, { exclude: new Set([target.code]) });
    expect(hit?.color.code).not.toBe(target.code);
  });

  it('全部排除时返回 null', () => {
    const all = new Set(mard.colors.map((c) => c.code));
    expect(findNearest([10, 20, 30], mard.colors, { exclude: all })).toBeNull();
  });

  it('空色板返回 null', () => {
    expect(findNearest([10, 20, 30], [])).toBeNull();
  });

  it('跳过 unidentified 占位色号', () => {
    const panpan = PALETTES.find((p) => p.id === 'panpan-289')!;
    const unknown = panpan.colors.find((c) => c.unidentified)!;
    const hit = findNearest(unknown.rgb, panpan.colors);
    expect(hit).not.toBeNull();
    expect(hit!.color.unidentified).toBeUndefined();
  });
});
