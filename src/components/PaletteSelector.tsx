'use client';

import { useState } from 'react';
import { BRANDS, type BrandId, type PaletteSpec } from '../core/palette/types';
import { listPalettes, listPalettesByBrand } from '../core/palette/registry';

interface Props {
  paletteId: string;
  /** 当前启用的色号数 */
  selectedCount: number;
  /** 该色板可用于选色的色号总数（已去重、已剔除占位色号） */
  totalCount: number;
  /** 是否正在使用自定义色板（即与全选不同） */
  isCustomPalette: boolean;
  onChange: (palette: PaletteSpec) => void;
  onOpenColorPicker: () => void;
  /** 解除所有色号限制，恢复为该色板全选 */
  onResetAll: () => void;
}

/**
 * 色板选择：品牌 → 规格两级，外加"我有的色号"入口。
 *
 * 刻意保持两级而不是平铺九个色板：品牌是用户先想到的维度
 * （"我买的是优肯的豆"），规格是次要维度（197 还是 418）。
 */
export default function PaletteSelector({
  paletteId,
  selectedCount,
  totalCount,
  isCustomPalette,
  onChange,
  onOpenColorPicker,
  onResetAll,
}: Props) {
  const current = listPalettes().find((p) => p.id === paletteId);
  const [brandId, setBrandId] = useState<BrandId>(current?.brandId ?? BRANDS[0].id);
  const options = listPalettesByBrand(brandId);

  return (
    <div className="w-full md:max-w-2xl rounded-xl border border-gray-100 bg-white p-4 shadow-md sm:p-5 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 flex flex-wrap items-center gap-4">
        <label className="text-xs font-medium text-gray-700 sm:text-sm dark:text-gray-300">
          品牌
          <select
            className="ml-2 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            value={brandId}
            onChange={(e) => {
              const nextBrand = e.target.value as BrandId;
              setBrandId(nextBrand);
              const first = listPalettesByBrand(nextBrand)[0];
              if (first) onChange(first);
            }}
          >
            {BRANDS.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-medium text-gray-700 sm:text-sm dark:text-gray-300">
          规格
          <select
            className="ml-2 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            value={paletteId}
            onChange={(e) => {
              const next = options.find((p) => p.id === e.target.value);
              if (next) onChange(next);
            }}
          >
            {options.map((palette) => (
              <option key={palette.id} value={palette.id}>
                {palette.name}（{palette.colors.length} 色）
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="button"
        onClick={onOpenColorPicker}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 px-3 py-2.5 font-medium text-white shadow-sm transition-all duration-200 hover:from-blue-600 hover:to-purple-600 hover:shadow-md"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z"
            clipRule="evenodd"
          />
        </svg>
        选择我有的色号（{selectedCount} / {totalCount}）
      </button>

      {isCustomPalette && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <p className="text-xs text-blue-500 dark:text-blue-400">
            当前只使用你勾选的 {selectedCount} 个色号，其余颜色不会出现在图纸里
          </p>
          <button
            type="button"
            onClick={onResetAll}
            className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            恢复全部色号
          </button>
        </div>
      )}
    </div>
  );
}
