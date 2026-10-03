import { PALETTES, PALETTE_SOURCE } from './generated/palettes';
import type { BrandId, PaletteSpec } from './types';

export { PALETTE_SOURCE };

export function listPalettes(): readonly PaletteSpec[] {
  return PALETTES;
}

export function listPalettesByBrand(brandId: BrandId): PaletteSpec[] {
  return PALETTES.filter((palette) => palette.brandId === brandId);
}

export function getPalette(id: string): PaletteSpec | undefined {
  return PALETTES.find((palette) => palette.id === id);
}
