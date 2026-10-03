export type BrandId =
  | 'mard'
  | 'artkal'
  | 'coco'
  | 'manman'
  | 'panpan'
  | 'mixiaowo';

export interface Brand {
  id: BrandId;
  name: string;
}

/** 六个品牌，顺序即界面展示顺序。 */
export const BRANDS: readonly Brand[] = [
  { id: 'mard', name: 'MARD' },
  { id: 'artkal', name: '优肯 / Artkal' },
  { id: 'coco', name: 'COCO' },
  { id: 'manman', name: '漫漫' },
  { id: 'panpan', name: '盼盼' },
  { id: 'mixiaowo', name: '咪小窝' },
];

export interface BeadColor {
  /** 品牌内的色号，如 "A01"。仅在所属色板内唯一。 */
  code: string;
  hex: string;
  rgb: [number, number, number];
  /** 色系分组，用于界面归类。 */
  group: string;
  /** 0-255，仅透明/特殊材质色号有值。 */
  alpha?: number;
  /** 上游无法确认真实色号的占位项，默认不参与量化。 */
  unidentified?: boolean;
}

export interface PaletteSpec {
  id: string;
  brandId: BrandId;
  name: string;
  /** 豆子直径，用于物理尺寸估算。 */
  beadSizeMm: number;
  colors: BeadColor[];
}
