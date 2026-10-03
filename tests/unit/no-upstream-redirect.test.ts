import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * 防回归：基线的 page.tsx 里植入了基于 hostname 的强制跳转，
 * 非 localhost/内网访问会被 window.location.replace 弹到上游站点。
 * 本地开发永远踩不到，但部署到真实域名会让产品完全不可用。
 *
 * 这类代码很容易在后续合并上游更新时被带回来，且不会有人察觉，
 * 所以用测试钉死，而不是靠人记住。
 */

function collectSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collectSourceFiles(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

describe('不得把用户导流到上游站点', () => {
  const files = collectSourceFiles('src');

  it('源码里不出现上游域名', () => {
    const offenders = files.filter((file) =>
      readFileSync(file, 'utf8').toLowerCase().includes('zippland')
    );
    expect(offenders, `以下文件仍引用上游域名：\n${offenders.join('\n')}`).toEqual([]);
  });

  it('不存在基于 hostname 的强制跳转', () => {
    const offenders = files.filter((file) => {
      const text = readFileSync(file, 'utf8');
      return text.includes('window.location.replace') && text.includes('hostname');
    });
    expect(offenders, `以下文件仍含域名跳转：\n${offenders.join('\n')}`).toEqual([]);
  });
});
