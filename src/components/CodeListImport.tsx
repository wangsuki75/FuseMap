'use client';

import { useState } from 'react';
import { parseCodeList } from '../core/palette/selection';

interface Props {
  onApply: (codes: string[]) => void;
}

/**
 * 粘贴色号清单。
 *
 * 场景：用户从店家页面或色卡图上抄下一串色号，直接粘进来就能限定选色范围，
 * 比在几百个色号里逐个点选快得多。
 */
export default function CodeListImport({ onApply }: Props) {
  const [text, setText] = useState('');
  const codes = parseCodeList(text);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        粘贴你手上的色号清单
      </label>
      <textarea
        className="h-24 w-full rounded-lg border border-gray-300 p-2 font-mono text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        placeholder="支持逗号、空格、换行、顿号、分号分隔，例如：A1, A2, B3"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={codes.length === 0}
          onClick={() => onApply(codes)}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          只保留这 {codes.length} 个色号
        </button>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          清单里识别不到的色号会被忽略
        </span>
      </div>
    </div>
  );
}
