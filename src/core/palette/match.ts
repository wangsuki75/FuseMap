import type { BeadColor } from './types';

export type Lab = [number, number, number];

/** D65 标准光源下的白点，与 sRGB 配合使用。 */
const WHITE: Lab = [0.95047, 1.0, 1.08883];

const DELTA = 6 / 29;
const DELTA_CUBED = DELTA * DELTA * DELTA;
const FOUR_OVER_29 = 4 / 29;

function srgbToLinear(channel: number): number {
  const v = channel / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function rgbToXyz(rgb: readonly [number, number, number]): Lab {
  const r = srgbToLinear(rgb[0]);
  const g = srgbToLinear(rgb[1]);
  const b = srgbToLinear(rgb[2]);
  return [
    r * 0.4124564 + g * 0.3575761 + b * 0.1804375,
    r * 0.2126729 + g * 0.7151522 + b * 0.072175,
    r * 0.0193339 + g * 0.119192 + b * 0.9503041,
  ];
}

export function xyzToLab(xyz: Lab): Lab {
  const f = (t: number) => (t > DELTA_CUBED ? Math.cbrt(t) : t / (3 * DELTA * DELTA) + FOUR_OVER_29);
  const fx = f(xyz[0] / WHITE[0]);
  const fy = f(xyz[1] / WHITE[1]);
  const fz = f(xyz[2] / WHITE[2]);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function rgbToLab(rgb: readonly [number, number, number]): Lab {
  return xyzToLab(rgbToXyz(rgb));
}

function hueAngle(b: number, aPrime: number): number {
  if (b === 0 && aPrime === 0) return 0;
  const degrees = (Math.atan2(b, aPrime) * 180) / Math.PI;
  return degrees >= 0 ? degrees : degrees + 360;
}

const pow7 = (v: number) => Math.pow(v, 7);
const POW25_7 = pow7(25);

/**
 * CIEDE2000 色差。
 * 实现依据 Sharma, Wu & Dalal (2005), "The CIEDE2000 Color-Difference Formula"。
 */
export function ciede2000(lab1: Lab, lab2: Lab): number {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;

  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cbar = (C1 + C2) / 2;
  const Cbar7 = pow7(Cbar);
  const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + POW25_7)));

  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);

  const h1p = hueAngle(b1, a1p);
  const h2p = hueAngle(b2, a2p);

  const dLp = L2 - L1;
  const dCp = C2p - C1p;

  let dhp = 0;
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * Math.PI) / 360);

  const Lbarp = (L1 + L2) / 2;
  const Cbarp = (C1p + C2p) / 2;

  let hbarp: number;
  if (C1p * C2p === 0) {
    hbarp = h1p + h2p;
  } else {
    const sum = h1p + h2p;
    if (Math.abs(h1p - h2p) <= 180) hbarp = sum / 2;
    else if (sum < 360) hbarp = (sum + 360) / 2;
    else hbarp = (sum - 360) / 2;
  }

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const T =
    1 -
    0.17 * Math.cos(toRad(hbarp - 30)) +
    0.24 * Math.cos(toRad(2 * hbarp)) +
    0.32 * Math.cos(toRad(3 * hbarp + 6)) -
    0.2 * Math.cos(toRad(4 * hbarp - 63));

  const dTheta = 30 * Math.exp(-Math.pow((hbarp - 275) / 25, 2));
  const Cbarp7 = pow7(Cbarp);
  const RC = 2 * Math.sqrt(Cbarp7 / (Cbarp7 + POW25_7));
  const SL = 1 + (0.015 * Math.pow(Lbarp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbarp - 50, 2));
  const SC = 1 + 0.045 * Cbarp;
  const SH = 1 + 0.015 * Cbarp * T;
  const RT = -Math.sin(toRad(2 * dTheta)) * RC;

  const termL = dLp / SL;
  const termC = dCp / SC;
  const termH = dHp / SH;

  return Math.sqrt(
    termL * termL + termC * termC + termH * termH + RT * termC * termH
  );
}

export interface MatchResult {
  color: BeadColor;
  distance: number;
}

export interface MatchOptions {
  /** 要跳过的色号，通常来自用户的"我手上只有这些豆"选择。 */
  exclude?: ReadonlySet<string>;
}

const labCache = new WeakMap<readonly BeadColor[], Lab[]>();

function labsFor(colors: readonly BeadColor[]): Lab[] {
  let labs = labCache.get(colors);
  if (!labs) {
    labs = colors.map((color) => rgbToLab(color.rgb));
    labCache.set(colors, labs);
  }
  return labs;
}

/**
 * 在色板中找与给定 RGB 最接近的颜色。
 * 跳过 unidentified 占位色号与被排除的色号；没有可选项时返回 null。
 */
export function findNearest(
  rgb: readonly [number, number, number],
  colors: readonly BeadColor[],
  options: MatchOptions = {}
): MatchResult | null {
  const target = rgbToLab(rgb);
  const labs = labsFor(colors);
  let best: MatchResult | null = null;

  for (let i = 0; i < colors.length; i++) {
    const color = colors[i];
    if (color.unidentified) continue;
    if (options.exclude?.has(color.code)) continue;
    const distance = ciede2000(target, labs[i]);
    if (best === null || distance < best.distance) {
      best = { color, distance };
    }
  }

  return best;
}
